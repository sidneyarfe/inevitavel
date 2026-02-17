import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StreakBadgeProps {
  streak: number;
  loading: boolean;
}

const StreakBadge = ({ streak, loading }: StreakBadgeProps) => {
  if (loading || streak === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm",
        "hud-border bg-card/80 backdrop-blur-sm"
      )}
    >
      <Flame className={cn(
        "h-3.5 w-3.5",
        streak >= 7 ? "text-warning" : "text-primary"
      )} />
      <span className={cn(
        "font-mono text-xs font-bold tracking-wider",
        streak >= 7 ? "text-warning" : "text-primary"
      )}>
        {streak}
      </span>
      <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
        {streak === 1 ? "dia" : "dias"}
      </span>
    </motion.div>
  );
};

export default StreakBadge;
