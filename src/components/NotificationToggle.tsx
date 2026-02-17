import { useState, useEffect } from "react";
import { Bell, BellOff, Moon, Zap, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const NotificationToggle = () => {
  const { supported, permission, subscribed, subscribe, unsubscribe } = useNotifications();
  const { toast } = useToast();
  const { user } = useAuth();

  const [notifyBriefing, setNotifyBriefing] = useState(true);
  const [notifyHabits, setNotifyHabits] = useState(true);
  const [briefingHour, setBriefingHour] = useState(21);
  const [advanceMinutes, setAdvanceMinutes] = useState(15);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("notify_briefing, notify_habits, briefing_hour, notify_advance_minutes, timezone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setNotifyBriefing(data.notify_briefing ?? true);
        setNotifyHabits(data.notify_habits ?? true);
        setBriefingHour(data.briefing_hour ?? 21);
        setAdvanceMinutes((data as any).notify_advance_minutes ?? 15);
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const savedTz = (data as any).timezone;
        setTimezone(savedTz || detectedTz);
        // Auto-update timezone if different from saved
        if (savedTz !== detectedTz) {
          await supabase.from("profiles").update({ timezone: detectedTz } as any).eq("user_id", user.id);
          setTimezone(detectedTz);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const savePreference = async (field: string, value: boolean | number | string) => {
    if (!user) return;
    await supabase.from("profiles").update({ [field]: value } as any).eq("user_id", user.id);
  };

  const isEnabled = supported && subscribed && permission === "granted";

  const handleMainToggle = async () => {
    if (isEnabled) {
      await unsubscribe();
      toast({ title: "Notificações desativadas." });
      return;
    }
    const result = await subscribe();
    if (result === "granted") {
      toast({ title: "Notificações ativadas!", description: "Configure abaixo quais lembretes deseja receber." });
    } else {
      toast({ title: "Permissão negada.", description: "Ative nas configurações do navegador.", variant: "destructive" });
    }
  };

  const handleBriefingToggle = (checked: boolean) => {
    setNotifyBriefing(checked);
    savePreference("notify_briefing", checked);
  };

  const handleHabitsToggle = (checked: boolean) => {
    setNotifyHabits(checked);
    savePreference("notify_habits", checked);
  };

  const handleHourChange = (value: string) => {
    const hour = parseInt(value);
    setBriefingHour(hour);
    savePreference("briefing_hour", hour);
  };

  return (
    <div className="hud-border bg-card/60 backdrop-blur-sm p-5 space-y-4">
      {/* Main toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <h3 className="font-display text-sm text-primary">Notificações Push</h3>
            <p className="font-mono text-[9px] text-muted-foreground">
              {!supported
                ? "Não suportado neste navegador"
                : isEnabled
                  ? "Ativas — configure abaixo"
                  : "Ative para receber lembretes push"}
            </p>
          </div>
        </div>
        <Button
          onClick={handleMainToggle}
          variant="outline"
          size="sm"
          disabled={!supported}
          className={
            isEnabled
              ? "font-mono text-[9px] uppercase tracking-wider border-primary/30 text-primary h-7"
              : "font-mono text-[9px] uppercase tracking-wider border-border text-muted-foreground hover:text-primary h-7"
          }
        >
          {isEnabled ? "Desativar" : "Ativar"}
        </Button>
      </div>

      {/* Granular settings - only show when enabled */}
      {isEnabled && !loading && (
        <div className="space-y-3 pt-2 border-t border-border/50">
          {/* Briefing toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="font-mono text-[10px] text-foreground/80 uppercase tracking-wider">
                  Briefing Noturno
                </span>
                <p className="font-mono text-[8px] text-muted-foreground">
                  Lembrete para armar o campo
                </p>
              </div>
            </div>
            <Switch
              checked={notifyBriefing}
              onCheckedChange={handleBriefingToggle}
              className="scale-75"
            />
          </div>

          {/* Briefing hour selector */}
          {notifyBriefing && (
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground/60" />
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                  Horário
                </span>
              </div>
              <Select value={String(briefingHour)} onValueChange={handleHourChange}>
                <SelectTrigger className="w-20 h-7 font-mono text-[10px] border-border bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => i + 18).map((h) => (
                    <SelectItem key={h} value={String(h)} className="font-mono text-[10px]">
                      {String(h).padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Habits toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="font-mono text-[10px] text-foreground/80 uppercase tracking-wider">
                  Lembretes de Hábitos
                </span>
                <p className="font-mono text-[8px] text-muted-foreground">
                  Aviso antes do horário agendado
                </p>
              </div>
            </div>
            <Switch
              checked={notifyHabits}
              onCheckedChange={handleHabitsToggle}
              className="scale-75"
            />
          </div>

          {/* Advance minutes selector */}
          {notifyHabits && (
            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground/60" />
                <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                  Antecedência
                </span>
              </div>
              <Select
                value={String(advanceMinutes)}
                onValueChange={(v) => {
                  const mins = parseInt(v);
                  setAdvanceMinutes(mins);
                  savePreference("notify_advance_minutes", mins);
                }}
              >
                <SelectTrigger className="w-24 h-7 font-mono text-[10px] border-border bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 30, 60].map((m) => (
                    <SelectItem key={m} value={String(m)} className="font-mono text-[10px]">
                      {m} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Timezone info */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="font-mono text-[10px] text-foreground/80 uppercase tracking-wider">
                  Fuso Horário
                </span>
                <p className="font-mono text-[8px] text-muted-foreground">
                  Detectado automaticamente
                </p>
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {timezone.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationToggle;
