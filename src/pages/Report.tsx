import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Minus, Flame, Calendar, CalendarDays, Zap, Target, Clock, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ConsistencyChart from "@/components/reports/ConsistencyChart";
import TimeInvestedChart from "@/components/reports/TimeInvestedChart";
import WeekComparisonChart from "@/components/reports/WeekComparisonChart";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  addWeeks, addMonths, format, eachDayOfInterval,
  isToday, isFuture, subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type HabitRow = { id: string; name: string; days_of_week: number[]; is_active: boolean };
type ExecRow = {
  habit_id: string;
  execution_date: string;
  status: "pending" | "executed" | "failed";
  completion_type?: string;
  duration_seconds?: number | null;
};
type ViewMode = "week" | "month";

function calculateStreak(habitId: string, daysOfWeek: number[], allExecs: ExecRow[]): number {
  const execSet = new Set(
    allExecs.filter((e) => e.habit_id === habitId && e.status === "executed").map((e) => e.execution_date)
  );
  let streak = 0;
  let checkDate = new Date();
  for (let i = 0; i < 90; i++) {
    const dayOfWeek = checkDate.getDay();
    if (daysOfWeek.includes(dayOfWeek)) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      if (i === 0 && isToday(checkDate)) {
        if (execSet.has(dateStr)) streak++;
        checkDate = subDays(checkDate, 1);
        continue;
      }
      if (execSet.has(dateStr)) streak++;
      else break;
    }
    checkDate = subDays(checkDate, 1);
  }
  return streak;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h${rem}m` : `${hrs}h`;
}

const Report = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [executions, setExecutions] = useState<ExecRow[]>([]);
  const [allExecs, setAllExecs] = useState<ExecRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleGridDays, setCycleGridDays] = useState<boolean[]>([]);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycleDay, setCycleDay] = useState(0);
  const [frictionReasons, setFrictionReasons] = useState<{ habitName: string; reason: string; count: number }[]>([]);

  const referenceDate = useMemo(
    () => viewMode === "week" ? addWeeks(new Date(), offset) : addMonths(new Date(), offset),
    [offset, viewMode]
  );
  const periodStart = useMemo(
    () => viewMode === "week" ? startOfWeek(referenceDate, { weekStartsOn: 0 }) : startOfMonth(referenceDate),
    [referenceDate, viewMode]
  );
  const periodEnd = useMemo(
    () => viewMode === "week" ? endOfWeek(referenceDate, { weekStartsOn: 0 }) : endOfMonth(referenceDate),
    [referenceDate, viewMode]
  );
  const days = useMemo(() => eachDayOfInterval({ start: periodStart, end: periodEnd }), [periodStart, periodEnd]);

  const startStr = format(periodStart, "yyyy-MM-dd");
  const endStr = format(periodEnd, "yyyy-MM-dd");

  useEffect(() => { setOffset(0); }, [viewMode]);

  useEffect(() => {
    if (!user) return;
    loadData();
    loadFrictionData();
  }, [user, startStr, endStr]);

  const loadData = async () => {
    setLoading(true);
    const streakStartStr = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const [habitsRes, execsRes, allExecsRes] = await Promise.all([
      supabase.from("habits").select("id, name, days_of_week, is_active").eq("user_id", user!.id).eq("is_active", true),
      supabase.from("daily_executions").select("habit_id, execution_date, status, completion_type, duration_seconds")
        .eq("user_id", user!.id).gte("execution_date", startStr).lte("execution_date", endStr),
      supabase.from("daily_executions").select("habit_id, execution_date, status, completion_type, duration_seconds")
        .eq("user_id", user!.id).gte("execution_date", streakStartStr),
    ]);
    if (habitsRes.error || execsRes.error) {
      toast({ title: "Erro.", description: "Falha ao carregar relatório.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setHabits(habitsRes.data ?? []);
    const mapExec = (e: any): ExecRow => ({
      ...e,
      status: e.status as ExecRow["status"],
      completion_type: e.completion_type ?? "micro",
      duration_seconds: e.duration_seconds ?? null,
    });
    setExecutions((execsRes.data ?? []).map(mapExec));
    setAllExecs((allExecsRes.data ?? []).map(mapExec));
    setLoading(false);

    // Compute 42-day grid: count distinct dates with executed habits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allExecData = (allExecsRes.data ?? []).map(mapExec);
    const executedDates = new Set(allExecData.filter(e => e.status === "executed").map(e => e.execution_date));
    const sortedDates = [...executedDates].sort();
    const totalExecutedDays = Math.min(sortedDates.length, 42);
    setCycleDay(totalExecutedDays);
    // Build grid: each of the 42 slots represents one executed day
    const grid: boolean[] = [];
    for (let d = 0; d < 42; d++) {
      grid.push(d < totalExecutedDays);
    }
    setCycleGridDays(grid);
    if (totalExecutedDays >= 42) {
      setShowCycleModal(true);
    }
  };

  const loadFrictionData = async () => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
    const { data } = await supabase
      .from("friction_audits")
      .select("reason, daily_executions!inner(habit_id, habits!inner(name))")
      .eq("user_id", user.id)
      .gte("created_at", dateStr) as { data: any[] | null };
    if (data && data.length > 0) {
      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.reason) {
          const habitName = (row as any).daily_executions?.habits?.name || "Desconhecido";
          const key = `${habitName}|||${row.reason.trim().toLowerCase()}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key, count]) => {
          const [habitName, reason] = key.split("|||");
          return { habitName, reason, count };
        });
      setFrictionReasons(sorted);
    }
  };

  const getExec = (habitId: string, date: Date) => {
    if (isFuture(date) && !isToday(date)) return { status: "future" as const, completion_type: undefined };
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return { status: "na" as const, completion_type: undefined };
    if (!habit.days_of_week.includes(date.getDay())) return { status: "na" as const, completion_type: undefined };
    const dateStr = format(date, "yyyy-MM-dd");
    const exec = executions.find((e) => e.habit_id === habitId && e.execution_date === dateStr);
    return {
      status: (exec?.status ?? "pending") as "executed" | "failed" | "pending",
      completion_type: exec?.completion_type,
    };
  };

  const stats = useMemo(() => {
    let total = 0, executed = 0, failed = 0, micro = 0, full = 0;
    habits.forEach((habit) => {
      days.forEach((day) => {
        const e = getExec(habit.id, day);
        if (e.status === "executed" || e.status === "failed" || e.status === "pending") total++;
        if (e.status === "executed") {
          executed++;
          if (e.completion_type === "full") full++;
          else micro++;
        }
        if (e.status === "failed") failed++;
      });
    });
    const rate = total > 0 ? Math.round((executed / total) * 100) : 0;
    return { total, executed, failed, rate, micro, full };
  }, [habits, executions, days]);

  // Accumulated duration per habit
  const habitDurations = useMemo(() => {
    const map: Record<string, number> = {};
    executions.forEach((e) => {
      if (e.status === "executed" && e.duration_seconds) {
        map[e.habit_id] = (map[e.habit_id] ?? 0) + e.duration_seconds;
      }
    });
    return map;
  }, [executions]);

  const isCurrent = offset === 0;
  const periodLabel = viewMode === "week"
    ? `${format(periodStart, "dd MMM", { locale: ptBR })} — ${format(periodEnd, "dd MMM yyyy", { locale: ptBR })}`
    : format(referenceDate, "MMMM yyyy", { locale: ptBR });

  const weeks = useMemo(() => {
    if (viewMode === "week") return [days];
    const result: Date[][] = [];
    let currentWeek: Date[] = [];
    const firstDayOfWeek = days[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null as unknown as Date);
    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) { result.push(currentWeek); currentWeek = []; }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null as unknown as Date);
      result.push(currentWeek);
    }
    return result;
  }, [days, viewMode]);

  const StatusIcon = ({ status, completionType }: { status: string; completionType?: string }) => {
    if (status === "executed") {
      return completionType === "full"
        ? <Target className="h-3 w-3 text-accent" />
        : <Zap className="h-3 w-3 text-primary" />;
    }
    if (status === "failed") return <XCircle className="h-3 w-3 text-destructive" />;
    if (status === "pending") return <Minus className="h-2.5 w-2.5 text-muted-foreground/30" />;
    if (status === "na") return <Minus className="h-3 w-3 text-muted-foreground/20" />;
    return <Minus className="h-2.5 w-2.5 text-muted-foreground/20" />;
  };

  return (
    <div className="flex flex-col px-4 pt-6 pb-4 md:px-8 lg:max-w-5xl lg:mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h2 className="font-display text-lg text-primary">
          Arquivo de Identidade
        </h2>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 mb-4 self-start">
        {(["week", "month"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-sm border transition-colors",
              viewMode === mode
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground"
            )}
          >
            {mode === "week" ? <Calendar className="h-3 w-3 inline mr-1" /> : <CalendarDays className="h-3 w-3 inline mr-1" />}
            {mode === "week" ? "Semana" : "Mês"}
          </button>
        ))}
      </div>

      {/* Period navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setOffset((o) => o - 1)} className="text-muted-foreground hover:text-primary transition-colors p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <span className="font-mono text-[11px] text-foreground capitalize">{periodLabel}</span>
          {isCurrent && (
            <span className="block font-mono text-[9px] text-primary uppercase tracking-wider mt-0.5">
              {viewMode === "week" ? "Semana atual" : "Mês atual"}
            </span>
          )}
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={isCurrent}
          className="text-muted-foreground hover:text-primary transition-colors p-1 disabled:opacity-20"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4 md:gap-3">
        <div className="hud-border bg-card/60 p-2.5 md:p-4 text-center">
          <span className="font-mono text-lg text-primary hud-text-glow">{stats.rate}%</span>
          <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Eficiência</span>
        </div>
        <div className="hud-border bg-card/60 p-2.5 md:p-4 text-center">
          <span className="font-mono text-lg text-primary">{stats.executed}</span>
          <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Provas</span>
        </div>
        <div className="hud-border bg-card/60 p-2.5 md:p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            <span className="font-mono text-lg text-primary">{stats.micro}</span>
          </div>
          <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Micro-ação</span>
        </div>
        <div className="hud-border bg-card/60 p-2.5 md:p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Target className="h-3 w-3 text-accent" />
            <span className="font-mono text-lg text-accent">{stats.full}</span>
          </div>
          <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">Ação Completa</span>
        </div>
      </div>

      {/* 42-Day Identity Grid */}
      {cycleGridDays.length > 0 && (
        <div className="mb-6 hud-border bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Construção de Identidade — Ciclo de 42 dias</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cycleGridDays.map((done, i) => (
              <div
                key={i}
                className={cn(
                  "h-6 rounded-[2px] flex items-center justify-center transition-all text-[7px] font-mono",
                  i < cycleDay
                    ? done
                      ? "bg-primary/30 text-primary border border-primary/40"
                      : "bg-destructive/15 text-destructive/60 border border-destructive/20"
                    : "bg-secondary/30 text-muted-foreground/30 border border-border/20"
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-muted-foreground mt-2 text-center">
            Dia {cycleDay} de 42 — {cycleGridDays.filter(Boolean).length} provas registradas neste ciclo
          </p>
        </div>
      )}

      {/* Cycle Completion Modal */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-primary/30 rounded-sm p-6 max-w-md w-full mx-4 text-center space-y-4">
            <Shield className="h-10 w-10 text-primary mx-auto hud-text-glow" />
            <h3 className="font-display text-lg text-primary">Ciclo Consolidado</h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              Parabéns por se tornar o tipo de pessoa que cumpre o que promete.
            </p>
            <p className="font-mono text-[10px] text-foreground/70">
              Escolha sua próxima fase:
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCycleModal(false)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-[10px] uppercase tracking-wider"
              >
                Reforçar
              </Button>
              <Button
                onClick={() => { setShowCycleModal(false); window.location.href = "/habitos"; }}
                variant="outline"
                className="flex-1 font-mono text-[10px] uppercase tracking-wider border-primary/30 text-primary"
              >
                Evoluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hud-border bg-card/60 p-4 animate-pulse">
              <div className="h-4 w-28 bg-primary/10 rounded-sm mb-3" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <div key={d} className="h-8 w-8 bg-primary/10 rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="flex h-[30vh] flex-col items-center justify-center text-center px-6">
          <Calendar className="h-6 w-6 text-muted-foreground/30 mb-3" />
          <p className="font-mono text-xs text-muted-foreground">Nenhum hábito ativo para gerar arquivo.</p>
          <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">Execute seus hábitos para ver suas provas aqui.</p>
        </div>
      ) : stats.executed === 0 && stats.total > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-col items-center justify-center text-center px-6 py-8 hud-border bg-card/60">
            <Minus className="h-6 w-6 text-muted-foreground/30 mb-3" />
            <p className="font-mono text-xs text-muted-foreground">Sem execuções neste período.</p>
            <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">
              {stats.total} {stats.total === 1 ? "execução esperada" : "execuções esperadas"}, nenhuma registrada.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const streak = calculateStreak(habit.id, habit.days_of_week, allExecs);
            const totalDuration = habitDurations[habit.id];
            return (
              <div key={habit.id} className="hud-border bg-card/60 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-sm text-primary">{habit.name}</h3>
                  <div className="flex items-center gap-2">
                    {totalDuration != null && totalDuration > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-[9px] text-muted-foreground">{formatDuration(totalDuration)}</span>
                      </div>
                    )}
                    {streak >= 2 && (
                      <div className="flex items-center gap-1">
                        <Flame className={cn("h-3.5 w-3.5", streak >= 7 ? "text-accent" : "text-primary/70")} />
                        <span className={cn("font-mono text-[10px] font-bold", streak >= 7 ? "text-accent hud-text-glow" : "text-primary/70")}>
                          {streak}d
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {viewMode === "week" ? (
                  <div className="grid grid-cols-7 gap-1.5">
                    {days.map((day) => {
                      const exec = getExec(habit.id, day);
                      const dayLabel = format(day, "EEE", { locale: ptBR }).slice(0, 3);
                      const dayNum = format(day, "dd");
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-sm p-1.5 transition-all",
                            isToday(day) && "ring-1 ring-primary/40",
                            exec.status === "executed" && exec.completion_type === "full" && "bg-accent/15",
                            exec.status === "executed" && exec.completion_type !== "full" && "bg-primary/15",
                            exec.status === "failed" && "bg-destructive/15",
                            exec.status === "na" && "bg-secondary/30",
                            exec.status === "future" && "bg-secondary/10 opacity-40",
                            exec.status === "pending" && "bg-secondary/50"
                          )}
                        >
                          <span className="font-mono text-[8px] text-muted-foreground uppercase">{dayLabel}</span>
                          <span className="font-mono text-[10px] text-foreground/70">{dayNum}</span>
                          <div className="mt-1">
                            <StatusIcon status={exec.status} completionType={exec.completion_type} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                        <span key={i} className="font-mono text-[7px] text-muted-foreground/50 text-center uppercase">{d}</span>
                      ))}
                    </div>
                    {weeks.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-0.5">
                        {week.map((day, di) => {
                          if (!day) return <div key={di} className="h-5" />;
                          const exec = getExec(habit.id, day);
                          return (
                            <div
                              key={day.toISOString()}
                              className={cn(
                                "h-5 rounded-[2px] flex items-center justify-center transition-all",
                                isToday(day) && "ring-1 ring-primary/50",
                                exec.status === "executed" && exec.completion_type === "full" && "bg-accent/25",
                                exec.status === "executed" && exec.completion_type !== "full" && "bg-primary/25",
                                exec.status === "failed" && "bg-destructive/25",
                                exec.status === "na" && "bg-secondary/20",
                                exec.status === "future" && "bg-secondary/10 opacity-30",
                                exec.status === "pending" && "bg-secondary/40"
                              )}
                              title={format(day, "dd/MM")}
                            >
                              <span className="font-mono text-[7px] text-foreground/50">{format(day, "d")}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Legend for this habit */}
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                    <span className="font-mono text-[8px] text-muted-foreground">Micro-ação</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-2.5 w-2.5 text-accent" />
                    <span className="font-mono text-[8px] text-muted-foreground">Ação Completa</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Analytics */}
      {!loading && habits.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            <h2 className="font-display text-lg text-accent">Diagnóstico Estrutural</h2>
          </div>

          <ConsistencyChart days={days} habits={habits} getExec={getExec} />
          <TimeInvestedChart habits={habits} executions={executions} />
          {user && <WeekComparisonChart userId={user.id} habits={habits} />}
        </div>
      )}

      {/* Friction Patterns */}
      {!loading && frictionReasons.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-display text-lg text-destructive">Padrões de Atrito</h2>
          </div>
          <div className="hud-border bg-card/60 backdrop-blur-sm p-4">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-3">
              Motivos mais frequentes (últimos 30 dias)
            </p>
            <div className="space-y-2">
              {frictionReasons.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-[9px] text-primary uppercase tracking-wider whitespace-nowrap">{item.habitName}</span>
                    <span className="font-mono text-[9px] text-muted-foreground/50">·</span>
                    <span className="font-mono text-xs text-foreground truncate">{item.reason}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{item.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
