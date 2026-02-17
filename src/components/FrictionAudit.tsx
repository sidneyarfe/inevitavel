import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Play, Clock, Loader2, ArrowRight, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type OverdueExecution = {
  id: string;
  habit_name: string;
  micro_action: string;
  preferred_time: string | null;
};

type FrictionAuditProps = {
  overdue: OverdueExecution[];
  onDismiss: () => void;
  onExecuteNow: (executionId: string) => void;
};

const FrictionAudit = ({ overdue, onDismiss, onExecuteNow }: FrictionAuditProps) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  // Two-step flow: "reason" → "ai_response"
  const [phase, setPhase] = useState<"reason" | "ai_response">("reason");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const responseRef = useRef("");

  const current = overdue[currentIndex];
  const isLast = currentIndex === overdue.length - 1;

  if (!current) return null;

  const goNext = () => {
    setReason("");
    setPhase("reason");
    setAiResponse("");
    responseRef.current = "";
    if (isLast) {
      onDismiss();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleExecuteNow = () => {
    onExecuteNow(current.id);
    goNext();
  };

  const fetchAIResponse = async (habitName: string, userReason: string) => {
    setAiLoading(true);
    setAiResponse("");
    responseRef.current = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || "https://wvmojslbxdwkpiiocflq.supabase.co"}/functions/v1/ai-analyst`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "friction_response",
            messages: [
              {
                role: "user",
                content: `O usuário não executou o hábito "${habitName}" porque: "${userReason}". Dê uma resposta curta de incentivo.`,
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        setAiResponse("Não foi possível gerar uma análise no momento. Continue firme — o sistema funciona quando você ajusta a estrutura.");
        setAiLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setAiResponse("Análise indisponível. Foque em ajustar o ambiente para prevenir esse atrito.");
        setAiLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE stream
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  responseRef.current += content;
                  setAiResponse(responseRef.current);
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      }
    } catch {
      setAiResponse("Erro ao conectar com o analista. Ajuste sua estrutura e execute quando puder.");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePostpone = async () => {
    if (!reason.trim()) {
      goNext();
      return;
    }

    setSaving(true);
    if (user && reason.trim()) {
      await supabase.from("friction_audits").insert({
        user_id: user.id,
        execution_id: current.id,
        reason: reason.trim(),
        suggestion: null,
      });
    }
    setSaving(false);

    // Move to AI response phase
    setPhase("ai_response");
    fetchAIResponse(current.habit_name, reason.trim());
  };

  return (
    <Dialog open onOpenChange={() => onDismiss()}>
      <DialogContent className="max-w-sm bg-card border-border p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-[0.2em] text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Diagnóstico de Negociação
            </DialogTitle>
          </DialogHeader>
          <p className="font-mono text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
            {currentIndex + 1}/{overdue.length} · {phase === "reason" ? "Detectando atrito" : "Análise do sistema"}
          </p>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {phase === "reason" ? (
              <motion.div
                key={`reason-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Habit info */}
                <div className="mb-4">
                  <h3 className="font-display text-base text-primary">{current.habit_name}</h3>
                  <p className="font-mono text-xs text-muted-foreground mt-1">{current.micro_action}</p>
                  {current.preferred_time && (
                    <p className="font-mono text-[10px] text-destructive/70 mt-1">
                      Horário previsto: {current.preferred_time.slice(0, 5)}
                    </p>
                  )}
                </div>

                {/* Text field */}
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Qual foi o argumento da sua negociação interna?"
                  className="border-border bg-secondary/50 text-foreground font-mono text-xs"
                  maxLength={200}
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleExecuteNow}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.12em] text-[10px] h-10 hud-glow"
                  >
                    <Play className="mr-1.5 h-3 w-3" /> Executar agora
                  </Button>
                  <Button
                    onClick={handlePostpone}
                    disabled={saving}
                    variant="outline"
                    className="flex-1 font-mono uppercase tracking-[0.12em] text-[10px] h-10 border-border text-muted-foreground hover:text-foreground"
                  >
                    <Clock className="mr-1.5 h-3 w-3" /> Depois
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`ai-${currentIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* AI analysis header */}
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="font-mono text-[10px] text-primary uppercase tracking-wider">Resposta do Analista</span>
                </div>

                {/* AI response text */}
                <div className="min-h-[60px] p-3 rounded-sm bg-secondary/30 border border-border/50">
                  {aiLoading && !aiResponse ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="font-mono text-[10px]">Analisando padrão...</span>
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {aiResponse}
                    </p>
                  )}
                </div>

                {/* Continue button */}
                <Button
                  onClick={goNext}
                  disabled={aiLoading && !aiResponse}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-mono uppercase tracking-[0.12em] text-[10px] h-10 hud-glow"
                >
                  <ArrowRight className="mr-1.5 h-3 w-3" /> Entendido
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FrictionAudit;
