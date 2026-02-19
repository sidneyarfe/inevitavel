import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Target, ChevronRight,
  CheckCircle2, Crosshair,
  Cog, Route, BookOpen,
  Sun, Moon, Coffee, Plus, Layers,
  ArrowRight, Minus, Clock
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
    "INEVITÁVEL",
    "Mapeando fluxo diário...",
    "Identificando pontos de menor resistência...",
    "Calibrando micro-ações...",
    "Sistema de Ação Inevitável: ATIVO",
  ];

  useEffect(() => {
    const timers = lines.map((_, i) =>
      setTimeout(() => setPhase(i + 1), 600 + i * 700)
    );
    const final = setTimeout(() => onNext(), 600 + lines.length * 700 + 1200);
    return () => { timers.forEach(clearTimeout); clearTimeout(final); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-xs my-auto"
      >
        {/* Neon dot + title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-[8px] w-[8px] rounded-full bg-primary animate-pulse-glow drop-shadow-[0_0_6px_hsl(160,100%,50%)] shadow-[0_0_12px_hsl(160,100%,50%),0_0_24px_hsl(160,100%,50%/0.4)] brightness-110 mix-blend-screen" />
          <span className="font-display text-sm tracking-[0.3em] text-primary hud-text-glow">
            INEVITÁVEL
          </span>
        </div>

        {/* Terminal box with HUD border */}
        <div className="hud-border hud-corner rounded-sm p-4 bg-card/40 space-y-1.5">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={phase > i ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="font-mono text-[10px] text-primary/40">{">"}</span>
              <span className={cn(
                "font-mono text-[11px]",
                i === 0 ? "text-primary font-semibold hud-text-glow tracking-[0.2em]" :
                  i === lines.length - 1 ? "text-primary hud-text-glow" : "text-muted-foreground"
              )}>
                {line}
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
        </div>

        {/* Progress bar */}
        {phase >= lines.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="h-0.5 w-full bg-primary/20 mt-6 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-primary hud-glow"
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

/* ─── Step 2: The Problem (expanded) ─── */
const StepProblem: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [phase, setPhase] = useState(0);

  const intentions = [
    { text: "Meditar", struck: false },
    { text: "Ler", struck: false },
    { text: "Treinar", struck: false },
    { text: "Estudar", struck: false },
  ];

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),    // "Você acorda com intenções"
      setTimeout(() => setPhase(2), 2200),   // Show checklist
      setTimeout(() => setPhase(3), 4000),   // "Mas o dia começa"
      setTimeout(() => setPhase(4), 5200),   // Strike items
      setTimeout(() => setPhase(5), 7000),   // "Seus hábitos competem..."
      setTimeout(() => setPhase(6), 9500),   // Reveal: falta de estrutura
      setTimeout(() => setPhase(7), 12000),  // Button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6 my-auto">
        {/* Phase 1: Opening line */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-xl text-foreground text-center"
            >
              Você acorda com intenções.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Phase 2: Checklist items */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {intentions.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3 px-3 py-2 border border-primary/15 bg-card/40 rounded-sm"
                >
                  <div className={cn(
                    "h-4 w-4 rounded-sm border-2 transition-all duration-500",
                    phase >= 4 ? "border-destructive/50 bg-destructive/10" : "border-primary/40"
                  )} />
                  <span className={cn(
                    "font-mono text-sm transition-all duration-700",
                    phase >= 4
                      ? "line-through text-muted-foreground/40 decoration-destructive/60"
                      : "text-foreground"
                  )}>
                    {item.text}
                  </span>
                  {phase >= 4 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="ml-auto font-mono text-[9px] text-destructive/60"
                    >
                      FALHA
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3: "Mas o dia começa" */}
        <AnimatePresence>
          {phase >= 3 && phase < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-1"
            >
              <p className="font-display text-lg text-destructive">
                Mas o dia começa.
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Urgências. Cansaço. Distrações. O dia negocia contra você.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 5: Impact statement */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <p className="font-display text-xl text-foreground">
                Seus hábitos competem com o dia.
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="font-display text-2xl text-destructive hud-text-glow"
              >
                E o dia sempre vence.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 6: The reveal — structure */}
        <AnimatePresence>
          {phase >= 6 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hud-border hud-corner bg-card/60 p-4 rounded-sm"
            >
              <p className="font-mono text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">
                ▸ Diagnóstico do sistema
              </p>
              <p className="font-display text-lg text-primary">
                O problema não é você.
              </p>
              <p className="font-display text-lg text-foreground mt-1">
                É a ausência de{" "}
                <span className="text-primary hud-text-glow underline decoration-primary/40 underline-offset-4">
                  estrutura
                </span>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 7: Button */}
        <AnimatePresence>
          {phase >= 7 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-12 hud-glow"
              >
                O que é estrutura? <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Step 3: The Solution — Architecture vs Motivation ─── */
const StepSolution: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),    // Opening
      setTimeout(() => setPhase(2), 3000),   // Before vs After
      setTimeout(() => setPhase(3), 7000),   // Impact phrase
      setTimeout(() => setPhase(4), 10000),  // Button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6 my-auto">
        {/* Phase 1: Opening statement */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3"
            >
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                ▸ Correção de rota
              </p>
              <p className="font-display text-xl text-foreground">
                A maioria dos apps pede{" "}
                <span className="text-destructive">motivação</span>.
              </p>
              <p className="font-display text-xl text-primary hud-text-glow">
                Nós instalamos arquitetura comportamental.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Before vs After comparison */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* BEFORE */}
              <div className="hud-border rounded-sm p-4 bg-destructive/5 border-destructive/20">
                <p className="font-mono text-[9px] text-destructive uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Minus className="h-3 w-3" /> Sem estrutura
                </p>
                <div className="space-y-2">
                  {["Lembrar de fazer", "Decidir a hora", "Negociar consigo", "Desistir"].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.12 }}
                      className="flex items-center gap-2"
                    >
                      <span className="font-mono text-[10px] text-destructive/50">{i + 1}.</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{item}</span>
                      {i < 3 && <ArrowRight className="h-2.5 w-2.5 text-destructive/30 ml-auto" />}
                      {i === 3 && <span className="font-mono text-[9px] text-destructive ml-auto">✕</span>}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AFTER */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="hud-border hud-corner rounded-sm p-4 bg-primary/5 border-primary/20"
              >
                <p className="font-mono text-[9px] text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Com estrutura inevitável
                </p>
                <div className="space-y-2">
                  {[
                    { text: "Rotina acontece", note: "café, banho, almoço..." },
                    { text: "Ação continua", note: "continuação natural" },
                    { text: "Automático", note: "sem negociação" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.15 }}
                      className="flex items-center gap-2"
                    >
                      <span className="font-mono text-[10px] text-primary">{i + 1}.</span>
                      <span className="font-mono text-[11px] text-foreground">{item.text}</span>
                      <span className="font-mono text-[9px] text-muted-foreground ml-auto">{item.note}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3: Impact phrase */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-2"
            >
              <p className="font-display text-lg text-foreground">
                Quando a ação é consequência da rotina,
              </p>
              <p className="font-display text-xl text-primary hud-text-glow mt-1">
                disciplina vira inevitável.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 4: Button */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-12 hud-glow"
              >
                Como funciona na prática? <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Step 4: Practical Example — Timeline ─── */
const StepExample: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),    // Opening
      setTimeout(() => setPhase(2), 2500),   // Timeline anchor
      setTimeout(() => setPhase(3), 4000),   // Micro-action
      setTimeout(() => setPhase(4), 5500),   // Result
      setTimeout(() => setPhase(5), 7500),   // "Isso é um trilho inevitável"
      setTimeout(() => setPhase(6), 10000),  // Button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6 my-auto">
        {/* Opening */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-2"
            >
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                ▸ Exemplo real
              </p>
              <p className="font-display text-xl text-foreground">
                Imagine que você quer{" "}
                <span className="text-primary hud-text-glow">ler todos os dias</span>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline visualization */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hud-border rounded-sm p-5 bg-card/40 space-y-0"
            >
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-4">
                ▸ Trilho: Café da manhã
              </p>

              {/* Timeline line */}
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-primary/20" />

                {/* Anchor point */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative pb-6"
                >
                  <div className="absolute left-[-18px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-primary shadow-[0_0_8px_hsl(160,100%,50%/0.4)]" />
                  <div>
                    <p className="font-display text-sm text-primary">Café da manhã</p>
                    <p className="font-mono text-[10px] text-muted-foreground">07:00 · Trilho âncora</p>
                    <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">
                      Isso já acontece todos os dias. Sem esforço.
                    </p>
                  </div>
                </motion.div>

                {/* Micro-action */}
                {phase >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative pb-6"
                  >
                    <div className="absolute left-[-18px] top-1 h-3 w-3 rounded-full border-2 border-primary/60 bg-primary/20" />
                    <div className="border-l-2 border-primary/30 pl-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                        <p className="font-display text-sm text-foreground">Ler</p>
                      </div>
                      <p className="font-mono text-[10px] text-primary mt-0.5">
                        ↳ Micro-ação: "Ler 1 página"
                      </p>
                      <p className="font-mono text-[9px] text-muted-foreground/60 mt-1">
                        2 minutos. Impossível dizer não.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Result */}
                {phase >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                  >
                    <div className="absolute left-[-18px] top-1 h-3 w-3 rounded-full bg-primary/10 border-2 border-primary/30" />
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Sem alarme. Sem decisão.
                    </p>
                    <p className="font-mono text-[10px] text-primary mt-0.5">
                      O café termina → a leitura começa.
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conclusion */}
        <AnimatePresence>
          {phase >= 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-2 py-2"
            >
              <p className="font-mono text-[10px] text-muted-foreground">
                Isso é um
              </p>
              <p className="font-display text-xl text-primary hud-text-glow">
                Trilho Inevitável.
              </p>
              <p className="font-mono text-[10px] text-muted-foreground mt-2">
                A ação vira continuação — não decisão.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <AnimatePresence>
          {phase >= 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-12 hud-glow"
              >
                Quais engrenagens fazem isso? <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ─── Step 5: The 6 Gears (enriched) ─── */
const StepPillars: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers = Array.from({ length: 6 }).map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), 400 + i * 600)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const pillars = [
    {
      icon: Zap,
      title: "Micro-ação",
      subtitle: "Engrenagem 1",
      desc: "A meta é reduzida ao mínimo. Pequena demais para gerar resistência.",
      example: "> 2 min · 1 página · 5 respirações",
    },
    {
      icon: Route,
      title: "Trilho Inevitável",
      subtitle: "Engrenagem 2",
      desc: "Ancorada ao que já acontece na sua rotina. Não é começar — é continuar.",
      example: "> Café → Ler · Banho → Meditar",
    },
    {
      icon: Moon,
      title: "Comprometimento Noturno",
      subtitle: "Engrenagem 3",
      desc: "Toda noite, o Briefing pergunta: amanhã, o que é inevitável? A decisão acontece antes do cansaço.",
      example: "> Briefing 22:00 — decisões do amanhã",
    },
    {
      icon: Layers,
      title: "Ambiente",
      subtitle: "Engrenagem 4",
      desc: "O caminho certo vira o mais fácil. Redução de atrito ambiental.",
      example: "> Garrafa na mesa = beber água",
    },
    {
      icon: CheckCircle2,
      title: "Registro Objetivo",
      subtitle: "Engrenagem 5",
      desc: "Não \"acho que fiz\". Execução cronometrada, evidência concreta.",
      example: "> 1 pág lida · 2:14 cronometrados",
    },
    {
      icon: Cog,
      title: "Auditoria Inteligente",
      subtitle: "Engrenagem 6",
      desc: "Não fez? O sistema pergunta por quê e ajusta a estrutura. Sem culpa — com engenharia.",
      example: "> Falha → análise → ajuste estrutural",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm my-auto">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-sm hud-border bg-primary/10 flex items-center justify-center mx-auto mb-3 hud-glow">
            <Crosshair className="h-6 w-6 text-primary" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" }} />
          </div>
          <h2 className="font-display text-lg text-primary hud-text-glow mb-1">6 Engrenagens</h2>
          <p className="font-mono text-[10px] text-muted-foreground">
            O sistema que transforma intenção em ação automática.
          </p>
        </div>

        <div className="space-y-2.5 mb-6">
          {pillars.map((pillar, i) => (
            <AnimatePresence key={i}>
              {visibleCount > i && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="hud-border bg-card/60 rounded-sm p-3 flex gap-3 items-start"
                >
                  <div className="shrink-0 h-8 w-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
                    <pillar.icon className="h-4 w-4 text-primary" style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.3))" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <h3 className="font-display text-xs text-primary">{pillar.title}</h3>
                      <span className="font-mono text-[8px] text-muted-foreground/60">{pillar.subtitle}</span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground leading-snug">{pillar.desc}</p>
                    <p className="font-mono text-[9px] text-primary/60 mt-1.5 border-t border-primary/10 pt-1.5">
                      {pillar.example}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {visibleCount >= 6 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="pb-4"
            >
              <Button
                onClick={onNext}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs h-12 hud-glow"
              >
                Instalar meu primeiro hábito <ChevronRight className="ml-1 h-3 w-3" />
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
  const [selectedTrailIcon, setSelectedTrailIcon] = useState("☕");
  const [habitName, setHabitName] = useState("");
  const [microAction, setMicroAction] = useState("");

  // Data created
  const [createdTrailId, setCreatedTrailId] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<{ trailName: string; habitName: string; microAction: string; trailTime: string } | null>(null);

  const trailSuggestions = [
    { name: "Café da manhã", icon: "☕", time: "07:00" },
    { name: "Almoço", icon: "🍽️", time: "12:00" },
    { name: "Fim do trabalho", icon: "🏋️", time: "18:00" },
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
        { user_id: userId, name: "Acordar", icon: "☀️", typical_time: `${wakeTime}:00`, is_system: true, sort_order: 0 },
        { user_id: userId, name: "Dormir", icon: "🌙", typical_time: `${sleepTime}:00`, is_system: true, sort_order: 999 },
      ], { onConflict: "user_id,name", ignoreDuplicates: true });

    setSaving(false);
    setSubStep(1);
  };

  const handleSelectSuggestion = (s: typeof trailSuggestions[0]) => {
    setTrailName(s.name);
    setTrailTime(s.time);
    setSelectedTrailIcon(s.icon);
  };

  const handleSaveTrailAndContinue = async () => {
    if (!userId || !trailName.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("anchor_habits")
      .insert({
        user_id: userId,
        name: trailName.trim(),
        icon: selectedTrailIcon,
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
    <div className="min-h-screen flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm my-auto">
        <div className="text-center mb-6">
          <Target className="h-7 w-7 text-primary mx-auto mb-3" style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.3))" }} />
          <h2 className="font-display text-lg text-primary mb-1">Seu Primeiro Hábito</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            {subStep === 0 && "Quando você acorda e dorme?"}
            {subStep === 1 && "Escolha uma rotina para ancorar hábitos."}
            {subStep === 2 && "Instale seu primeiro hábito neste trilho."}
          </p>
        </div>

        {/* Sub-step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["Horários", "Trilho", "Hábito"].map((label, i) => (
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
                  <Label className="font-mono text-xs text-muted-foreground">Nome do hábito</Label>
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
                {saving ? "Instalando..." : "Instalar hábito"} <Plus className="ml-1 h-3 w-3" />
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
              Hábito Instalado
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
              Seu primeiro hábito está instalado.<br />
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
    { id: "solution", component: StepSolution },
    { id: "example", component: StepExample },
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
