import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, AlertTriangle, Plus, Trash2, Moon, Sun, Clock, Zap, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BriefingSkeleton } from "@/components/HudSkeleton";
import { motion, AnimatePresence } from "framer-motion";

type ChecklistItem = { label: string; checked: boolean };
type TomorrowHabit = { name: string; micro_action: string; preferred_time: string | null };

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { label: "Roupa pronta?", checked: false },
  { label: "Material visível?", checked: false },
  { label: "Celular fora do alcance?", checked: false },
  { label: "Primeira ação de amanhã definida?", checked: false },
];

const Briefing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [loading, setLoading] = useState(true);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [justCheckedIndex, setJustCheckedIndex] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tomorrowHabits, setTomorrowHabits] = useState<TomorrowHabit[]>([]);
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);

  const currentHour = new Date().getHours();
  const isBriefingTime = currentHour >= 20 || currentHour < 5;

  const getTimeContext = () => {
    if (currentHour >= 20 && currentHour < 23) return { label: "Janela de preparação ativa", color: "text-primary", icon: Moon };
    if (currentHour >= 23 || currentHour < 2) return { label: "Preparação tardia — execute agora", color: "text-accent", icon: Moon };
    if (currentHour >= 2 && currentHour < 5) return { label: "Madrugada — finalize a preparação", color: "text-warning", icon: Moon };
    return { label: "Fora da janela noturna", color: "text-warning", icon: Sun };
  };

  const timeCtx = getTimeContext();
  const TimeIcon = timeCtx.icon;

  useEffect(() => { loadBriefing(); loadTomorrowHabits(); }, [user]);

  const loadBriefing = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const [briefingRes, profileRes] = await Promise.all([
      supabase.from("evening_briefings").select("*").eq("user_id", user.id).eq("briefing_date", today).maybeSingle(),
      supabase.from("profiles").select("checklist_template").eq("user_id", user.id).maybeSingle(),
    ]);

    if (briefingRes.error || profileRes.error) {
      toast({ title: "Erro de conexão.", description: "Falha ao carregar briefing.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const savedTemplate = profileRes.data?.checklist_template as unknown as ChecklistItem[];
    const template = Array.isArray(savedTemplate) && savedTemplate.length > 0
      ? savedTemplate.map((t) => ({ label: t.label, checked: false }))
      : DEFAULT_CHECKLIST;

    if (briefingRes.data) {
      const checklist = briefingRes.data.checklist_items as unknown as ChecklistItem[];
      setItems(Array.isArray(checklist) && checklist.length > 0 ? checklist : template);
    } else {
      setItems(template);
    }
    setLoading(false);
  };

  const loadTomorrowHabits = async () => {
    if (!user) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDay();

    const [habitsRes, anchorsRes] = await Promise.all([
      supabase.from("habits").select("id, name, micro_action, preferred_time, days_of_week, anchor_id").eq("user_id", user.id).eq("is_active", true),
      supabase.from("anchor_habits").select("id, name, typical_time").eq("user_id", user.id)
    ]);

    if (habitsRes.data) {
      const anchorMap = new Map<string, { name: string; time: string }>();
      anchorsRes.data?.forEach((a: any) => {
        if (a.typical_time) anchorMap.set(a.id, { name: a.name, time: a.typical_time });
      });

      const filtered = habitsRes.data
        .filter((h: any) => h.days_of_week?.includes(tomorrowDay))
        .map((h: any) => {
          let time = h.preferred_time;
          let label = "";

          if (h.anchor_id && anchorMap.has(h.anchor_id)) {
            const anchor = anchorMap.get(h.anchor_id)!;
            time = anchor.time;
            label = ` (${anchor.name})`; // Optional: show anchor name
          }

          return {
            name: h.name,
            micro_action: h.micro_action,
            preferred_time: time,
            anchorLabel: label
          };
        })
        .sort((a: any, b: any) => (a.preferred_time || "23:59").localeCompare(b.preferred_time || "23:59"));

      setTomorrowHabits(filtered);
    }
  };

  // Auto-save with debounce
  const autoSave = useCallback(async (updatedItems: ChecklistItem[]) => {
    if (!user) return;
    setIsSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const allConfirmed = updatedItems.length > 0 && updatedItems.every((item) => item.checked);

    const { error } = await supabase
      .from("evening_briefings")
      .upsert(
        [{ user_id: user.id, briefing_date: today, checklist_items: JSON.parse(JSON.stringify(updatedItems)), all_confirmed: allConfirmed }],
        { onConflict: "user_id,briefing_date" }
      );

    if (error) {
      toast({ title: "Erro.", description: "Falha ao salvar briefing.", variant: "destructive" });
    }
    setIsSaving(false);
  }, [user, toast]);

  const scheduleSave = useCallback((updatedItems: ChecklistItem[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => autoSave(updatedItems), 1000);
  }, [autoSave]);

  const toggleItem = (index: number) => {
    const updated = items.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item));
    setItems(updated);
    setJustCheckedIndex(updated[index].checked ? index : null);
    if (updated[index].checked) {
      setTimeout(() => setJustCheckedIndex(null), 800);
    }
    // Check if all just completed
    const nowAllDone = updated.length > 0 && updated.every(it => it.checked);
    if (nowAllDone) {
      setShowCompletionFlash(true);
      setTimeout(() => setShowCompletionFlash(false), 2000);
    }
    scheduleSave(updated);
  };

  const addItem = () => {
    const label = newItemLabel.trim();
    if (!label) return;
    const updated = [...items, { label: label.endsWith("?") ? label : label + "?", checked: false }];
    setItems(updated);
    setNewItemLabel("");
    scheduleSave(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    scheduleSave(updated);
  };

  const saveTemplate = async () => {
    if (!user) return;
    const template = items.map((item) => ({ label: item.label, checked: false }));
    const { error } = await supabase
      .from("profiles")
      .update({ checklist_template: JSON.parse(JSON.stringify(template)) })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro.", description: "Falha ao salvar template.", variant: "destructive" });
    } else {
      toast({ title: "Template salvo.", description: "Este checklist será usado nos próximos dias." });
    }
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const allConfirmed = totalCount > 0 && checkedCount === totalCount;
  const progressPercent = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  // SVG circle math
  const circleRadius = 36;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (loading) return <BriefingSkeleton />;

  return (
    <div className="relative min-h-[80vh]">
      {/* Completion flash overlay */}
      <AnimatePresence>
        {showCompletionFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 pointer-events-none bg-primary/5"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center px-4 pt-6 pb-8 md:px-8">
        {/* ── HEADER ── */}
        <div className="text-center mb-6 w-full max-w-sm md:max-w-md">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Moon className="h-4 w-4 text-primary/60" />
            <h2 className="font-display text-lg text-primary">Briefing Noturno</h2>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
            O sucesso do dia de amanhã depende da noite de hoje.
          </p>
        </div>

        {/* ── BLOCO 1: CONTEXTO ── */}
        <div className="w-full max-w-sm md:max-w-md mb-5">
          <div className="hud-border bg-card/40 backdrop-blur-sm p-4 space-y-3">
            {/* Time status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TimeIcon className={`h-3.5 w-3.5 ${timeCtx.color}`} />
                <span className={`font-mono text-[10px] uppercase tracking-wider ${timeCtx.color}`}>
                  {timeCtx.label}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Tomorrow's habits preview */}
            {tomorrowHabits.length > 0 && (
              <div className="pt-2 border-t border-border/30">
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-2">
                  Hábitos de amanhã ({tomorrowHabits.length})
                </span>
                <div className="space-y-1.5">
                  {tomorrowHabits.map((habit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-primary/50 shrink-0" />
                      <span className="font-mono text-[11px] text-foreground/80 flex-1 truncate">{habit.name}</span>
                      {habit.preferred_time && (
                        <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                          {habit.preferred_time.slice(0, 5)}
                          {(habit as any).anchorLabel && <span className="opacity-70">{(habit as any).anchorLabel}</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Not briefing time warning */}
        {!isBriefingTime && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm md:max-w-md mb-4 flex items-center gap-2 px-3 py-2 rounded-sm bg-warning/10 border border-warning/30"
          >
            <Sun className="h-3.5 w-3.5 text-warning shrink-0" />
            <span className="font-mono text-[10px] text-warning">
              Modo diurno — edite a lista, mas só marque à noite (20h–05h).
            </span>
          </motion.div>
        )}

        {/* ── BLOCO 2: CHECKLIST + PROGRESS ── */}
        <div className="w-full max-w-sm md:max-w-md flex gap-4 items-start mb-4">
          {/* Circular progress */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative">
              <svg width="88" height="88" className="-rotate-90">
                {/* Background circle */}
                <circle
                  cx="44" cy="44" r={circleRadius}
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="3"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="44" cy="44" r={circleRadius}
                  fill="none"
                  stroke={allConfirmed ? "hsl(160 100% 50%)" : "hsl(var(--primary))"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={checkedCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-lg text-primary"
                >
                  {checkedCount}
                </motion.span>
                <span className="font-mono text-[8px] text-muted-foreground uppercase">de {totalCount}</span>
              </div>
            </div>
          </div>

          {/* Checklist card */}
          <div className="flex-1 hud-border hud-corner bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="p-4 space-y-0">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={`${item.label}-${index}`}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2.5 py-2 border-b border-border/20 last:border-0 group"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleItem(index)}
                      disabled={!isBriefingTime && !item.checked}
                      className="h-4.5 w-4.5 shrink-0"
                    />
                    <motion.span
                      animate={
                        justCheckedIndex === index
                          ? { scale: [1, 1.03, 1], color: "hsl(160 100% 50%)" }
                          : {}
                      }
                      transition={{ duration: 0.4 }}
                      className={`font-mono text-[11px] md:text-xs transition-all duration-300 flex-1 leading-tight ${item.checked
                        ? "text-primary/70 line-through"
                        : "text-foreground"
                        }`}
                    >
                      {item.label}
                    </motion.span>

                    {/* Check animation on complete */}
                    <AnimatePresence>
                      {item.checked && justCheckedIndex === index && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {editMode && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {editMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 pt-3 border-t border-border/30"
                >
                  <Input
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    placeholder="Novo item..."
                    className="border-border bg-secondary/50 text-foreground font-mono text-[10px] h-7"
                  />
                  <button onClick={addItem} className="text-primary hover:text-primary/80 transition-colors shrink-0">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Edit controls */}
        <div className="w-full max-w-sm md:max-w-md flex items-center gap-4 mb-5">
          <button
            onClick={() => setEditMode(!editMode)}
            className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors tracking-wider uppercase"
          >
            {editMode ? "[ Concluir Edição ]" : "[ Editar ]"}
          </button>
          {editMode && (
            <button
              onClick={saveTemplate}
              className="font-mono text-[10px] text-primary/70 hover:text-primary transition-colors tracking-wider uppercase"
            >
              [ Salvar Template ]
            </button>
          )}
          <AnimatePresence>
            {isSaving && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[9px] text-muted-foreground/60 tracking-wider ml-auto"
              >
                Salvando...
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* ── BLOCO 3: SELO DE CONCLUSÃO ── */}
        <div className="w-full max-w-sm md:max-w-md">
          <AnimatePresence mode="wait">
            {allConfirmed ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="hud-border bg-primary/5 border-primary/30 p-6 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="flex justify-center mb-3"
                >
                  <Shield className="h-8 w-8 text-primary hud-text-glow" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="font-display text-base text-primary hud-text-glow tracking-[0.2em] uppercase mb-2"
                >
                  Decisão Registrada
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="font-mono text-[11px] text-primary/70 tracking-wider"
                >
                  Amanhã é inevitável.
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="pending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 px-4 py-3 hud-border bg-destructive/5 border-destructive/20"
              >
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <div>
                  <span className="font-mono text-[11px] text-destructive uppercase tracking-wider block">
                    Preparação incompleta
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {totalCount - checkedCount} {totalCount - checkedCount === 1 ? "item pendente" : "itens pendentes"} para liberar amanhã.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Briefing;
