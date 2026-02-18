import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Check, Crosshair, Zap, Route, CalendarDays, Timer, Expand, Plus, ChevronDown, ChevronUp, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TIMER_OPTIONS = [
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
];

const ANCHOR_ICONS = ["☀️", "🍽️", "🦷", "🚿", "☕", "🏋️", "📖", "🌙"];

type AnchorHabit = {
  id: string;
  name: string;
  icon: string;
};

type WizardData = {
  name: string;
  micro_action: string;
  preferred_time: string;
  trigger_cue: string;
  days_of_week: number[];
  timer_duration: number;
  full_duration: number | null;
  anchor_id: string | null;
  anchor_position: "before" | "after";
};

type HabitWizardProps = {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
  initialData?: WizardData;
  userId?: string;
};

const CORE_STEPS = [
  { key: "name", label: "Engrenagem 1: Missão", icon: Crosshair, question: "Qual é a ação que você quer tornar inevitável?" },
  { key: "micro_action", label: "Engrenagem 2: Micro-ação", icon: Zap, question: "Qual a versão mínima? (2 minutos — pequena demais para gerar resistência)" },
  { key: "trail", label: "Engrenagem 3: Trilho", icon: Route, question: "Acoplar em qual trilho inevitável da rotina?" },
  { key: "environment", label: "Engrenagem 4: Ambiente", icon: Layers, question: "O que você vai preparar na véspera?" },
  { key: "days_of_week", label: "Engrenagem 5: Ativação", icon: CalendarDays, question: "Em quais dias e configurações?" },
];

const HabitWizard = ({ onComplete, onCancel, initialData, userId }: HabitWizardProps) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(
    initialData ?? {
      name: "",
      micro_action: "",
      preferred_time: "",
      trigger_cue: "",
      days_of_week: [0, 1, 2, 3, 4, 5, 6],
      timer_duration: 120,
      full_duration: null,
      anchor_id: null,
      anchor_position: "after",
    }
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fullDurationInput, setFullDurationInput] = useState(
    initialData?.full_duration ? String(initialData.full_duration / 60) : ""
  );

  // Trail state
  const [anchors, setAnchors] = useState<AnchorHabit[]>([]);
  const [showCreateTrail, setShowCreateTrail] = useState(false);
  const [newTrailName, setNewTrailName] = useState("");
  const [newTrailIcon, setNewTrailIcon] = useState("☀️");

  useEffect(() => {
    if (userId) {
      supabase.from("anchor_habits").select("id, name, icon").eq("user_id", userId).order("sort_order").then(({ data }) => {
        if (data) setAnchors(data as AnchorHabit[]);
      });
    }
  }, [userId]);

  const steps = CORE_STEPS;
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const canProceed =
    current.key === "name" ? data.name.trim().length > 0 :
      current.key === "micro_action" ? data.micro_action.trim().length > 0 :
        current.key === "days_of_week" ? data.days_of_week.length > 0 :
          true; // environment is optional

  const next = () => {
    if (isLast) {
      onComplete(data);
    } else {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const prev = () => {
    if (step === 0) onCancel();
    else setStep((s) => s - 1);
  };

  const toggleDay = (day: number) => {
    setData((d) => ({
      ...d,
      days_of_week: d.days_of_week.includes(day)
        ? d.days_of_week.filter((x) => x !== day)
        : [...d.days_of_week, day].sort(),
    }));
  };

  const handleFullDurationChange = (value: string) => {
    setFullDurationInput(value);
    const mins = parseInt(value, 10);
    if (!value.trim() || isNaN(mins) || mins <= 0) {
      setData((d) => ({ ...d, full_duration: null }));
    } else {
      setData((d) => ({ ...d, full_duration: mins * 60 }));
    }
  };

  const createTrail = async () => {
    if (!userId || !newTrailName.trim()) return;
    const { data: created, error } = await supabase.from("anchor_habits").insert({
      user_id: userId, name: newTrailName.trim(), icon: newTrailIcon, sort_order: anchors.length,
    }).select("id, name, icon").single();
    if (!error && created) {
      setAnchors((prev) => [...prev, created as AnchorHabit]);
      setData((d) => ({ ...d, anchor_id: created.id }));
      setShowCreateTrail(false);
      setNewTrailName("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md overflow-y-auto">
      {/* Progress */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prev} className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
            {step === 0 ? "Cancelar" : <span className="flex items-center gap-1"><ArrowLeft className="h-3 w-3" /> Voltar</span>}
          </button>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {step + 1}/{steps.length}
          </span>
        </div>
        <div className="h-0.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}
            className="w-full max-w-sm flex flex-col items-center text-center"
          >
            <current.icon className="h-8 w-8 text-primary mb-4 hud-text-glow" style={{ filter: "drop-shadow(0 0 8px hsl(160 100% 50% / 0.3))" }} />
            <h2 className="font-display text-lg text-primary mb-2">{current.label}</h2>
            <p className="font-mono text-[11px] text-muted-foreground mb-8">{current.question}</p>

            {current.key === "name" && (
              <Input autoFocus value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })}
                placeholder="Ex: Leitura, Treino, Meditação" className="border-border bg-secondary/50 text-foreground font-mono text-sm text-center"
                onKeyDown={(e) => e.key === "Enter" && canProceed && next()} />
            )}

            {current.key === "micro_action" && (
              <div className="w-full space-y-3">
                <Input autoFocus value={data.micro_action} onChange={(e) => setData({ ...data, micro_action: e.target.value })}
                  placeholder="Ex: Abrir o livro, Sentar na cadeira, Vestir o tênis" className="border-border bg-secondary/50 text-foreground font-mono text-sm text-center"
                  onKeyDown={(e) => e.key === "Enter" && canProceed && next()} />
                <p className="font-mono text-[9px] text-muted-foreground italic">A menor ação possível. O objetivo é começar, não completar.</p>
              </div>
            )}

            {current.key === "trail" && (
              <div className="w-full space-y-3">
                {!showCreateTrail ? (
                  <>
                    {data.anchor_id && (
                      <div className="flex gap-2 justify-center mb-2">
                        <button onClick={() => setData({ ...data, anchor_position: "before" })} className={cn("px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border transition-all", data.anchor_position === "before" ? "bg-primary/15 text-primary border-primary/50" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30")}>Antes</button>
                        <button onClick={() => setData({ ...data, anchor_position: "after" })} className={cn("px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-wider border transition-all", data.anchor_position === "after" ? "bg-primary/15 text-primary border-primary/50" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30")}>Depois</button>
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {anchors.map((anchor) => (
                        <button key={anchor.id} onClick={() => setData({ ...data, anchor_id: data.anchor_id === anchor.id ? null : anchor.id })}
                          className={cn("w-full flex items-center gap-2 p-3 rounded-sm border transition-all text-left", data.anchor_id === anchor.id ? "bg-primary/15 border-primary/50" : "bg-secondary/50 border-border hover:border-primary/30")}>
                          <span className="text-base">{anchor.icon}</span>
                          <span className="font-display text-xs text-foreground">{anchor.name}</span>
                          {data.anchor_id === anchor.id && <span className="ml-auto font-mono text-[9px] text-primary uppercase">{data.anchor_position === "before" ? "antes" : "depois"}</span>}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowCreateTrail(true)} className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-sm border border-dashed border-primary/30 text-primary/70 hover:bg-primary/5 transition-all">
                      <Plus className="h-3 w-3" /><span className="font-mono text-[10px] uppercase tracking-wider">Criar novo trilho</span>
                    </button>
                    <p className="font-mono text-[9px] text-muted-foreground italic">Opcional. Encadeie em uma rotina já consolidada.</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {ANCHOR_ICONS.map((icon) => (
                        <button key={icon} onClick={() => setNewTrailIcon(icon)} className={cn("h-8 w-8 rounded-sm text-base flex items-center justify-center border transition-colors", newTrailIcon === icon ? "border-primary bg-primary/15" : "border-border bg-secondary/50 hover:border-primary/40")}>{icon}</button>
                      ))}
                    </div>
                    <Input autoFocus value={newTrailName} onChange={(e) => setNewTrailName(e.target.value)} placeholder="Ex: Almoçar, Acordar..." className="border-border bg-secondary/50 text-foreground font-mono text-xs text-center" onKeyDown={(e) => e.key === "Enter" && newTrailName.trim() && createTrail()} />
                    <div className="flex gap-2">
                      <Button onClick={createTrail} disabled={!newTrailName.trim()} size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-[10px] uppercase tracking-wider h-8">Criar Trilho</Button>
                      <Button onClick={() => setShowCreateTrail(false)} variant="outline" size="sm" className="font-mono text-[10px] uppercase tracking-wider h-8">Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {current.key === "environment" && (
              <div className="w-full space-y-3">
                <Input autoFocus value={data.trigger_cue} onChange={(e) => setData({ ...data, trigger_cue: e.target.value })}
                  placeholder="Ex: Deixar o livro aberto, Separar o tênis, Celular fora do quarto" className="border-border bg-secondary/50 text-foreground font-mono text-sm text-center"
                  onKeyDown={(e) => e.key === "Enter" && next()} />
                <button
                  onClick={() => { setData({ ...data, trigger_cue: "" }); next(); }}
                  className="w-full py-2 rounded-sm border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-primary/30 font-mono text-[10px] uppercase tracking-wider transition-all"
                >
                  Não se aplica
                </button>
                <p className="font-mono text-[9px] text-muted-foreground italic">O caminho certo vira o mais fácil. Prepare o ambiente para eliminar a negociação.</p>
              </div>
            )}

            {current.key === "days_of_week" && (
              <div className="w-full space-y-6">
                <div className="flex gap-3 flex-wrap justify-center">
                  {DAYS.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)} className={cn("w-12 h-12 rounded-sm font-mono text-xs uppercase tracking-wider transition-all duration-200 border", data.days_of_week.includes(i) ? "bg-primary/15 text-primary border-primary/50 hud-glow" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30")}>{d}</button>
                  ))}
                </div>

                {/* Advanced settings - collapsible */}
                <div className="w-full">
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-1.5 py-2 text-muted-foreground hover:text-foreground transition-colors">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Configurações avançadas</span>
                    {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-4 pt-3 border-t border-border mt-2">
                          {/* Timer duration */}
                          <div>
                            <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                              <Timer className="h-3 w-3" /> Timer da micro-ação
                            </label>
                            <div className="flex gap-2 justify-center">
                              {TIMER_OPTIONS.map((opt) => (
                                <button key={opt.value} onClick={() => setData({ ...data, timer_duration: opt.value })}
                                  className={cn("w-14 h-10 rounded-sm font-mono text-[10px] uppercase tracking-wider border flex items-center justify-center transition-all",
                                    data.timer_duration === opt.value ? "bg-primary/15 text-primary border-primary/50" : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
                                  )}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Full duration */}
                          <div>
                            <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                              <Expand className="h-3 w-3" /> Ação Completa (opcional)
                            </label>
                            <div className="flex items-center justify-center gap-2">
                              <Input type="number" min="1" value={fullDurationInput} onChange={(e) => handleFullDurationChange(e.target.value)} placeholder="Ex: 30" className="border-border bg-secondary/50 text-foreground font-mono text-xs text-center w-20 h-8" />
                              <span className="font-mono text-[10px] text-muted-foreground">min</span>
                              {data.full_duration && (
                                <button onClick={() => { setFullDurationInput(""); setData((d) => ({ ...d, full_duration: null })); }} className="font-mono text-[9px] text-muted-foreground underline hover:text-foreground">✕</button>
                              )}
                            </div>
                          </div>

                          {/* Preferred time (only for unlinked habits) */}
                          {!data.anchor_id && (
                            <div>
                              <label className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" /> Horário preferido
                              </label>
                              <Input type="time" value={data.preferred_time} onChange={(e) => setData({ ...data, preferred_time: e.target.value })} className="border-border bg-secondary/50 text-foreground font-mono text-xs text-center h-8" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Action button */}
            <Button onClick={next} disabled={!canProceed} className="w-full mt-8 bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-12 hud-glow disabled:opacity-30">
              {isLast ? <><Check className="mr-2 h-4 w-4" /> Instalar Hábito</> : <><ArrowRight className="mr-2 h-4 w-4" /> Próximo</>}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HabitWizard;
