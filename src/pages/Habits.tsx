import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Power, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import HabitWizard from "@/components/HabitWizard";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type Habit = {
  id: string;
  name: string;
  micro_action: string;
  preferred_time: string | null;
  trigger_cue: string | null;
  days_of_week: number[];
  is_active: boolean;
  timer_duration: number;
  full_duration: number | null;
  anchor_id: string | null;
  anchor_position: string;
  anchor_name?: string | null;
  anchor_icon?: string | null;
  anchor_typical_time?: string | null;
};

const Habits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadHabits = async () => {
    if (!user) return;
    const [habitsRes, anchorsRes] = await Promise.all([
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("anchor_habits").select("id, name, icon, typical_time").eq("user_id", user.id),
    ]);
    if (habitsRes.data) {
      const anchorMap = new Map<string, { name: string; icon: string; typical_time: string | null }>();
      (anchorsRes.data ?? []).forEach((a: any) => anchorMap.set(a.id, a));
      setHabits(habitsRes.data.map((h: any) => {
        const anchor = h.anchor_id ? anchorMap.get(h.anchor_id) : null;
        return { ...h, anchor_name: anchor?.name ?? null, anchor_icon: anchor?.icon ?? null, anchor_typical_time: anchor?.typical_time ?? null };
      }));
    }
    setLoading(false);
  };

  useEffect(() => { loadHabits(); }, [user]);

  const openCreate = () => { setEditing(null); setWizardOpen(true); };
  const openEdit = (habit: Habit) => { setEditing(habit); setWizardOpen(true); };

  const handleWizardComplete = async (data: {
    name: string; micro_action: string; preferred_time: string; trigger_cue: string;
    days_of_week: number[]; timer_duration: number; full_duration: number | null;
    anchor_id: string | null; anchor_position: "before" | "after";
  }) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      name: data.name.trim(),
      micro_action: data.micro_action.trim() || "Começar a ação",
      preferred_time: data.preferred_time || null,
      trigger_cue: data.trigger_cue.trim() || null,
      days_of_week: data.days_of_week,
      timer_duration: data.timer_duration,
      full_duration: data.full_duration,
      anchor_id: data.anchor_id,
      anchor_position: data.anchor_position,
    };
    if (editing) {
      const { error } = await supabase.from("habits").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Erro.", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("habits").insert(payload);
      if (error) { toast({ title: "Erro.", description: error.message, variant: "destructive" }); return; }
    }
    setWizardOpen(false);
    setEditing(null);
    loadHabits();
    window.dispatchEvent(new Event("habits-changed"));
  };

  const toggleActive = async (habit: Habit) => {
    await supabase.from("habits").update({ is_active: !habit.is_active }).eq("id", habit.id);
    loadHabits();
    window.dispatchEvent(new Event("habits-changed"));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("habits").delete().eq("id", deleteTarget);
    setDeleteTarget(null);
    loadHabits();
    window.dispatchEvent(new Event("habits-changed"));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="font-mono text-xs text-muted-foreground animate-pulse-glow">Carregando hábitos...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 md:px-8 lg:max-w-4xl lg:mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h2 className="font-display text-lg text-primary">Hábitos Configurados</h2>
        </div>
        <Button onClick={openCreate} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80 font-mono text-[10px] uppercase tracking-wider">
          <Plus className="mr-1 h-3 w-3" />
          Novo
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center text-center px-6">
          <ListChecks className="h-8 w-8 text-muted-foreground/30 mb-4" />
          <h3 className="font-display text-base text-primary">Nenhum hábito configurado</h3>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground max-w-xs">
            Crie seu primeiro hábito para ativar o Sistema de Ação Inevitável.
          </p>
          <Button
            onClick={openCreate}
            className="mt-6 bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.15em] text-xs hud-glow"
          >
            <Plus className="mr-2 h-3 w-3" />
            Criar Primeiro Hábito
          </Button>
        </div>
      ) : (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {habits.map((habit) => (
            <div key={habit.id} className={`hud-border bg-card/60 backdrop-blur-sm p-4 flex items-center justify-between ${!habit.is_active ? "opacity-40" : ""}`}>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm text-primary truncate">{habit.name}</h3>
                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{habit.micro_action}</p>
                {habit.anchor_name && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs">{habit.anchor_icon}</span>
                    <span className="font-mono text-[9px] text-primary/60 uppercase tracking-wider">
                      {habit.anchor_position === "before" ? "antes de" : "depois de"} {habit.anchor_name}
                    </span>
                    {habit.anchor_typical_time && (
                      <span className="font-mono text-[9px] text-muted-foreground">~{habit.anchor_typical_time.slice(0, 5)}</span>
                    )}
                  </div>
                )}
                <div className="mt-2 flex gap-1">
                  {DAYS.map((d, i) => (
                    <span
                      key={i}
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm ${habit.days_of_week.includes(i)
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-secondary text-muted-foreground"
                        }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3">
                <button onClick={() => toggleActive(habit)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => openEdit(habit)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(habit.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Habit Wizard */}
      {wizardOpen && (
        <HabitWizard
          onComplete={handleWizardComplete}
          onCancel={() => { setWizardOpen(false); setEditing(null); }}
          userId={user?.id}
          initialData={editing ? {
            name: editing.name,
            micro_action: editing.micro_action,
            preferred_time: editing.preferred_time ?? "",
            trigger_cue: editing.trigger_cue ?? "",
            days_of_week: editing.days_of_week,
            timer_duration: editing.timer_duration ?? 120,
            full_duration: editing.full_duration ?? null,
            anchor_id: editing.anchor_id ?? null,
            anchor_position: (editing.anchor_position as "before" | "after") ?? "after",
          } : undefined}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-[0.2em] text-primary text-sm">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-[11px] text-muted-foreground">
              Esta ação é irreversível. O hábito e todo histórico de provas associado serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-[10px] uppercase tracking-wider">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-[10px] uppercase tracking-wider"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Habits;
