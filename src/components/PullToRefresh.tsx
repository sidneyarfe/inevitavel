
import { useState, useRef, useEffect, ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
    const isMobile = useIsMobile();
    const [startY, setStartY] = useState(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const THRESHOLD = 120; // px to drag to trigger refresh
    const MAX_PULL = 200; // max visual pull

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY > 0) return;
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (window.scrollY > 0 || startY === 0 || refreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Add resistance
            const damped = Math.min(diff * 0.5, MAX_PULL);
            setPullDistance(damped);
        }
    };

    const handleTouchEnd = async () => {
        if (startY === 0 || refreshing) return;

        if (pullDistance > THRESHOLD) {
            setRefreshing(true);
            setPullDistance(THRESHOLD / 2); // Snap to loading position

            try {
                if (navigator.vibrate) navigator.vibrate(50);
                await onRefresh();
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            } finally {
                setTimeout(() => {
                    setRefreshing(false);
                    setPullDistance(0);
                }, 500);
            }
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    // On desktop, we just render children normally (no pull logic), 
    // but we can expose a refresh button elsewhere or use this wrapper if we want mouse drag (unusual).
    // For now, this logic is touch-only.

    if (!isMobile) return <>{children}</>;

    return (
        <div
            className="relative min-h-screen"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Loading Indicator Layer */}
            <div
                className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-0 overflow-hidden"
                style={{ height: pullDistance }}
            >
                <div className="flex items-end pb-4">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur border border-primary/20 shadow-sm transition-all duration-300",
                        pullDistance > THRESHOLD ? "opacity-100 scale-100" : "opacity-70 scale-90"
                    )}>
                        {refreshing ? (
                            <>
                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Atualizando</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className={cn("h-4 w-4 text-primary transition-transform duration-300",
                                    pullDistance > THRESHOLD ? "rotate-180" : ""
                                )} />
                                <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
                                    {pullDistance > THRESHOLD ? "Solte para atualizar" : "Puxe para atualizar"}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Layer with Transform */}
            <motion.div
                className="relative z-10 bg-background min-h-screen"
                animate={{ y: pullDistance }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
                {children}
            </motion.div>
        </div>
    );
};
