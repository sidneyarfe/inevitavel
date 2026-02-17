import { useLocation, useNavigate } from "react-router-dom";
import { Crosshair, ListChecks, Moon, BarChart3, Settings, WifiOff, LayoutGrid, X, Brain, Route, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import KeepAlive from "@/components/KeepAlive";
// Neon circle logo replaces biohabits_logo.png
import Dashboard from "@/pages/Dashboard";
import Habits from "@/pages/Habits";
import Briefing from "@/pages/Briefing";
import Report from "@/pages/Report";
import SettingsPage from "@/pages/Settings";
import Analyst from "@/pages/Analyst";
import Trails from "@/pages/Trails";
import Todos from "@/pages/Todos";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { path: "/", label: "Missões", icon: Crosshair },
  { path: "/tarefas", label: "Tarefas", icon: ClipboardList },
  { path: "/briefing", label: "Briefing", icon: Moon },
];

const MORE_ITEMS = [
  { path: "/habitos", label: "Hábitos", icon: ListChecks, description: "Configurar hábitos do sistema" },
  { path: "/trilhos", label: "Trilhos", icon: Route, description: "Trilhos inevitáveis da rotina" },
  { path: "/analista", label: "Analista", icon: Brain, description: "Diagnóstico de negociação" },
  { path: "/relatorio", label: "Arquivo", icon: BarChart3, description: "Arquivo de identidade" },
  { path: "/configuracoes", label: "Configurações", icon: Settings, description: "Ajustes do sistema" },
];

const ALL_NAV = [...NAV_ITEMS, ...MORE_ITEMS];

const ROUTES = [
  { path: "/", element: <Dashboard /> },
  { path: "/habitos", element: <Habits /> },
  { path: "/briefing", element: <Briefing /> },
  { path: "/trilhos", element: <Trails /> },
  { path: "/tarefas", element: <Todos /> },
  { path: "/relatorio", element: <Report /> },
  { path: "/configuracoes", element: <SettingsPage /> },
  { path: "/analista", element: <Analyst /> },
];

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showMenu, setShowMenu] = useState(false);
  const [briefingPending, setBriefingPending] = useState(false);

  useEffect(() => {
    const checkBriefing = async () => {
      if (!user) return;
      const hour = new Date().getHours();
      if (hour < 20 && hour >= 5) { setBriefingPending(false); return; }
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("evening_briefings")
        .select("all_confirmed")
        .eq("user_id", user.id)
        .eq("briefing_date", today)
        .maybeSingle();
      setBriefingPending(!data?.all_confirmed);
    };
    checkBriefing();
    const interval = setInterval(checkBriefing, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setShowMenu(false);
  }, [navigate]);

  const activeIndex = NAV_ITEMS.findIndex((item) => item.path === location.pathname);
  const isMoreActive = MORE_ITEMS.some((item) => item.path === location.pathname);

  // Desktop sidebar layout
  if (!isMobile) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background scanline">
          <Sidebar collapsible="icon" className="border-r border-border bg-background">
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-[6px] w-[6px] rounded-full bg-primary animate-pulse-glow drop-shadow-[0_0_6px_hsl(160,100%,50%)] shadow-[0_0_12px_hsl(160,100%,50%),0_0_24px_hsl(160,100%,50%/0.4)] brightness-110 mix-blend-screen" />
                <h1 className="font-display text-sm tracking-[0.3em] text-primary hud-text-glow group-data-[collapsible=icon]:hidden">
                  INEVITÁVEL
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {ALL_NAV.map((item) => {
                      const isActive = location.pathname === item.path;
                      const isBriefing = item.path === "/briefing";
                      const shouldPulse = isBriefing && briefingPending && !isActive;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                              "font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                              isActive
                                ? "text-primary hud-text-glow"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <div className="relative">
                              <item.icon className={cn("h-4 w-4", isActive && "drop-shadow-[0_0_4px_hsl(160,100%,50%)]")} />
                              {shouldPulse && (
                                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-warning animate-pulse" />
                              )}
                            </div>
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            {/* Status footer */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                {!isOnline && <WifiOff className="h-3 w-3 text-destructive" />}
                <span className="font-mono text-[9px] text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {isOnline ? "SYS:ONLINE" : "SYS:OFFLINE"}
                </span>
              </div>
            </div>
          </Sidebar>

          <main className="flex-1 overflow-y-auto">
            <KeepAlive routes={ROUTES} />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Mobile layout (unchanged)
  return (
    <div className="flex min-h-screen flex-col bg-background scanline">
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2">
          <div className="h-[6px] w-[6px] rounded-full bg-primary animate-pulse-glow drop-shadow-[0_0_6px_hsl(160,100%,50%)] shadow-[0_0_12px_hsl(160,100%,50%),0_0_24px_hsl(160,100%,50%/0.4)] brightness-110 mix-blend-screen" />
          <h1 className="font-display text-sm tracking-[0.3em] text-primary hud-text-glow">
            INEVITÁVEL
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-1">
              <WifiOff className="h-3 w-3 text-destructive" />
              <span className="font-mono text-[9px] text-destructive uppercase tracking-wider">OFFLINE</span>
            </div>
          )}
          <div id="mobile-identity-slot" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <KeepAlive routes={ROUTES} />
      </main>

      {/* Gallery menu overlay */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center"
            onClick={() => setShowMenu(false)}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowMenu(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <X className="h-5 w-5" />
            </motion.button>

            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-8"
            >
              Módulos do sistema
            </motion.p>

            <div className="grid grid-cols-2 gap-4 px-8 w-full max-w-sm">
              {MORE_ITEMS.map((item, i) => {
                const isActive = location.pathname === item.path;
                const desc = item.description;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    onClick={(e) => { e.stopPropagation(); handleNavigate(item.path); }}
                    className={cn(
                      "flex flex-col items-center gap-2 p-5 rounded-sm border transition-all duration-200",
                      isActive
                        ? "border-primary bg-primary/10 text-primary hud-text-glow"
                        : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card/80"
                    )}
                  >
                    <item.icon className={cn("h-6 w-6", isActive && "drop-shadow-[0_0_6px_hsl(160,100%,50%)]")} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{item.label}</span>
                    {desc && (
                      <span className="font-mono text-[8px] text-muted-foreground/70 mt-0.5">{desc}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-sm pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="relative flex h-16 items-center justify-around">
          {activeIndex >= 0 && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute top-0 h-[2px] bg-primary"
              style={{ width: `${100 / 4}%` }}
              animate={{ left: `${(activeIndex * 100) / 4}%` }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          {isMoreActive && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute top-0 h-[2px] bg-primary"
              style={{ width: `${100 / 4}%` }}
              animate={{ left: `${(3 * 100) / 4}%` }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const isBriefingItem = item.path === "/briefing";
            const shouldPulse = isBriefingItem && briefingPending && !isActive;

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.85 }}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-2.5 text-xs transition-colors duration-200 min-w-[56px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_4px_hsl(160,100%,50%)]")} />
                  {shouldPulse && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-warning"
                    />
                  )}
                </motion.div>
                <span className={cn(
                  "font-mono text-[9px] uppercase tracking-[0.15em]",
                  isActive && "hud-text-glow"
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setShowMenu(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2.5 text-xs transition-colors duration-200 min-w-[56px]",
              isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <motion.div animate={isMoreActive ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.3 }}>
              <LayoutGrid className={cn("h-5 w-5", isMoreActive && "drop-shadow-[0_0_4px_hsl(160,100%,50%)]")} />
            </motion.div>
            <span className={cn(
              "font-mono text-[9px] uppercase tracking-[0.15em]",
              isMoreActive && "hud-text-glow"
            )}>
              Mais
            </span>
          </motion.button>
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
