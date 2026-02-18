import { useState } from "react";
import { Play, CheckCircle2, Undo2, Pause, Star, Zap, Route, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Execution } from "@/types/execution";

type TimerPhase = "idle" | "micro" | "prompt" | "full";

interface ExecutionCardProps {
  exec: Execution;
  index: number;
  isActive: boolean;
  isFlashing: boolean;
  isOverdue: boolean;
  isFuture: boolean;
  isExpanded: boolean;
  hasMounted: boolean;
  activeTimer: string | null;
  timeLeft: number;
  timerDuration: number;
  timerPhase: TimerPhase;
  isPaused: boolean;
  formatTime: (s: number) => string;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onUndo: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStartFull: (id: string) => void;
  onSkipFull: (id: string) => void;
  onFail: (id: string) => void;
}

const SWIPE_THRESHOLD = 120;

const ExecutionCard = ({
  exec,
  index,
  isActive,
  isFlashing,
  isOverdue,
  isFuture,
  isExpanded,
  hasMounted,
  activeTimer,
  timeLeft,
  timerDuration,
  timerPhase,
  isPaused,
  formatTime,
  onStart,
  onComplete,
  onUndo,
  onToggleExpand,
  onPause,
  onResume,
  onStartFull,
  onSkipFull,
  onFail,
}: ExecutionCardProps) => {
  const hasActiveElsewhere = activeTimer !== null && !isActive;
  const progressPercent = isActive && timerPhase !== "prompt" ? ((timerDuration - timeLeft) / timerDuration) * 100 : 0;
  const isInPrompt = isActive && timerPhase === "prompt";

  const dragX = useMotionValue(0);
  const failOpacity = useTransform(dragX, [0, SWIPE_THRESHOLD], [0, 1]);
  const failScale = useTransform(dragX, [0, SWIPE_THRESHOLD], [0.5, 1]);
  const [swiping, setSwiping] = useState(false);

  const canSwipe = exec.status === "pending" && !isActive;

  return (
    <motion.div
      key={exec.id}
      layout
      initial={hasMounted ? false : { opacity: 0, y: 20 }}
      animate={{
        opacity: hasActiveElsewhere ? 0.25 : (exec.status === "executed" && !isFlashing ? 0.4 : (exec.status === "failed" ? 0.3 : 1)),
        y: 0,
        scale: isActive ? 1.02 : (hasActiveElsewhere ? 0.97 : 1),
        filter: hasActiveElsewhere ? "blur(1px)" : "blur(0px)",
      }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.4, delay: hasMounted ? 0 : index * 0.04 }}
      className={cn(
        "relative overflow-hidden",
      )}
    >
      {/* Fail background layer (revealed on swipe) */}
      {canSwipe && (
        <div className="absolute inset-0 bg-destructive/15 flex items-center px-4 z-0">
          <motion.div
            style={{ opacity: failOpacity, scale: failScale }}
            className="flex items-center gap-2 text-destructive"
          >
            <X className="h-4 w-4" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Não vou fazer</span>
          </motion.div>
        </div>
      )}

      {/* Draggable content */}
      <motion.div
        drag={canSwipe ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        style={{ x: canSwipe ? dragX : 0 }}
        onDragStart={() => setSwiping(true)}
        onDragEnd={(_, info) => {
          setSwiping(false);
          if (info.offset.x > SWIPE_THRESHOLD) {
            onFail(exec.id);
          }
        }}
        className={cn(
          "bg-background transition-colors duration-500 flex flex-col relative z-10",
          (exec.status === "executed" || exec.status === "failed") && "cursor-pointer",
          exec.status === "failed" && "bg-destructive/5",
          isFlashing && "scale-[1.02]",
          isFuture && "border-l-2 border-muted-foreground/10",
          !isFuture && isOverdue && exec.status === "pending" && "border-l-2 border-warning/70",
          !isFuture && !isOverdue && exec.status === "pending" && "border-l-2 border-primary/40",
          exec.status === "failed" && "border-l-2 border-destructive/40",
          isActive && "border-l-2 border-primary hud-border"
        )}
        onClick={() => {
          if (swiping) return;
          if (exec.status === "executed" || exec.status === "failed") onToggleExpand(exec.id);
        }}
      >
        {/* Timer progress bar background */}
        {isActive && timerPhase !== "prompt" && (
          <motion.div
            className={cn("absolute inset-0", timerPhase === "full" ? "bg-accent/5" : "bg-primary/5")}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        )}

        <div className="flex relative z-10">
          {/* Content */}
          <div className="flex-1 p-4 md:p-5 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {exec.status === "executed" && (
                <motion.div
                  initial={isFlashing ? { scale: 0, rotate: -90 } : false}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {exec.completion_type === "full" ? (
                    <Star className={cn("h-3.5 w-3.5 fill-current", isFlashing ? "text-accent" : "text-accent/60")} />
                  ) : (
                    <CheckCircle2 className={cn("h-3.5 w-3.5", isFlashing ? "text-primary" : "text-primary/60")} />
                  )}
                </motion.div>
              )}
              {exec.status === "failed" && (
                <X className="h-3.5 w-3.5 text-destructive/60" />
              )}
              {exec.status === "pending" && (
                <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", isFuture ? "bg-muted-foreground/30" : isOverdue ? "bg-warning" : "bg-primary/60")} />
              )}
              <h3 className={cn(
                "font-display text-sm md:text-base truncate",
                exec.status === "failed" ? "text-destructive/50 line-through" :
                  isFuture ? "text-muted-foreground" : isOverdue ? "text-warning" : "text-primary"
              )}>
                {exec.micro_action}
              </h3>
              {exec.status === "executed" && (
                <span className={cn(
                  "font-mono text-[9px] uppercase tracking-wider ml-auto flex-shrink-0",
                  exec.completion_type === "full" ? "text-accent/70" : "text-muted-foreground/50"
                )}>
                  {exec.completion_type === "full" ? "AÇÃO COMPLETA" : "MICRO-AÇÃO"}
                </span>
              )}
              {exec.status === "failed" && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-destructive/50 ml-auto flex-shrink-0">FALHOU</span>
              )}
              {isOverdue && exec.status === "pending" && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-warning/70 ml-auto flex-shrink-0">ATRASADO</span>
              )}
            </div>
            <p className={cn(
              "font-mono text-[10px]",
              exec.status === "failed" ? "text-destructive/25" :
                isOverdue ? "text-warning/40" : "text-muted-foreground/40"
            )}>
              ↳ {exec.habit_name}{exec.preferred_time ? ` · ${exec.preferred_time.slice(0, 5)}` : ""}
            </p>
            {exec.anchor_name && (
              <div className="flex items-center gap-1 mt-1">
                <Route className="h-2.5 w-2.5 text-primary/40" />
                <span className="font-mono text-[9px] text-primary/50 uppercase tracking-wider">
                  {exec.anchor_position === "before" ? "antes de" : "depois de"} {exec.anchor_name}
                </span>
              </div>
            )}

            {/* Immersive timer display */}
            {isActive && timerPhase !== "prompt" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  {timerPhase === "full" && <Zap className="h-3 w-3 text-accent" />}
                  <span className={cn(
                    "font-mono text-2xl md:text-3xl font-bold tabular-nums",
                    isPaused ? "text-muted-foreground animate-pulse" :
                      timerPhase === "full" ? "text-accent" :
                        isOverdue ? "text-warning" : "text-primary hud-text-glow"
                  )}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", timerPhase === "full" ? "bg-accent" : "bg-primary")}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            )}

            {(exec.status === "executed" || exec.status === "failed") && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex justify-end mt-2 overflow-hidden"
              >
                <Button
                  onClick={(e) => { e.stopPropagation(); onUndo(exec.id); }}
                  variant="ghost"
                  size="sm"
                  className="font-mono uppercase tracking-[0.12em] text-[10px] h-7 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="mr-1 h-3 w-3" /> Desfazer
                </Button>
              </motion.div>
            )}
          </div>

          {/* Action buttons */}
          {exec.status === "pending" && (
            <div className="flex-shrink-0 relative z-10 flex">
              {!isActive ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onStart(exec.id); }}
                  disabled={activeTimer !== null && activeTimer !== exec.id}
                  className={cn(
                    "h-full w-14 flex items-center justify-center transition-colors disabled:opacity-20",
                    isFuture
                      ? "bg-muted/20 text-muted-foreground/40 hover:bg-muted/30"
                      : isOverdue
                        ? "bg-warning/10 text-warning hover:bg-warning/15"
                        : "bg-primary/5 text-primary hover:bg-primary/10"
                  )}
                >
                  <Play className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              ) : timerPhase === "prompt" ? null : (
                <div className="flex flex-col">
                  <button
                    onClick={(e) => { e.stopPropagation(); isPaused ? onResume() : onPause(); }}
                    className={cn(
                      "flex-1 w-14 flex items-center justify-center transition-colors",
                      "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onComplete(exec.id); }}
                    className={cn(
                      "flex-1 w-14 flex items-center justify-center transition-colors",
                      timerPhase === "full"
                        ? "bg-accent/15 text-accent hover:bg-accent/25"
                        : isOverdue
                          ? "bg-warning/20 text-warning hover:bg-warning/30"
                          : "bg-primary/15 text-primary hover:bg-primary/25"
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full action prompt */}
        <AnimatePresence>
          {isInPrompt && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 relative z-10"
            >
              <div className="border border-accent/30 bg-accent/5 rounded-sm p-3 text-center">
                <p className="font-mono text-[11px] text-accent mb-3">
                  Micro-ação concluída! Deseja registrar a Ação Completa agora?
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={(e) => { e.stopPropagation(); onStartFull(exec.id); }}
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/80 font-mono text-[10px] uppercase tracking-wider h-8"
                  >
                    <Zap className="mr-1 h-3 w-3" /> Ação Completa ({Math.floor((exec.full_duration ?? 0) / 60)} min)
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); onSkipFull(exec.id); }}
                    variant="ghost"
                    size="sm"
                    className="font-mono text-[10px] uppercase tracking-wider h-8 text-muted-foreground"
                  >
                    Apenas micro-ação
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ExecutionCard;
