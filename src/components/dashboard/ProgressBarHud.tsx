import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarHudProps {
  executed: number;
  total: number;
}

const ProgressBarHud = ({ executed, total }: ProgressBarHudProps) => {
  const pct = total > 0 ? Math.round((executed / total) * 100) : 0;
  const allDone = total > 0 && executed === total;

  return (
    <div className="mb-6 px-1">

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", allDone ? "bg-primary animate-pulse" : "bg-primary")} />
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {executed}/{total} provas registradas
          </span>
        </div>
        <span className={cn(
          "font-mono text-[10px] uppercase tracking-wider",
          allDone ? "text-primary hud-text-glow" : "text-muted-foreground"
        )}>
          {allDone ? "Sistema validado" : `${total - executed} pendentes`}
        </span>
      </div>

      <div className="relative h-3 md:h-4 w-full bg-secondary rounded-sm overflow-hidden hud-border">
        <motion.div
          className={cn(
            "h-full rounded-sm",
            allDone ? "bg-primary" : "bg-primary/80"
          )}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(160 100% 50% / 0.04) 2px, hsl(160 100% 50% / 0.04) 4px)"
        }} />
      </div>

      {/* Percentage label */}
      <div className="flex justify-end mt-1">
        <motion.span
          className={cn(
            "font-mono text-xs font-bold tracking-wider",
            allDone ? "text-primary hud-text-glow" : "text-foreground/70"
          )}
          key={pct}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {pct}%
        </motion.span>
      </div>
    </div>
  );
};

export default ProgressBarHud;
