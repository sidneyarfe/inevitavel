import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Target, ChevronRight,
  CheckCircle2, AlertTriangle, Clock, Crosshair,
  Brain, Cog, ArrowRight, Route, ClipboardList,
  Sun, Moon, Coffee, Plus, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type OnboardingStep = {
  id: string;
  component: React.FC<{ onNext: () => void; userId?: string }>;
};

/* ─── Typing effect hook ─── */
function useTypingEffect(text: string, speed = 40, startDelay = 300) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ─── Step 1: System Boot ─── */
const StepBoot: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [phase, setPhase] = useState(0);
  const lines = [
    "INEVITÁVEL v1.0",
    "Inicializando sistema...",
    "Carregando sistema de ação inevitável...",
    "Protocolo de inevitabilidade: ATIVO",
  ];

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setPhase(i + 1), 600 + i * 800)
    );
    const final = setTimeout(() => onNext(), 600 + lines.length * 800 + 1200);
    return () => { timers.forEach(clearTimeout); clearTimeout(final); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-xs space-y-2"
      >
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={phase > i ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className={cn(
              "font-mono text-[11px]",
              i === lines.length - 1 ? "text-primary hud-text-glow" : "text-muted-foreground"
            )}>
              {phase > i && ">"} {line}
            </span>
            {phase > i && i === lines.length - 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <CheckCircle2 className="h-3 w-3 text-primary" />
              </motion.div>
            )}
          </motion.div>
        ))}
        {phase >= lines.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="h-0.5 w-full bg-primary/30 mt-4 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1 }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

/* ─── Step 2: The Problem ─── */
const StepProblem: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { displayed: q1, done: d1 } = useTypingEffect("Por que você falha nos seus hábitos?", 35, 300);
  const [showOptions, setShowOptions] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => { if (d1) setTimeout(() => setShowOptions(true), 400); }, [d1]);

  const options = [
    { icon: Brain, label: "Falta de motivação" },
    { icon: AlertTriangle, label: "Falta de disciplina" },
    { icon: Clock, label: "Falta de tempo" },
  ];

  const handleSelect = (i: number) => {
    setSelected(i);
    setTimeout(() => setShowReveal(true), 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <motion.div className="w-full max-w-sm text-center">
        <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-6" style={{ filter: "drop-shadow(0 0 8px hsl(45 100% 50% / 0.3))" }} />

        <p className="font-display text-lg text-foreground mb-8 min-h-[28px]">
          {q1}
          {!d1 && <span className="animate-pulse">▊</span>}
        </p>

        <AnimatePresence>
          {showOptions && !showReveal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {options.map((opt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-sm border transition-all duration-300",
                    selected === i
                      ? "border-warning/50 bg-warning/10 text-warning"
                      : selected !== null
                        ? "opacity-30 border-border"
                        : "border-border bg-card/50 text-foreground hover:border-primary/30"
                  )}
                >
                  <opt.icon className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-sm">{opt.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReveal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2"
            >
              <motion.div
                className="border border-destructive/30 bg-destructive/5 rounded-sm p-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="font-mono text-xs text-destructive/80 line-through mb-2">
                  {options[selected!]?.label}
                </p>
                <p className="font-display text-base text-foreground">
                  Resposta errada.
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="font-mono text-[11px] text-muted-foreground mb-6"
              >
                A ciência mostra que o problema nunca é você.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                <Button
                  onClick={onNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-10 hud-glow"
                >
                  Então o que é? <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

/* ─── Step 3: The Big Idea ─── */
const StepBigIdea: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 2000);
    const t3 = setTimeout(() => setPhase(3), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-sm text-center">
        <AnimatePresence mode="wait">
          {phase >= 1 && phase < 2 && (
            <motion.div
              key="line1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              <p className="font-display text-2xl text-foreground">
                Disciplina
              </p>
              <p className="font-display text-2xl text-muted-foreground">
                não é força de vontade.
              </p>
            </motion.div>
          )}

          {phase >= 2 && phase < 3 && (
            <motion.div
              key="line2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="font-display text-2xl text-foreground">
                Disciplina é
              </p>
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <span className="font-display text-2xl text-primary hud-text-glow whitespace-nowrap">
                    estrutura
                  </span>
                </motion.div>
                <span className="font-display text-2xl text-muted-foreground">+</span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="overflow-hidden"
                >
                  <span className="font-display text-2xl text-primary hud-text-glow whitespace-nowrap">
                    ambiente
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}

          {phase >= 3 && (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <p className="font-display text-2xl text-foreground">
                  Disciplina é
                </p>
                <p className="font-display text-2xl text-primary hud-text-glow">
                  consequência.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 pt-4"
              >
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Cog, label: "Estrutura", desc: "Sistema > Vontade" },
                    { icon: Layers, label: "Ambiente", desc: "Preparação > Esforço" },
                    { icon: Zap, label: "Micro-ação", desc: "Início > Conclusão" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.15 }}
                      className="border border-primary/20 bg-primary/5 rounded-sm p-3 text-center"
                    >
                      <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="font-display text-[11px] text-primary">{item.label}</p>
                      <p className="font-mono text-[8px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <Button
                    onClick={onNext}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-10 hud-glow"
                  >
                    Como funciona? <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Step 4: The 3 Pillars ─── */
const StepPillars: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisibleCount(1), 400),
      setTimeout(() => setVisibleCount(2), 900),
      setTimeout(() => setVisibleCount(3), 1400),
      setTimeout(() => setVisibleCount(4), 1900),
      setTimeout(() => setVisibleCount(5), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const pillars = [
    {
      icon: Zap,
      title: "Micro-ação",
      subtitle: "Engrenagem 1",
      desc: "Começa com 2 minutos. Pequeno demais para gerar resistência. O objetivo é movimento, não performance.",
    },
    {
      icon: Route,
      title: "Trilho Inevitável",
      subtitle: "Engrenagem 2",
      desc: "A ação é acoplada a algo que já acontece. Café, almoço, banho — o início já está embutido.",
    },
    {
      icon: Moon,
      title: "Pré-decisão",
      subtitle: "Engrenagem 3",
      desc: "A decisão é tomada na noite anterior. Antes do cansaço. Antes da negociação.",
    },
    {
      icon: Layers,
      title: "Ambiente",
      subtitle: "Engrenagem 4",
      desc: "O ambiente é preparado antes. O livro aberto, o tênis separado. O caminho certo vira o mais fácil.",
    },
    {
      icon: Shield,
      title: "Prova Registrada",
      subtitle: "Engrenagem 5",
      desc: "Cada execução vira prova objetiva. Não sensação — evidência. Histórico que reconstrói identidade.",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Crosshair className="h-7 w-7 text-primary mx-auto mb-3" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.3))" }} />
          <h2 className="font-display text-lg text-primary mb-1">5 Engrenagens do Sistema</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            Como o Inevitável elimina negociação interna.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {pillars.map((pillar, i) => (
            <AnimatePresence key={i}>
              {visibleCount > i && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border border-primary/20 bg-card/60 rounded-sm p-4 flex gap-4"
                >
                  <div className="shrink-0 h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center">
                    <pillar.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="font-display text-sm text-primary">{pillar.title}</h3>
                      <span className="font-mono text-[9px] text-muted-foreground">{pillar.subtitle}</span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">{pillar.desc}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {visibleCount >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-10 hud-glow"
              >
                Instalar minha primeira engrenagem <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Step 5: First Trail Setup ─── */
const StepFirstTrail: React.FC<{ onNext: () => void; userId?: string }> = ({ onNext, userId }) => {
  const { toast } = useToast();
  const [subStep, setSubStep] = useState(0); // 0: times, 1: trail, 2: habit
  const [saving, setSaving] = useState(false);

  // Form state
  const [wakeTime, setWakeTime] = useState("06:00");
  const [sleepTime, setSleepTime] = useState("22:00");
  const [trailName, setTrailName] = useState("");
  const [trailTime, setTrailTime] = useState("07:00");
  const [habitName, setHabitName] = useState("");
  const [microAction, setMicroAction] = useState("");

  // Data created
  const [createdTrailId, setCreatedTrailId] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{ trailName: string; habitName: string; microAction: string; trailTime: string } | null>(null);

  const trailSuggestions = [
    { name: "Café da manhã", icon: "coffee", time: "07:00" },
    { name: "Almoço", icon: "utensils", time: "12:00" },
    { name: "Fim do trabalho", icon: "briefcase", time: "18:00" },
  ];

  const handleSaveTimesAndContinue = async () => {
    if (!userId) return;
    setSaving(true);

    // Upsert profile with wake/sleep times
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        wake_time: `${wakeTime}:00`,
        sleep_time: `${sleepTime}:00`,
      }, { onConflict: "user_id" });

    if (profileErr) {
      toast({ title: "Erro", description: "Falha ao salvar horários.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Seed system anchors (Acordar + Dormir)
    await supabase
      .from("anchor_habits")
      .upsert([
        { user_id: userId, name: "Acordar", icon: "sunrise", typical_time: `${wakeTime}:00`, is_system: true, sort_order: 0 },
        { user_id: userId, name: "Dormir", icon: "moon", typical_time: `${sleepTime}:00`, is_system: true, sort_order: 999 },
      ], { onConflict: "user_id,name", ignoreDuplicates: true });

    setSaving(false);
    setSubStep(1);
  };

  const handleSelectSuggestion = (s: typeof trailSuggestions[0]) => {
    setTrailName(s.name);
    setTrailTime(s.time);
  };

  const handleSaveTrailAndContinue = async () => {
    if (!userId || !trailName.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("anchor_habits")
      .insert({
        user_id: userId,
        name: trailName.trim(),
        icon: "anchor",
        typical_time: `${trailTime}:00`,
        is_system: false,
        sort_order: 10,
      })
      .select("id")
      .single();

    if (error || !data) {
      toast({ title: "Erro", description: "Falha ao criar trilho.", variant: "destructive" });
      setSaving(false);
      return;
    }

    setCreatedTrailId(data.id);
    setSaving(false);
    setSubStep(2);
  };

  const handleSaveHabitAndFinish = async () => {
    if (!userId || !habitName.trim() || !createdTrailId) return;
    setSaving(true);

    const { error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        name: habitName.trim(),
        micro_action: microAction.trim() || "Executar 2 minutos",
        anchor_id: createdTrailId,
        anchor_position: "after",
        anchor_sort_order: 0,
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        timer_duration: 120,
        is_active: true,
      });

    if (error) {
      toast({ title: "Erro", description: "Falha ao criar hábito.", variant: "destructive" });
      setSaving(false);
      return;
    }

    setCreatedData({
      trailName: trailName.trim(),
      habitName: habitName.trim(),
      microAction: microAction.trim() || "Executar 2 minutos",
      trailTime,
    });
    setSaving(false);
    onNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Target className="h-7 w-7 text-primary mx-auto mb-3" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.3))" }} />
          <h2 className="font-display text-lg text-primary mb-1">Sua Primeira Engrenagem</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            {subStep === 0 && "Quando você acorda e dorme?"}
            {subStep === 1 && "Escolha uma rotina para ancorar hábitos."}
            {subStep === 2 && "Instale sua primeira engrenagem neste trilho."}
          </p>
        </div>

        {/* Sub-step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["Horários", "Trilho", "Engrenagem"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono transition-all",
                i < subStep ? "bg-primary text-primary-foreground" :
                  i === subStep ? "border-2 border-primary text-primary" :
                    "border border-muted-foreground/30 text-muted-foreground/50"
              )}>
                {i < subStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < 2 && <div className={cn("w-8 h-px", i < subStep ? "bg-primary" : "bg-muted-foreground/20")} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Sub-step 0: Wake/Sleep times */}
          {subStep === 0 && (
            <motion.div
              key="times"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="border border-border bg-card/60 rounded-sm p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                    <Sun className="h-3.5 w-3.5 text-primary" /> Horário de acordar
                  </Label>
                  <Input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="font-mono text-sm h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-primary" /> Horário de dormir
                  </Label>
                  <Input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="font-mono text-sm h-11"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveTimesAndContinue}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-10 hud-glow"
              >
                {saving ? "Salvando..." : "Continuar"} <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}

          {/* Sub-step 1: Create trail */}
          {subStep === 1 && (
            <motion.div
              key="trail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <p className="font-mono text-[10px] text-muted-foreground text-center">Sugestões rápidas:</p>
              <div className="grid grid-cols-3 gap-2">
                {trailSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSelectSuggestion(s)}
                    className={cn(
                      "border rounded-sm p-2.5 text-center transition-all",
                      trailName === s.name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card/60 text-foreground hover:border-primary/30"
                    )}
                  >
                    <Coffee className="h-4 w-4 mx-auto mb-1 text-primary/70" />
                    <span className="font-mono text-[10px] block">{s.name}</span>
                  </motion.button>
                ))}
              </div>

              <div className="border border-border bg-card/60 rounded-sm p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">Nome do trilho</Label>
                  <Input
                    value={trailName}
                    onChange={(e) => setTrailName(e.target.value)}
                    placeholder="Ex: Café da manhã"
                    className="font-mono text-sm h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">Horário aproximado</Label>
                  <Input
                    type="time"
                    value={trailTime}
                    onChange={(e) => setTrailTime(e.target.value)}
                    className="font-mono text-sm h-11"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveTrailAndContinue}
                disabled={saving || !trailName.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-10 hud-glow"
              >
                {saving ? "Criando..." : "Criar trilho"} <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}

          {/* Sub-step 2: Create habit */}
          {subStep === 2 && (
            <motion.div
              key="habit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 flex items-center gap-3">
                <Route className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground">Vinculado ao trilho:</p>
                  <p className="font-display text-sm text-primary">{trailName} · {trailTime}</p>
                </div>
              </div>

              <div className="border border-border bg-card/60 rounded-sm p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">Nome da engrenagem</Label>
                  <Input
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    placeholder="Ex: Ler, Meditar, Exercício..."
                    className="font-mono text-sm h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground">Micro-ação (2 min)</Label>
                  <Input
                    value={microAction}
                    onChange={(e) => setMicroAction(e.target.value)}
                    placeholder="Ex: Ler 1 página, 5 respirações..."
                    className="font-mono text-sm h-11"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveHabitAndFinish}
                disabled={saving || !habitName.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-10 hud-glow"
              >
                {saving ? "Instalando..." : "Instalar engrenagem"} <Plus className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Step 6: Activation with Mini Preview ─── */
const StepActivation: React.FC<{ onNext: () => void; userId?: string }> = ({ onNext, userId }) => {
  const [phase, setPhase] = useState(0);
  const [trailData, setTrailData] = useState<{ trailName: string; trailTime: string; habitName: string; microAction: string } | null>(null);

  useEffect(() => {
    const loadCreatedData = async () => {
      if (!userId) return;
      // Fetch the most recently created non-system trail
      const { data: trails } = await supabase
        .from("anchor_habits")
        .select("id, name, typical_time")
        .eq("user_id", userId)
        .eq("is_system", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (trails && trails.length > 0) {
        const trail = trails[0];
        const { data: habits } = await supabase
          .from("habits")
          .select("name, micro_action")
          .eq("anchor_id", trail.id)
          .limit(1);

        const habit = habits?.[0];
        setTrailData({
          trailName: trail.name,
          trailTime: trail.typical_time?.slice(0, 5) ?? "07:00",
          habitName: habit?.name ?? "Seu hábito",
          microAction: habit?.micro_action ?? "Executar 2 minutos",
        });
      }
    };

    loadCreatedData();
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [userId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-sm text-center">
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mb-6"
            >
              <div className="h-16 w-16 rounded-sm border-2 border-primary bg-primary/10 flex items-center justify-center mx-auto hud-glow">
                <Target className="h-8 w-8 text-primary" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-6"
          >
            <h2 className="font-display text-xl text-primary hud-text-glow">
              Engrenagem Instalada
            </h2>

            {/* Mini trail preview */}
            {trailData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="border border-primary/20 bg-card/60 rounded-sm p-4 text-left"
              >
                {/* Trail line visualization */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary border-2 border-primary" />
                    <div className="w-px h-10 bg-primary/30" />
                    <div className="h-3 w-3 rounded-full border-2 border-primary/50 bg-primary/20" />
                  </div>
                  <div className="space-y-3 flex-1 min-w-0">
                    <div>
                      <p className="font-display text-sm text-primary">{trailData.trailName}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{trailData.trailTime}</p>
                    </div>
                    <div className="border-l-2 border-primary/30 pl-3">
                      <p className="font-mono text-xs text-foreground">{trailData.habitName}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">↳ {trailData.microAction}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <p className="font-mono text-[11px] text-muted-foreground">
              Sua primeira engrenagem está instalada.<br />
              Agir agora é inevitável.
            </p>
          </motion.div>
        )}

        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Button
              onClick={onNext}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-12 hud-glow"
            >
              <Crosshair className="mr-2 h-4 w-4" /> Ativar Sistema Inevitável
            </Button>
            <p className="font-mono text-[9px] text-muted-foreground italic">
              Lembre-se: o objetivo é começar, não completar. Ação inevitável.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Onboarding Component ─── */
type OnboardingProps = {
  onComplete: () => void;
  userId?: string;
};

const Onboarding = ({ onComplete, userId }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    { id: "boot", component: StepBoot },
    { id: "problem", component: StepProblem },
    { id: "bigidea", component: StepBigIdea },
    { id: "pillars", component: StepPillars },
    { id: "firsttrail", component: StepFirstTrail },
    { id: "activation", component: StepActivation },
  ];

  const handleNext = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, steps.length, onComplete]);

  const CurrentComponent = steps[currentStep].component;

  // Progress dots (skip boot)
  const showProgress = currentStep > 0;
  const progressSteps = steps.length - 1; // exclude boot
  const progressCurrent = currentStep - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Skip button */}
      {currentStep > 0 && currentStep < steps.length - 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onComplete}
          className="fixed top-4 right-4 z-50 font-mono text-[10px] text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        >
          Pular →
        </motion.button>
      )}

      {/* Progress dots */}
      {showProgress && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5">
          {Array.from({ length: progressSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === progressCurrent
                  ? "w-6 bg-primary"
                  : i < progressCurrent
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CurrentComponent onNext={handleNext} userId={userId} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
