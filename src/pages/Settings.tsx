import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, User, Save, Shield, Info, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useStreak } from "@/hooks/useStreak";
import { motion } from "framer-motion";
import NotificationToggle from "@/components/NotificationToggle";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [habitCount, setHabitCount] = useState(0);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const { streak } = useStreak(user?.id);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!error && data) {
      setDisplayName(data.display_name ?? "");
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;
    const [habitsRes, execsRes] = await Promise.all([
      supabase.from("habits").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_active", true),
      supabase.from("daily_executions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "executed"),
    ]);
    setHabitCount(habitsRes.count ?? 0);
    setTotalExecutions(execsRes.count ?? 0);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() || null })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Erro.", description: "Falha ao salvar perfil.", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado." });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="flex flex-col px-4 pt-6 pb-4 md:px-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h2 className="font-display text-lg text-primary">Configurações</h2>
      </div>

      <div className="space-y-4 max-w-sm lg:max-w-lg">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hud-border hud-corner bg-card/60 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-sm bg-primary/15 border border-primary/30 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-primary truncate">
                {displayName || user?.email?.split("@")[0] || "Operador"}
              </p>
              <p className="font-mono text-[9px] text-muted-foreground truncate">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                Nome de exibição
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome..."
                className="border-border bg-secondary/50 text-foreground font-mono text-xs h-8"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.12em] text-[10px] h-8 hud-glow"
            >
              <Save className="mr-1.5 h-3 w-3" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </motion.div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="hud-border bg-card/60 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm text-primary">Estatísticas</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <span className="font-mono text-lg text-primary hud-text-glow">{habitCount}</span>
              <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">
                Hábitos ativos
              </span>
            </div>
            <div className="text-center">
              <span className="font-mono text-lg text-primary">{totalExecutions}</span>
              <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">
                Total executado
              </span>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-lg text-primary">{streak}</span>
              </div>
              <span className="block font-mono text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">
                Streak atual
              </span>
            </div>
          </div>
        </motion.div>


        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <NotificationToggle />
        </motion.div>

        {/* System info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hud-border bg-card/60 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm text-primary">Sistema</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Versão</span>
              <span className="font-mono text-[10px] text-foreground/70">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Membro desde</span>
              <span className="font-mono text-[10px] text-foreground/70 capitalize">{memberSince}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
              <span className="font-mono text-[10px] text-primary">OPERACIONAL</span>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full font-mono uppercase tracking-[0.12em] text-[10px] h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="mr-1.5 h-3 w-3" />
            Encerrar Sessão
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
