import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAIChat, ChatMessage } from "@/hooks/useAIChat";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Square, Trash2, Sparkles, ArrowRight,
  RotateCcw, Bot, User, Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const QUICK_PROMPTS = [
  "Analise meu padrão de negociação interna",
  "Qual hábito está com mais atrito?",
  "Onde está meu maior risco de falha?",
  "Sugira ajustes para esta semana",
];

const Analyst = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"analyst" | "onboarding">("analyst");
  const { messages, isLoading, sendMessage, stop, reset } = useAIChat({ mode });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Parse habits from assistant message for onboarding
  const parseHabitsFromMessage = (content: string) => {
    const match = content.match(/```json:habits\s*\n([\s\S]*?)```/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  };

  const handleAcceptHabits = async (habits: any[]) => {
    if (!user) return;
    try {
      const payload = habits.map((h: any) => ({
        user_id: user.id,
        name: h.name,
        micro_action: h.micro_action || "Executar 2 minutos",
        trigger_cue: h.trigger_cue || null,
        preferred_time: h.preferred_time || null,
        days_of_week: h.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        timer_duration: h.timer_duration || 120,
      }));

      const { error } = await supabase.from("habits").insert(payload);
      if (error) throw error;

      toast({ title: "Sistema configurado.", description: `${habits.length} hábitos criados com sucesso.` });
      navigate("/");
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao criar hábitos.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:max-w-3xl lg:mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm text-primary tracking-wider">
              ANALISTA DE SISTEMA
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMode("analyst"); reset(); }}
              className={cn(
                "font-mono text-[9px] uppercase tracking-wider h-7 px-2",
                mode === "analyst" ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              Análise
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMode("onboarding"); reset(); }}
              className={cn(
                "font-mono text-[9px] uppercase tracking-wider h-7 px-2",
                mode === "onboarding" ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              Setup
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="font-mono text-[9px] text-muted-foreground mt-1">
          {mode === "analyst"
            ? "Diagnóstico estrutural baseado em dados de execução"
            : "Entrevista guiada para configurar seu sistema"}
        </p>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Brain className="h-10 w-10 text-primary/30 mx-auto mb-4" />
              <p className="font-display text-sm text-primary/60 mb-2">
                {mode === "analyst" ? "Analista pronto." : "Inicialização do sistema."}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground max-w-xs">
                {mode === "analyst"
                  ? "Faça perguntas sobre seus padrões de negociação interna ou peça diagnósticos."
                  : "Vou te entrevistar para configurar seus hábitos de forma otimizada."}
              </p>
            </motion.div>

            {mode === "analyst" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-xs md:max-w-md"
              >
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left p-2.5 border border-border rounded-sm bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {prompt}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            {mode === "onboarding" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <Button
                  onClick={() => sendMessage("Quero configurar meus hábitos. Comece a entrevista.")}
                  className="font-mono uppercase tracking-wider text-[10px] bg-primary text-primary-foreground hud-glow"
                >
                  <Sparkles className="h-3 w-3 mr-2" /> Iniciar Instalação
                </Button>
              </motion.div>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const habits = !isUser ? parseHabitsFromMessage(msg.content) : null;
            // Clean content for display (remove the JSON block)
            const displayContent = msg.content.replace(/```json:habits\s*\n[\s\S]*?```/g, "").trim();

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-sm px-3 py-2",
                    isUser
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-card/50 border border-border"
                  )}
                >
                  {displayContent && (
                    <div className="font-mono text-[11px] md:text-xs leading-relaxed text-foreground prose prose-invert prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                      <ReactMarkdown>{displayContent}</ReactMarkdown>
                    </div>
                  )}

                  {/* Habit cards from onboarding */}
                  {habits && (
                    <div className="mt-3 space-y-2">
                      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                        Hábitos sugeridos:
                      </p>
                      {habits.map((h: any, hi: number) => (
                        <div
                          key={hi}
                          className="border border-primary/20 bg-primary/5 rounded-sm p-2"
                        >
                          <p className="font-display text-xs text-primary">{h.name}</p>
                          <p className="font-mono text-[9px] text-muted-foreground">
                            Micro: {h.micro_action} · {h.preferred_time || "—"} · Gatilho: {h.trigger_cue || "—"}
                          </p>
                        </div>
                      ))}
                      <Button
                        onClick={() => handleAcceptHabits(habits)}
                        className="w-full mt-2 font-mono uppercase tracking-wider text-[10px] bg-primary text-primary-foreground hud-glow h-8"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" /> Aceitar e configurar
                      </Button>
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-sm bg-secondary border border-border flex items-center justify-center">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            <div className="h-6 w-6 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="bg-card/50 border border-border rounded-sm px-3 py-2">
              <Loader2 className="h-3 w-3 text-primary animate-spin" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "analyst" ? "Pergunte ao sistema..." : "Responda ao sistema..."}
            className="flex-1 font-mono text-[11px] bg-card/30 border-border h-9"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              onClick={stop}
              variant="outline"
              size="icon"
              className="h-9 w-9 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              size="icon"
              className="h-9 w-9 bg-primary text-primary-foreground"
            >
              <Send className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analyst;
