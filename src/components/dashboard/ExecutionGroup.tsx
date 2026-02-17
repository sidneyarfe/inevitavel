import { Execution } from "@/types/execution";
import { Sun, Sunset, Moon, Clock, CloudMoon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimePeriod = "dawn" | "morning" | "afternoon" | "night" | "anytime";

const PERIOD_CONFIG = {
  dawn: { label: "MADRUGADA", icon: CloudMoon, range: "00:00–06:00" },
  morning: { label: "MANHÃ", icon: Sun, range: "06:00–12:00" },
  afternoon: { label: "TARDE", icon: Sunset, range: "12:00–18:00" },
  night: { label: "NOITE", icon: Moon, range: "18:00–00:00" },
  anytime: { label: "SEM HORÁRIO", icon: Clock, range: "" },
} as const;

export function getCurrentPeriod(): TimePeriod {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return "dawn";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "night";
}

const PERIOD_ORDER: TimePeriod[] = ["dawn", "morning", "afternoon", "night"];

export function getPeriodState(period: TimePeriod, currentPeriod: TimePeriod): "active" | "past" | "future" {
  if (period === "anytime") return "active";
  const currentIdx = PERIOD_ORDER.indexOf(currentPeriod);
  const periodIdx = PERIOD_ORDER.indexOf(period);
  if (periodIdx === currentIdx) return "active";
  if (periodIdx < currentIdx) return "past";
  return "future";
}

export function getTimePeriod(preferredTime: string | null): TimePeriod {
  if (!preferredTime) return "anytime";
  const hour = parseInt(preferredTime.split(":")[0], 10);
  if (hour >= 0 && hour < 6) return "dawn";
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "night";
}

export function groupExecutions(executions: Execution[]) {
  const groups: Record<TimePeriod, Execution[]> = {
    dawn: [],
    morning: [],
    afternoon: [],
    night: [],
    anytime: [],
  };

  for (const exec of executions) {
    const period = getTimePeriod(exec.preferred_time);
    groups[period].push(exec);
  }

  // Sort within each group: pending first, then by preferred_time
  for (const key of Object.keys(groups) as TimePeriod[]) {
    groups[key].sort((a, b) => {
      const statusOrder = { pending: 0, executed: 1, failed: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      if (a.preferred_time && b.preferred_time)
        return a.preferred_time.localeCompare(b.preferred_time);
      return 0;
    });
  }

  // Return only non-empty groups in order
  const order: TimePeriod[] = ["dawn", "morning", "afternoon", "night", "anytime"];
  return order
    .filter((p) => groups[p].length > 0)
    .map((p) => ({ period: p, executions: groups[p] }));
}

interface PeriodHeaderProps {
  period: TimePeriod;
  executedCount: number;
  totalCount: number;
  periodState: "active" | "past" | "future";
}

export function PeriodHeader({ period, executedCount, totalCount, periodState }: PeriodHeaderProps) {
  const config = PERIOD_CONFIG[period];
  const Icon = config.icon;
  const allDone = executedCount === totalCount;

  return (
    <div className={cn(
      "flex items-center gap-2 px-1 pt-4 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em]",
      periodState === "active" && !allDone && "text-primary/70",
      periodState === "active" && allDone && "text-muted-foreground/30",
      periodState === "past" && "text-muted-foreground/40",
      periodState === "future" && "text-muted-foreground/20",
    )}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
      {config.range && (
        <span className={cn(
          "ml-0.5",
          periodState === "future" ? "text-muted-foreground/15" : "text-muted-foreground/25"
        )}>{config.range}</span>
      )}
      <span className="ml-auto tabular-nums">
        {executedCount}/{totalCount}
      </span>
    </div>
  );
}