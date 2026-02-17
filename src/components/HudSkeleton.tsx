import { cn } from "@/lib/utils";

const HudSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-sm bg-primary/10", className)} />
);

export const DashboardSkeleton = () => (
  <div className="flex flex-col px-4 pt-6 pb-4">
    <div className="mb-5 flex items-center justify-between px-1">
      <HudSkeleton className="h-3 w-24" />
      <HudSkeleton className="h-3 w-16" />
    </div>
    <HudSkeleton className="mb-6 h-0.5 w-full" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="hud-border bg-card/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <HudSkeleton className="h-4 w-32" />
            <HudSkeleton className="h-3 w-10" />
          </div>
          <HudSkeleton className="h-3 w-48" />
          <HudSkeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export const HabitsSkeleton = () => (
  <div className="px-4 pt-6 pb-4">
    <div className="mb-6 flex items-center justify-between">
      <HudSkeleton className="h-5 w-40" />
      <HudSkeleton className="h-8 w-16" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="hud-border bg-card/60 p-4 flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <HudSkeleton className="h-4 w-28" />
            <HudSkeleton className="h-3 w-40" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <HudSkeleton key={d} className="h-4 w-7" />
              ))}
            </div>
          </div>
          <div className="flex gap-1 ml-3">
            <HudSkeleton className="h-7 w-7" />
            <HudSkeleton className="h-7 w-7" />
            <HudSkeleton className="h-7 w-7" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const BriefingSkeleton = () => (
  <div className="flex flex-col items-center px-4 pt-6">
    <HudSkeleton className="h-5 w-36 mb-2" />
    <HudSkeleton className="h-3 w-52 mb-6" />
    <div className="w-full max-w-sm hud-border bg-card/60 p-6 space-y-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <HudSkeleton className="h-4 w-4" />
          <HudSkeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  </div>
);

export default HudSkeleton;
