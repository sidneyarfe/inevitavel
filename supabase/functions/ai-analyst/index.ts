import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT_ANALYST = `Você é o Analista de Sistema do Inevitável — um assistente tático, direto e baseado em dados.

Seu papel:
- Analisar os dados de execução do usuário e identificar padrões de falha
- Sugerir ajustes estruturais (horários, gatilhos, ambiente)
- Nunca culpar o usuário — o problema é sempre estrutural
- Usar tom frio, estratégico, sem emojis
- Respostas curtas e acionáveis (máximo 3 parágrafos)
- Quando identificar padrões, apresentar dados concretos (ex: "Você falha 80% das vezes após 20h")
- Sugerir mudanças específicas de ambiente e estrutura

Filosofia central: Disciplina = Estrutura + Ambiente. Nunca motivação ou força de vontade.

Dados do usuário estão no contexto do sistema. Use-os para análises personalizadas.`;

const SYSTEM_PROMPT_ONBOARDING = `Você é o Analista de Sistema do Inevitável — guiando a inicialização do sistema comportamental do usuário.

Seu papel no onboarding:
1. Fazer uma entrevista curta e tática (3-5 perguntas no total, UMA por mensagem)
2. Entender quais hábitos o usuário quer criar
3. Entender as motivações profundas (mas sem terapia — seja direto)
4. Identificar os melhores horários, gatilhos e versões micro de cada hábito
5. No final, apresentar os hábitos sugeridos em formato estruturado

Tom: frio, estratégico, direto. Sem emojis. Frases curtas.

Fluxo da entrevista:
- Mensagem 1: Pergunte que áreas da vida o usuário quer melhorar (saúde, produtividade, conhecimento, etc)
- Mensagem 2: Pergunte quais ações específicas ele já tentou e falhou
- Mensagem 3: Pergunte sobre sua rotina (quando acorda, trabalha, horários livres)
- Mensagem 4: Sugira 2-4 hábitos com versão micro, gatilho e horário ideal
- Mensagem 5: Confirme e peça pra ele aceitar o plano

IMPORTANTE: Quando estiver pronto para sugerir hábitos, formate-os assim em um bloco de código JSON:
\`\`\`json:habits
[
  {
    "name": "Nome do Hábito",
    "micro_action": "Versão micro de 2 min",
    "trigger_cue": "Gatilho sugerido",
    "preferred_time": "07:00",
    "days_of_week": [0,1,2,3,4,5,6],
    "timer_duration": 120
  }
]
\`\`\`

Comece se apresentando brevemente e fazendo a primeira pergunta.`;

const SYSTEM_PROMPT_FRICTION = `Você é o Analista do Inevitável. O usuário não executou um hábito e explicou o motivo.

Sua tarefa:
- Dê uma resposta curta (2-3 frases), direta, sem emojis
- Reconheça o obstáculo sem validar a desistência
- Incentive-o a prevenir isso no futuro e a executar o hábito o mais rápido possível
- Sugira uma mudança estrutural simples (ambiente, horário, versão micro)
- Tom empático mas firme. Filosofia: o problema é estrutural, não pessoal.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode = "analyst" } = await req.json();

    // Fetch user data for context
    let userContext = "";

    if (mode === "analyst") {
      // Fetch habits
      const { data: habits } = await supabase
        .from("habits")
        .select("name, micro_action, trigger_cue, preferred_time, days_of_week, is_active, timer_duration")
        .eq("user_id", user.id);

      // Fetch last 30 days of executions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: executions } = await supabase
        .from("daily_executions")
        .select("habit_id, status, execution_date, duration_seconds, completion_type")
        .eq("user_id", user.id)
        .gte("execution_date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("execution_date", { ascending: false });

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, timezone")
        .eq("user_id", user.id)
        .single();

      // Fetch friction audits
      const { data: audits } = await supabase
        .from("friction_audits")
        .select("reason, suggestion, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      userContext = `
DADOS DO USUÁRIO:
- Nome: ${profile?.display_name || "não definido"}
- Timezone: ${profile?.timezone || "America/Sao_Paulo"}

HÁBITOS CONFIGURADOS:
${habits?.map((h) => `- ${h.name} (micro: ${h.micro_action}, horário: ${h.preferred_time || "sem horário"}, gatilho: ${h.trigger_cue || "sem gatilho"}, dias: ${h.days_of_week.join(",")})`).join("\n") || "Nenhum hábito configurado"}

EXECUÇÕES (últimos 30 dias, ${executions?.length || 0} registros):
${(() => {
          if (!executions || !habits) return "Sem dados";
          const stats: Record<string, { total: number; executed: number; failed: number; pending: number; byHour: Record<string, { total: number; failed: number }> }> = {};
          for (const e of executions) {
            const habit = habits.find((h) => h.id === e.habit_id);
            const name = habit?.name || e.habit_id;
            if (!stats[name]) stats[name] = { total: 0, executed: 0, failed: 0, pending: 0, byHour: {} };
            stats[name].total++;
            stats[name][e.status as "executed" | "failed" | "pending"]++;
            const time = habit?.preferred_time || "sem_horario";
            if (!stats[name].byHour[time]) stats[name].byHour[time] = { total: 0, failed: 0 };
            stats[name].byHour[time].total++;
            if (e.status === "failed" || e.status === "pending") stats[name].byHour[time].failed++;
          }
          return Object.entries(stats)
            .map(([name, s]) => {
              const rate = Math.round((s.executed / s.total) * 100);
              const hourAnalysis = Object.entries(s.byHour)
                .map(([h, d]) => `${h}: ${Math.round((d.failed / d.total) * 100)}% falha`)
                .join(", ");
              return `- ${name}: ${rate}% sucesso (${s.executed}/${s.total}), falhas por horário: ${hourAnalysis}`;
            })
            .join("\n");
        })()}

AUDITORIAS DE ATRITO RECENTES:
${audits?.map((a) => `- Razão: ${a.reason}${a.suggestion ? `, Sugestão: ${a.suggestion}` : ""}`).join("\n") || "Nenhuma auditoria"}`;
    }

    const systemPrompt = mode === "onboarding" ? SYSTEM_PROMPT_ONBOARDING : mode === "friction_response" ? SYSTEM_PROMPT_FRICTION : SYSTEM_PROMPT_ANALYST;
    const fullSystemPrompt = systemPrompt + (userContext ? "\n\n" + userContext : "");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em breve." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-analyst error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
