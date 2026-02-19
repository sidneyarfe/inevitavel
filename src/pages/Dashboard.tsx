import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Crosshair, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DashboardSkeleton } from "@/components/HudSkeleton";
import FrictionAudit from "@/components/FrictionAudit";
import { useStreak } from "@/hooks/useStreak";
import ContextualGreeting from "@/components/dashboard/ContextualGreeting";
import ProgressBarHud from "@/components/dashboard/ProgressBarHud";
import StreakBadge from "@/components/dashboard/StreakBadge";
import DesktopSidePanel from "@/components/dashboard/DesktopSidePanel";
import { groupExecutions, PeriodHeader, getCurrentPeriod, getPeriodState } from "@/components/dashboard/ExecutionGroup";
import ExecutionCard from "@/components/dashboard/ExecutionCard";
import Onboarding from "@/components/Onboarding";
import { PullToRefresh } from "@/components/PullToRefresh";
import { RefreshCw } from "lucide-react";
import type { Execution } from "@/types/execution";

type TimerPhase = "idle" | "micro" | "prompt" | "full";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [loading, setLoading] = useState(true);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [overdueExecutions, setOverdueExecutions] = useState<{ id: string; habit_name: string; micro_action: string; preferred_time: string | null }[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const { streak, loading: streakLoading } = useStreak(user?.id);

  const [timerPhase, setTimerPhase] = useState<TimerPhase>("idle");
  const [isPaused, setIsPaused] = useState(false);
  const [timerDuration, setTimerDuration] = useState(120);
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("inevitavel_onboarding_done");
  });

  const loadTodayExecutions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dayOfWeek = now.getDay();

    const [habitsRes, anchorsRes] = await Promise.all([
      supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .contains("days_of_week", [dayOfWeek]),
      supabase
        .from("anchor_habits")
        .select("id, name, typical_time")
        .eq("user_id", user.id),
    ]);

    const habits = habitsRes.data;
    const habitsErr = habitsRes.error;
    const anchorMap = new Map<string, { name: string; typical_time: string | null }>();
    (anchorsRes.data ?? []).forEach((a: any) => anchorMap.set(a.id, { name: a.name, typical_time: a.typical_time }));

    if (habitsErr) {
      toast({ title: "Erro de conexão.", description: "Falha ao carregar hábitos.", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!habits || habits.length === 0) {
      setExecutions([]);
      setLoading(false);
      return;
    }

    const upsertPayload = habits.map((habit) => ({
      user_id: user.id,
      habit_id: habit.id,
      execution_date: today,
      status: "pending" as const,
    }));

    await supabase
      .from("daily_executions")
      .upsert(upsertPayload, { onConflict: "habit_id,execution_date", ignoreDuplicates: true });

    const { data: execs, error: execsErr } = await supabase
      .from("daily_executions")
      .select("id, habit_id, status, duration_seconds, completion_type")
      .eq("user_id", user.id)
      .eq("execution_date", today);

    if (execsErr) {
      toast({ title: "Erro de conexão.", description: "Falha ao carregar execuções.", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (execs) {
      // Compute effective times for linked habits
      const computeEffectiveTime = (habit: any): string | null => {
        if (!habit.anchor_id) return habit.preferred_time ?? null;
        const anchor = anchorMap.get(habit.anchor_id);
        if (!anchor?.typical_time) return habit.preferred_time ?? null;
        const [ah, am] = anchor.typical_time.slice(0, 5).split(":").map(Number);
        let anchorMinutes = ah * 60 + am;
        const position = habit.anchor_position ?? "after";
        // Get all habits linked to same anchor with same position, sorted
        const sameGroup = habits.filter(
          (h: any) => h.anchor_id === habit.anchor_id && (h.anchor_position ?? "after") === position
        ).sort((a: any, b: any) => a.anchor_sort_order - b.anchor_sort_order);
        if (position === "after") {
          let offset = 0;
          for (const h of sameGroup) {
            if (h.id === habit.id) break;
            offset += (h.timer_duration ?? 120) + (h.full_duration ?? 0);
          }
          const totalMin = anchorMinutes + Math.ceil(offset / 60);
          const hh = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
          const mm = String(totalMin % 60).padStart(2, "0");
          return `${hh}:${mm}:00`;
        } else {
          // before: offset backwards
          let offset = 0;
          for (const h of [...sameGroup].reverse()) {
            if (h.id === habit.id) break;
            offset += (h.timer_duration ?? 120) + (h.full_duration ?? 0);
          }
          offset += (habit.timer_duration ?? 120) + (habit.full_duration ?? 0);
          const totalMin = anchorMinutes - Math.ceil(offset / 60);
          const adjusted = totalMin < 0 ? totalMin + 1440 : totalMin;
          const hh = String(Math.floor(adjusted / 60) % 24).padStart(2, "0");
          const mm = String(adjusted % 60).padStart(2, "0");
          return `${hh}:${mm}:00`;
        }
      };

      // Filter out orphan executions whose habit is not active today
      const habitIds = new Set(habits.map((h) => h.id));
      const validExecs = execs.filter((e) => habitIds.has(e.habit_id));

      const mapped: Execution[] = validExecs.map((e) => {
        const habit = habits.find((h) => h.id === e.habit_id)!;
        const anchor = habit.anchor_id ? anchorMap.get(habit.anchor_id) : null;
        return {
          ...e,
          status: e.status as "pending" | "executed" | "failed",
          completion_type: (e.completion_type ?? "micro") as "micro" | "full",
          habit_name: habit.name,
          micro_action: habit.micro_action ?? "Executar 2 minutos",
          trigger_cue: habit.trigger_cue ?? null,
          preferred_time: computeEffectiveTime(habit),
          timer_duration: (habit as any).timer_duration ?? 120,
          full_duration: (habit as any).full_duration ?? null,
          anchor_name: anchor?.name ?? null,
          anchor_position: (habit as any).anchor_position ?? null,
        };
      });
      setExecutions(mapped);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { loadTodayExecutions().then(() => setHasMounted(true)); }, [loadTodayExecutions]);

  // Fetch 42-day cycle info: count distinct dates with at least 1 executed habit
  useEffect(() => {
    if (!user) return;
    const fetchCycleDay = async () => {
      const { data } = await supabase
        .from("daily_executions")
        .select("execution_date")
        .eq("user_id", user.id)
        .eq("status", "executed");
      if (data && data.length > 0) {
        const uniqueDates = new Set(data.map((d: any) => d.execution_date));
        setCycleDay(Math.min(uniqueDates.size, 42));
      } else {
        setCycleDay(0);
      }
    };
    fetchCycleDay();
  }, [user]);


  // Detect overdue executions for friction audit
  useEffect(() => {
    if (loading || executions.length === 0) return;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isLateNight = currentHour >= 22;

    const overdue = executions.filter((exec) => {
      if (exec.status !== "pending") return false;
      if (isLateNight) return true;
      if (!exec.preferred_time) return false;
      const [h, m] = exec.preferred_time.split(":").map(Number);
      const habitMinutes = h * 60 + m;
      return currentMinutes > habitMinutes + 60;
    });

    if (overdue.length > 0) {
      const auditedKey = `audit_${now.toISOString().split("T")[0]}`;
      const alreadyAudited = JSON.parse(localStorage.getItem(auditedKey) || "[]") as string[];
      const unaudited = overdue.filter((e) => !alreadyAudited.includes(e.id));

      if (unaudited.length > 0 && !showAudit) {
        setOverdueExecutions(unaudited.map((e) => ({
          id: e.id,
          habit_name: e.habit_name,
          micro_action: e.micro_action,
          preferred_time: e.preferred_time,
        })));
        setShowAudit(true);
      }
    }
  }, [loading, executions]);

  // Timer tick
  useEffect(() => {
    if (!activeTimer || timeLeft <= 0 || isPaused || timerPhase === "prompt") return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [activeTimer, timeLeft, isPaused, timerPhase]);

  // Timer complete
  useEffect(() => {
    if (timeLeft === 0 && activeTimer && timerPhase !== "prompt" && timerPhase !== "idle") {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

      if (timerPhase === "micro") {
        const exec = executions.find((e) => e.id === activeTimer);
        if (exec?.full_duration) {
          // Show prompt to continue with full action
          setTimerPhase("prompt");
          return;
        }
      }
      // Complete (micro without full_duration, or full phase done)
      handleComplete(activeTimer);
    }
  }, [timeLeft, activeTimer, timerPhase]);

  const handleStart = (id: string) => {
    const exec = executions.find((e) => e.id === id);
    const dur = exec?.timer_duration ?? 120;
    setTimerDuration(dur);
    setActiveTimer(id);
    setTimeLeft(dur);
    setTimerPhase("micro");
    setIsPaused(false);
  };

  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);

  const handleStartFull = (id: string) => {
    const exec = executions.find((e) => e.id === id);
    const dur = exec?.full_duration ?? 1800;
    setTimerDuration(dur);
    setTimeLeft(dur);
    setTimerPhase("full");
    setIsPaused(false);
  };

  const handleSkipFull = (id: string) => {
    // Complete as micro only
    finishExecution(id, "micro");
  };

  const handleComplete = async (id: string) => {
    if (timerPhase === "micro") {
      const exec = executions.find((e) => e.id === id);
      if (exec?.full_duration) {
        setTimerPhase("prompt");
        return;
      }
    }
    const completionType = timerPhase === "full" ? "full" : "micro";
    finishExecution(id, completionType);
  };

  const finishExecution = async (id: string, completionType: "micro" | "full") => {
    const elapsed = timerDuration - timeLeft;
    setFlashId(id);
    if (navigator.vibrate) navigator.vibrate(50);
    setActiveTimer(null);
    setTimeLeft(120);
    setTimerPhase("idle");
    setIsPaused(false);

    setExecutions((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "executed" as const, duration_seconds: elapsed, completion_type: completionType } : e
      )
    );

    setTimeout(() => setFlashId(null), 600);

    const { error } = await supabase
      .from("daily_executions")
      .update({ status: "executed" as const, duration_seconds: elapsed, completion_type: completionType })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro.", description: "Falha ao registrar execução.", variant: "destructive" });
      loadTodayExecutions();
    }
  };

  const handleUndo = async (id: string) => {
    setExpandedId(null);
    setExecutions((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "pending" as const, duration_seconds: null, completion_type: "micro" as const } : e
      )
    );

    const { error } = await supabase
      .from("daily_executions")
      .update({ status: "pending" as const, duration_seconds: null, completion_type: "micro" })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro.", description: "Falha ao desfazer.", variant: "destructive" });
      loadTodayExecutions();
    }
  };

  const handleFail = async (id: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setExecutions((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "failed" as const } : e
      )
    );
    const { error } = await supabase
      .from("daily_executions")
      .update({ status: "failed" as const })
      .eq("id", id);
    if (error) {
      toast({ title: "Erro.", description: "Falha ao registrar.", variant: "destructive" });
      loadTodayExecutions();
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const pendingCount = executions.filter((e) => e.status === "pending").length;
  const executedCount = executions.filter((e) => e.status === "executed").length;

  if (showOnboarding) {
    return (
      <Onboarding
        userId={user?.id}
        onComplete={() => {
          localStorage.setItem("inevitavel_onboarding_done", "true");
          setShowOnboarding(false);
          loadTodayExecutions();
        }}
      />
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (executions.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Crosshair className="h-8 w-8 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-lg text-primary">Nenhum hábito ativo</h2>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground max-w-xs">
          Configure seus hábitos para ativar o Sistema de Ação Inevitável.
        </p>
        <Button onClick={() => navigate("/habitos")} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs hud-glow">
          <ArrowRight className="mr-2 h-3 w-3" /> Criar Hábitos
        </Button>
      </div>
    );
  }

  const handleAuditDismiss = () => {
    const today = new Date().toISOString().split("T")[0];

    const auditedKey = `audit_${today}`;
    const alreadyAudited = JSON.parse(localStorage.getItem(auditedKey) || "[]") as string[];
    const newAudited = [...alreadyAudited, ...overdueExecutions.map((e) => e.id)];
    localStorage.setItem(auditedKey, JSON.stringify(newAudited));
    setShowAudit(false);
    setOverdueExecutions([]);
  };

  const handleExecuteNow = (executionId: string) => {
    handleStart(executionId);
    // Do not remove from overdueExecutions here; let the status change and effect handle it naturally
    // setOverdueExecutions((prev) => prev.filter((e) => e.id !== executionId));
  };

  const mobileSlot = typeof document !== 'undefined' ? document.getElementById('mobile-identity-slot') : null;
  const cyclePct = cycleDay !== null ? Math.round((cycleDay / 42) * 100) : 0;

  return (
    <div className="flex flex-col px-4 md:px-8 pt-6 pb-4 lg:max-w-6xl lg:mx-auto">
      {/* Mobile identity bar — portaled into header */}
      {cycleDay !== null && mobileSlot && createPortal(
        <div className="relative h-6 w-28 bg-secondary/60 border border-border/50 rounded-sm overflow-hidden hud-border">
          <div
            className="absolute inset-y-0 left-0 bg-primary/25 transition-all duration-700"
            style={{ width: `${cyclePct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] text-primary uppercase tracking-widest z-10">
            Dia {cycleDay}/42
          </span>
        </div>,
        mobileSlot
      )}

      {showAudit && overdueExecutions.length > 0 && (
        <FrictionAudit
          overdue={overdueExecutions}
          onDismiss={handleAuditDismiss}
          onExecuteNow={handleExecuteNow}
        />
      )}

      <PullToRefresh onRefresh={loadTodayExecutions}>
        <div className="flex justify-between items-start mb-4">
          {user && <ContextualGreeting userId={user.id} pendingCount={pendingCount} />}
          <Button onClick={loadTodayExecutions} variant="ghost" size="icon" className="h-8 w-8 text-primary/50 hover:text-primary">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Mobile: streak + progress inline */}
        <div className="lg:hidden">
          <div className="mb-4 px-1">
            <StreakBadge streak={streak} loading={streakLoading} />
          </div>
          <ProgressBarHud executed={executedCount} total={executions.length} />
        </div>

        {/* Desktop 2-column layout */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-8">
          {/* Main column */}
          <div>
            {groupExecutions(executions).map((group) => {
              const groupExecuted = group.executions.filter((e) => e.status === "executed").length;
              const currentPeriod = getCurrentPeriod();
              const periodState = getPeriodState(group.period, currentPeriod);
              const isFuture = periodState === "future";
              const isPast = periodState === "past";
              const groupAllDone = group.executions.every((e) => e.status === "executed");
              const groupHasActiveTimer = group.executions.some((e) => activeTimer === e.id);
              const dimmed = (isFuture || (isPast && groupAllDone)) && !groupHasActiveTimer;
              return (
                <div key={group.period} className={cn("transition-opacity duration-500", dimmed && "opacity-30")}>
                  <PeriodHeader
                    period={group.period}
                    executedCount={groupExecuted}
                    totalCount={group.executions.length}
                    periodState={periodState}
                  />
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {group.executions.map((exec, i) => {
                        const isActive = activeTimer === exec.id;
                        const isFlashing = flashId === exec.id;
                        const isOverdue = !isFuture && exec.status === "pending" && !!exec.preferred_time && (() => {
                          const now = new Date();
                          const [h, m] = exec.preferred_time!.split(":").map(Number);
                          return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
                        })();
                        return (
                          <ExecutionCard
                            key={exec.id}
                            exec={exec}
                            index={i}
                            isActive={isActive}
                            isFlashing={isFlashing}
                            isOverdue={isOverdue}
                            isFuture={isFuture}
                            isExpanded={expandedId === exec.id}
                            hasMounted={hasMounted}
                            activeTimer={activeTimer}
                            timeLeft={timeLeft}
                            timerDuration={timerDuration}
                            timerPhase={isActive ? timerPhase : "idle"}
                            isPaused={isActive ? isPaused : false}
                            formatTime={formatTime}
                            onStart={handleStart}
                            onComplete={handleComplete}
                            onUndo={handleUndo}
                            onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                            onPause={handlePause}
                            onResume={handleResume}
                            onStartFull={handleStartFull}
                            onSkipFull={handleSkipFull}
                            onFail={handleFail}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop side panel */}
          <DesktopSidePanel
            streak={streak}
            streakLoading={streakLoading}
            executedCount={executedCount}
            totalCount={executions.length}
            cycleDay={cycleDay}
          />
        </div>
      </PullToRefresh>
    </div>
  );
};

export default Dashboard;
