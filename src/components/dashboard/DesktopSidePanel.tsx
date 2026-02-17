import StreakBadge from "./StreakBadge";
import ProgressBarHud from "./ProgressBarHud";
import { cn } from "@/lib/utils";

interface DesktopSidePanelProps {
  streak: number;
  streakLoading: boolean;
  executedCount: number;
  totalCount: number;
  cycleDay: number | null;
}

const DesktopSidePanel = ({ streak, streakLoading, executedCount, totalCount, cycleDay }: DesktopSidePanelProps) => {
  const pendingCount = totalCount - executedCount;
  const rate = totalCount > 0 ? Math.round((executedCount / totalCount) * 100) : 0;

  return (
    <div className="hidden lg:flex flex-col gap-6 sticky top-20">
      {/* Streak */}
      <div className="px-1">
        <StreakBadge streak={streak} loading={streakLoading} />
      </div>

      {/* 42-day Identity Cycle */}
      {cycleDay !== null && (
        <div className="px-1">
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.15em] mb-1.5">Construção de Identidade</p>
          <div className="relative h-7 w-full bg-secondary/60 border border-border/50 rounded-sm overflow-hidden hud-border">
            <div
              className="absolute inset-y-0 left-0 bg-primary/25 transition-all duration-700"
              style={{ width: `${Math.round((cycleDay / 42) * 100)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-primary uppercase tracking-widest z-10">
              Dia {cycleDay} de 42
            </span>
          </div>
        </div>
      )}

      {/* Progress */}
      <ProgressBarHud executed={executedCount} total={totalCount} />

      {/* Quick stats */}
      <div className="space-y-3 px-1">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Status do dia
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/50 border-l-2 border-primary/40 p-3">
            <span className="font-mono text-lg font-bold text-primary">{executedCount}</span>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Provas</p>
          </div>
          <div className={cn(
            "bg-card/50 border-l-2 p-3",
            pendingCount === 0 ? "border-primary/20" : "border-warning/40"
          )}>
            <span className={cn(
              "font-mono text-lg font-bold",
              pendingCount === 0 ? "text-primary/60" : "text-warning"
            )}>{pendingCount}</span>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Pendentes</p>
          </div>
        </div>
        <div className="bg-card/50 border-l-2 border-primary/20 p-3">
          <span className={cn(
            "font-mono text-lg font-bold",
            rate === 100 ? "text-primary hud-text-glow" : "text-foreground/70"
          )}>{rate}%</span>
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Eficiência</p>
        </div>
      </div>
    </div>
  );
};

export default DesktopSidePanel;
