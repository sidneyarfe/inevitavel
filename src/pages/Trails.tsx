import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Route, Plus, Trash2, Link2, Unlink, ChevronDown, ChevronUp, Sun, Moon as MoonIcon, Clock, Check } from "lucide-react";

type AnchorHabit = {
  id: string;
  name: string;
  icon: string;
  typical_time: string | null;
  sort_order: number;
  is_system: boolean;
};

type HabitOnTrack = {
  id: string;
  name: string;
  micro_action: string;
  preferred_time: string | null;
  anchor_id: string | null;
  anchor_position: string;
  anchor_sort_order: number;
  is_active: boolean;
  timer_duration: number;
  full_duration: number | null;
};

type Station = {
  type: "wake" | "sleep" | "anchor" | "habit";
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  time?: string;
  position?: "before" | "after";
  anchorName?: string;
  isAnchor?: boolean;
};

const ANCHOR_ICONS = ["☀️", "🍽️", "🦷", "🚿", "☕", "🏋️", "📖", "🌙"];

const timeToMinutes = (t: string | null) => {
  if (!t) return 720;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

type ViewMode = "map" | "manage";

const Trails = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [anchors, setAnchors] = useState<AnchorHabit[]>([]);
  const [habits, setHabits] = useState<HabitOnTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("map");

  // Manage state
  const [newAnchorName, setNewAnchorName] = useState("");
  const [newAnchorIcon, setNewAnchorIcon] = useState("☀️");
  const [newAnchorTime, setNewAnchorTime] = useState("");
  const [showAddAnchor, setShowAddAnchor] = useState(false);
  const [expandedAnchor, setExpandedAnchor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [linkingAnchorId, setLinkingAnchorId] = useState<string | null>(null);

  // Time settings
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [editingTimes, setEditingTimes] = useState(false);
  const [tempWake, setTempWake] = useState("06:00");
  const [tempSleep, setTempSleep] = useState("22:00");

  const loadData = async () => {
    if (!user) return;
    const [anchorsRes, habitsRes, profileRes] = await Promise.all([
      supabase.from("anchor_habits").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("habits").select("id, name, micro_action, preferred_time, anchor_id, anchor_position, anchor_sort_order, is_active, timer_duration, full_duration").eq("user_id", user.id).eq("is_active", true),
      supabase.from("profiles").select("wake_time, sleep_time").eq("user_id", user.id).maybeSingle(),
    ]);

    const w = (profileRes.data as any)?.wake_time?.slice(0, 5) || "06:00";
    const s = (profileRes.data as any)?.sleep_time?.slice(0, 5) || "22:00";
    setWakeTime(w); setSleepTime(s); setTempWake(w); setTempSleep(s);

    let anchorsData = (anchorsRes.data ?? []) as AnchorHabit[];

    // Auto-seed system anchors "Acordar" and "Dormir" if missing
    const hasWake = anchorsData.some((a) => a.is_system && a.name === "Acordar");
    const hasSleep = anchorsData.some((a) => a.is_system && a.name === "Dormir");
    if (!hasWake || !hasSleep) {
      const toInsert: any[] = [];
      if (!hasWake) toInsert.push({ user_id: user.id, name: "Acordar", icon: "☀️", typical_time: w + ":00", sort_order: -2, is_system: true });
      if (!hasSleep) toInsert.push({ user_id: user.id, name: "Dormir", icon: "🌙", typical_time: s + ":00", sort_order: 9999, is_system: true });
      await supabase.from("anchor_habits").insert(toInsert);
      const { data: refreshed } = await supabase.from("anchor_habits").select("*").eq("user_id", user.id).order("sort_order");
      anchorsData = (refreshed ?? []) as AnchorHabit[];
    } else {
      // Sync system anchor times with profile
      const wakeAnchor = anchorsData.find((a) => a.is_system && a.name === "Acordar");
      const sleepAnchor = anchorsData.find((a) => a.is_system && a.name === "Dormir");
      if (wakeAnchor && wakeAnchor.typical_time?.slice(0, 5) !== w) {
        await supabase.from("anchor_habits").update({ typical_time: w + ":00" }).eq("id", wakeAnchor.id);
      }
      if (sleepAnchor && sleepAnchor.typical_time?.slice(0, 5) !== s) {
        await supabase.from("anchor_habits").update({ typical_time: s + ":00" }).eq("id", sleepAnchor.id);
      }
    }

    setAnchors(anchorsData);
    if (habitsRes.data) setHabits(habitsRes.data as HabitOnTrack[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  // Refresh when habits change from another page (KeepAlive staleness fix)
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener("habits-changed", handler);
    return () => window.removeEventListener("habits-changed", handler);
  }, [user]);

  // Manage actions
  const addAnchor = async () => {
    if (!user || !newAnchorName.trim()) return;
    const { error } = await supabase.from("anchor_habits").insert({
      user_id: user.id, name: newAnchorName.trim(), icon: newAnchorIcon,
      typical_time: newAnchorTime || null, sort_order: anchors.length,
    });
    if (error) { toast({ title: "Erro.", description: error.message, variant: "destructive" }); return; }
    setNewAnchorName(""); setNewAnchorTime(""); setShowAddAnchor(false); loadData();
  };

  const deleteAnchor = async () => {
    if (!deleteTarget) return;
    const target = anchors.find((a) => a.id === deleteTarget);
    if (target?.is_system) return; // System anchors cannot be deleted
    await supabase.from("anchor_habits").delete().eq("id", deleteTarget);
    await supabase.from("habits").update({ anchor_id: null, anchor_sort_order: 0 }).eq("anchor_id", deleteTarget);
    setDeleteTarget(null); loadData();
  };

  const linkHabit = async (habitId: string, anchorId: string) => {
    const linked = habits.filter((h) => h.anchor_id === anchorId);
    await supabase.from("habits").update({ anchor_id: anchorId, anchor_sort_order: linked.length }).eq("id", habitId);
    setLinkingAnchorId(null); loadData();
  };

  const unlinkHabit = async (habitId: string) => {
    await supabase.from("habits").update({ anchor_id: null, anchor_sort_order: 0 }).eq("id", habitId);
    loadData();
  };

  const saveTimes = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ wake_time: tempWake, sleep_time: tempSleep }).eq("user_id", user.id);
    setWakeTime(tempWake); setSleepTime(tempSleep); setEditingTimes(false);
    // Also sync system anchor times
    const wakeAnchor = anchors.find((a) => a.is_system && a.name === "Acordar");
    const sleepAnchor = anchors.find((a) => a.is_system && a.name === "Dormir");
    if (wakeAnchor) await supabase.from("anchor_habits").update({ typical_time: tempWake + ":00" }).eq("id", wakeAnchor.id);
    if (sleepAnchor) await supabase.from("anchor_habits").update({ typical_time: tempSleep + ":00" }).eq("id", sleepAnchor.id);
    loadData();
    toast({ title: "Horários atualizados." });
  };

  const getLinkedHabits = (anchorId: string) =>
    habits.filter((h) => h.anchor_id === anchorId).sort((a, b) => a.anchor_sort_order - b.anchor_sort_order);
  const getUnlinkedHabits = () => habits.filter((h) => !h.anchor_id);

  // Build stations for map view
  const buildStations = (): Station[] => {
    const stations: Station[] = [];

    type TimeItem = { sortTime: number; stations: Station[] };
    const items: TimeItem[] = [];

    anchors.forEach((anchor) => {
      const anchorTime = timeToMinutes(anchor.typical_time?.slice(0, 5) ?? null);
      const beforeHabits = habits.filter((h) => h.anchor_id === anchor.id && h.anchor_position === "before")
        .sort((a, b) => a.anchor_sort_order - b.anchor_sort_order);
      const afterHabits = habits.filter((h) => h.anchor_id === anchor.id && h.anchor_position === "after")
        .sort((a, b) => a.anchor_sort_order - b.anchor_sort_order);

      const group: Station[] = [];
      const beforeReversed = [...beforeHabits].reverse();
      let beforeOffset = 0;
      const beforeWithTimes = beforeReversed.map((h) => {
        beforeOffset += Math.ceil(((h.timer_duration ?? 120) + (h.full_duration ?? 0)) / 60);
        const mins = anchorTime - beforeOffset;
        const adjusted = mins < 0 ? mins + 1440 : mins;
        return { ...h, computedTime: `${String(Math.floor(adjusted / 60) % 24).padStart(2, "0")}:${String(adjusted % 60).padStart(2, "0")}` };
      }).reverse();

      beforeWithTimes.forEach((h) => {
        group.push({ type: "habit", id: h.id, label: h.name, sublabel: h.micro_action, time: h.computedTime, position: "before", anchorName: anchor.name });
      });

      // System anchors render as terminal stations (wake/sleep)
      const stationType = anchor.is_system
        ? (anchor.name === "Acordar" ? "wake" : anchor.name === "Dormir" ? "sleep" : "anchor")
        : "anchor";
      group.push({ type: stationType, id: anchor.id, label: anchor.name, icon: anchor.icon, time: anchor.typical_time?.slice(0, 5) || undefined, isAnchor: true });

      let afterOffset = 0;
      afterHabits.forEach((h) => {
        const mins = anchorTime + afterOffset;
        group.push({ type: "habit", id: h.id, label: h.name, sublabel: h.micro_action, time: `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`, position: "after", anchorName: anchor.name });
        afterOffset += Math.ceil(((h.timer_duration ?? 120) + (h.full_duration ?? 0)) / 60);
      });
      items.push({ sortTime: anchorTime, stations: group });
    });

    habits.filter((h) => !h.anchor_id).forEach((h) => {
      items.push({
        sortTime: timeToMinutes(h.preferred_time?.slice(0, 5) ?? null),
        stations: [{ type: "habit", id: h.id, label: h.name, sublabel: h.micro_action, time: h.preferred_time?.slice(0, 5) || undefined }],
      });
    });

    items.sort((a, b) => a.sortTime - b.sortTime);
    items.forEach((item) => stations.push(...item.stations));
    return stations;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground animate-pulse-glow">Carregando trilhos...</p>
      </div>
    );
  }

  const stations = buildStations();

  return (
    <div className="px-4 pt-6 pb-4 md:px-8 lg:max-w-4xl lg:mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h2 className="font-display text-lg text-primary">Trilhos</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-sm overflow-hidden">
            <button
              onClick={() => setViewMode("map")}
              className={cn("px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors",
                viewMode === "map" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mapa
            </button>
            <button
              onClick={() => setViewMode("manage")}
              className={cn("px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors",
                viewMode === "manage" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Editar
            </button>
          </div>
          {viewMode === "manage" && (
            <Button onClick={() => setShowAddAnchor(!showAddAnchor)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-[10px] uppercase tracking-wider h-7">
              <Plus className="mr-1 h-3 w-3" /> Trilho
            </Button>
          )}
          {viewMode === "map" && (
            <Button onClick={() => setEditingTimes(!editingTimes)} size="sm" variant="outline" className="font-mono text-[10px] uppercase tracking-wider h-7">
              <Clock className="mr-1 h-3 w-3" /> Horários
            </Button>
          )}
        </div>
      </div>

      {/* ===== MAP VIEW ===== */}
      {viewMode === "map" && (
        <>
          <p className="font-mono text-[10px] text-muted-foreground mb-6 tracking-wider">
            Sua jornada diária, do acordar ao dormir.
          </p>

          {/* Time editor */}
          <AnimatePresence>
            {editingTimes && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="hud-border bg-card/60 p-4 mb-6 overflow-hidden">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Sun className="h-3 w-3" /> Acordar</label>
                    <Input type="time" value={tempWake} onChange={(e) => setTempWake(e.target.value)} className="border-border bg-secondary/50 text-foreground font-mono text-xs h-8" />
                  </div>
                  <div className="flex-1">
                    <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><MoonIcon className="h-3 w-3" /> Dormir</label>
                    <Input type="time" value={tempSleep} onChange={(e) => setTempSleep(e.target.value)} className="border-border bg-secondary/50 text-foreground font-mono text-xs h-8" />
                  </div>
                  <Button onClick={saveTimes} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80 h-8"><Check className="h-3 w-3" /></Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Train Track */}
          <div className="relative ml-6">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-primary/20" />
            {stations.map((station, i) => {
              const isTerminal = station.type === "wake" || station.type === "sleep";
              const isAnchor = station.type === "anchor";
              return (
                <motion.div key={station.id + i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cn("relative flex items-start gap-4 pb-1", isTerminal ? "pb-6" : "pb-4")}
                >
                  <div className="relative z-10 flex-shrink-0">
                    {isTerminal ? (
                      <div className="h-7 w-7 rounded-full border-2 border-primary bg-background flex items-center justify-center shadow-[0_0_12px_hsl(160_100%_50%/0.3)]">
                        <span className="text-sm">{station.icon}</span>
                      </div>
                    ) : isAnchor ? (
                      <div className="h-7 w-7 rounded-sm border-2 border-accent bg-background flex items-center justify-center">
                        <span className="text-sm">{station.icon}</span>
                      </div>
                    ) : (
                      <div className={cn("h-3 w-3 rounded-full border-2 mt-1.5 ml-2", station.position ? "border-primary/60 bg-primary/20" : "border-muted-foreground/40 bg-muted-foreground/10")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    {isTerminal ? (
                      <div><h3 className="font-display text-sm text-primary">{station.label}</h3><span className="font-mono text-[10px] text-muted-foreground">{station.time}</span></div>
                    ) : isAnchor ? (
                      <div><h3 className="font-display text-xs text-accent">{station.label}</h3>{station.time && <span className="font-mono text-[9px] text-muted-foreground">~{station.time}</span>}</div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display text-xs text-foreground">{station.label}</h3>
                          {station.time && <span className="font-mono text-[9px] text-muted-foreground">{station.time}</span>}
                        </div>
                        {station.sublabel && <p className="font-mono text-[9px] text-muted-foreground/60">{station.sublabel}</p>}
                        {station.anchorName && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Route className="h-2 w-2 text-primary/40" />
                            <span className="font-mono text-[8px] text-primary/50 uppercase tracking-wider">
                              {station.position === "before" ? "antes de" : "depois de"} {station.anchorName}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {habits.length === 0 && (
            <div className="text-center mt-8">
              <p className="font-mono text-[10px] text-muted-foreground">Nenhum hábito ativo. Crie hábitos para vê-los no mapa.</p>
            </div>
          )}
        </>
      )}

      {/* ===== MANAGE VIEW ===== */}
      {viewMode === "manage" && (
        <>
          <p className="font-mono text-[10px] text-muted-foreground mb-4 tracking-wider">
            Encadeie novos hábitos em rotinas já consolidadas.
          </p>

          {/* Add anchor form */}
          <AnimatePresence>
            {showAddAnchor && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="hud-border bg-card/60 backdrop-blur-sm p-4 mb-4 overflow-hidden">
                <h3 className="font-display text-sm text-primary mb-3">Novo Trilho</h3>
                <p className="font-mono text-[9px] text-muted-foreground mb-3">Trilhos são hábitos que você JÁ faz todo dia (almoçar, acordar, escovar dentes).</p>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {ANCHOR_ICONS.map((icon) => (
                    <button key={icon} onClick={() => setNewAnchorIcon(icon)} className={cn("h-8 w-8 rounded-sm text-base flex items-center justify-center border transition-colors", newAnchorIcon === icon ? "border-primary bg-primary/15" : "border-border bg-secondary/50 hover:border-primary/40")}>{icon}</button>
                  ))}
                </div>
                <div className="space-y-2">
                  <Input value={newAnchorName} onChange={(e) => setNewAnchorName(e.target.value)} placeholder="Ex: Almoçar, Acordar, Escovar dentes..." className="border-border bg-secondary/50 text-foreground font-mono text-xs h-8" onKeyDown={(e) => e.key === "Enter" && addAnchor()} />
                  <Input type="time" value={newAnchorTime} onChange={(e) => setNewAnchorTime(e.target.value)} className="border-border bg-secondary/50 text-foreground font-mono text-xs h-8" />
                  <div className="flex gap-2">
                    <Button onClick={addAnchor} disabled={!newAnchorName.trim()} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.12em] text-[10px] h-8">Criar Trilho</Button>
                    <Button onClick={() => setShowAddAnchor(false)} variant="outline" className="font-mono uppercase tracking-[0.12em] text-[10px] h-8">Cancelar</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Anchors list */}
          {anchors.length === 0 && !showAddAnchor ? (
            <div className="flex h-[40vh] flex-col items-center justify-center text-center px-6">
              <Route className="h-8 w-8 text-muted-foreground/30 mb-4" />
              <h3 className="font-display text-base text-primary">Nenhum trilho criado</h3>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground max-w-xs">Crie trilhos a partir de hábitos já fixos no seu dia.</p>
              <Button onClick={() => setShowAddAnchor(true)} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs hud-glow">
                <Plus className="mr-2 h-3 w-3" /> Criar Primeiro Trilho
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {anchors.map((anchor) => {
                const linked = getLinkedHabits(anchor.id);
                const isExpanded = expandedAnchor === anchor.id;
                const isLinking = linkingAnchorId === anchor.id;
                return (
                  <motion.div key={anchor.id} layout className="hud-border bg-card/60 backdrop-blur-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedAnchor(isExpanded ? null : anchor.id)}>
                      <span className="text-lg">{anchor.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display text-sm text-primary">{anchor.name}</h3>
                          {anchor.is_system && <span className="font-mono text-[7px] text-muted-foreground/60 uppercase tracking-wider border border-border/50 px-1 py-0.5 rounded-sm">fixo</span>}
                        </div>
                        {anchor.typical_time && <span className="font-mono text-[9px] text-muted-foreground">~{anchor.typical_time.slice(0, 5)}</span>}
                      </div>
                      <span className="font-mono text-[9px] text-muted-foreground">{linked.length} {linked.length === 1 ? "hábito" : "hábitos"}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4">
                            <div className="ml-3 border-l-2 border-primary/20 pl-4 space-y-1">
                              {linked.length === 0 && <p className="font-mono text-[10px] text-muted-foreground/50 py-2">Nenhum hábito encadeado ainda.</p>}
                              {linked.map((habit) => (
                                <div key={habit.id} className="flex items-center gap-2 py-1.5 group">
                                  <div className="h-2 w-2 rounded-full bg-primary/40 -ml-[21px] border-2 border-card" />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-display text-xs text-foreground">{habit.name}</span>
                                    <span className="font-mono text-[9px] text-muted-foreground ml-2">{habit.micro_action}</span>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); unlinkHabit(habit.id); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Unlink className="h-3 w-3" /></button>
                                </div>
                              ))}
                            </div>
                            {!isLinking ? (
                              <div className="flex gap-2 mt-3">
                                <Button onClick={() => setLinkingAnchorId(anchor.id)} variant="outline" size="sm" className="font-mono text-[10px] uppercase tracking-wider h-7" disabled={getUnlinkedHabits().length === 0}>
                                  <Link2 className="mr-1 h-3 w-3" /> Encadear
                                </Button>
                                {!anchor.is_system && (
                                  <Button onClick={() => setDeleteTarget(anchor.id)} variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                                )}
                              </div>
                            ) : (
                              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 border border-primary/20 rounded-sm p-3 bg-primary/5">
                                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Selecione o hábito:</p>
                                <div className="space-y-1">
                                  {getUnlinkedHabits().map((habit) => (
                                    <button key={habit.id} onClick={() => linkHabit(habit.id, anchor.id)} className="w-full text-left p-2 rounded-sm hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all">
                                      <span className="font-display text-xs text-foreground">{habit.name}</span>
                                      <span className="font-mono text-[9px] text-muted-foreground ml-2">{habit.micro_action}</span>
                                    </button>
                                  ))}
                                  {getUnlinkedHabits().length === 0 && <p className="font-mono text-[10px] text-muted-foreground text-center py-2">Todos os hábitos já estão encadeados.</p>}
                                </div>
                                <Button onClick={() => setLinkingAnchorId(null)} variant="ghost" size="sm" className="mt-2 font-mono text-[10px] uppercase tracking-wider h-7 w-full">Cancelar</Button>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-[0.2em] text-primary text-sm">Remover Trilho</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-[11px] text-muted-foreground">Os hábitos encadeados serão desvinculados, mas não excluídos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-[10px] uppercase tracking-wider">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAnchor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-[10px] uppercase tracking-wider">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Trails;
