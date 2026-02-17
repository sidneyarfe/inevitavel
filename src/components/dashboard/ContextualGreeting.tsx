import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContextualGreetingProps {
  userId: string;
  pendingCount: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Madrugada operacional";
  if (hour < 12) return "Bom dia, operador";
  if (hour < 18) return "Boa tarde, operador";
  return "Boa noite, operador";
}

function getSubline(pendingCount: number): string {
  const hour = new Date().getHours();
  if (pendingCount === 0) return "Sistema consolidado. Todas as provas registradas.";
  if (hour < 10) return "Janela matinal ativa. Ação inevitável agora.";
  if (hour < 14) return "Fase de execução. Mantenha o sistema girando.";
  if (hour < 18) return "Tarde operacional. Finalize hábitos pendentes.";
  if (hour < 22) return "Janela noturna. Última chance de registro.";
  return "Horário crítico. Registre o que puder.";
}

const ContextualGreeting = ({ userId, pendingCount }: ContextualGreetingProps) => {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchName = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle();
      if (data?.display_name) setDisplayName(data.display_name);
    };
    fetchName();
  }, [userId]);

  const greeting = getGreeting();
  const baseName = displayName ?? "operador";
  // Replace generic "operador" with actual name
  const personalGreeting = displayName
    ? greeting.replace("operador", displayName)
    : greeting;

  return (
    <div className="mb-1 px-1">
      <h2 className="font-display text-lg md:text-2xl text-primary hud-text-glow">
        {personalGreeting}
      </h2>
      <p className="font-mono text-[10px] md:text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <p className="font-mono text-[11px] md:text-xs text-foreground/80 italic mt-1">
        {getSubline(pendingCount)}
      </p>
    </div>
  );
};

export default ContextualGreeting;
