import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
// Neon circle logo replaces biohabits_logo.png

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        toast({
          title: "Cadastro iniciado.",
          description: "Verifique seu email para confirmar o acesso."
        });
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`
        });
        if (error) throw error;
        toast({
          title: "Email enviado.",
          description: "Verifique sua caixa de entrada para redefinir a senha."
        });
        setMode("login");
      }
    } catch (error: any) {
      toast({
        title: "Falha no sistema.",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background scanline px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-2 w-2 rounded-full bg-primary animate-pulse-glow drop-shadow-[0_0_8px_hsl(160,100%,50%)] shadow-[0_0_16px_hsl(160,100%,50%),0_0_32px_hsl(160,100%,50%/0.4)] brightness-110 mix-blend-screen" />
          <h1 className="font-display text-2xl tracking-[0.3em] text-primary hud-text-glow">
            INEVITÁVEL
          </h1>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground tracking-wider">ESTRUTURA + AMBIENTE + MICRO AÇÃO + PROVAS = DISCIPLINA.

          </p>
        </div>

        <div className="hud-border hud-corner p-6 bg-card/50 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            {mode === "reset" &&
              <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            }
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {mode === "login" ? "Autenticação" : mode === "signup" ? "Registro" : "Recuperar Senha"}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="email@domínio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground font-mono text-xs" />

            {mode !== "reset" &&
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground font-mono text-xs" />

            }
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-display uppercase tracking-[0.2em] text-xs hud-glow">

              {loading ?
                "Processando..." :
                mode === "login" ?
                  "Acessar Sistema" :
                  mode === "signup" ?
                    "Registrar" :
                    "Enviar Link"}
            </Button>
          </form>

          {mode !== "reset" && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card/50 px-3 font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({ title: "Falha no login Google.", description: String(error), variant: "destructive" });
                    setLoading(false);
                  }
                }}
                className="w-full border-border bg-secondary/50 hover:bg-secondary font-mono text-xs tracking-wider gap-2"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Entrar com Google
              </Button>
            </>
          )}

          {mode === "login" &&
            <button
              onClick={() => setMode("reset")}
              className="block w-full text-center font-mono text-[10px] text-muted-foreground/60 hover:text-primary transition-colors tracking-wider mt-3">
              Esqueci minha senha
            </button>
          }
        </div>

        {mode !== "reset" &&
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="block w-full text-center font-mono text-[11px] text-muted-foreground hover:text-primary transition-colors tracking-wider">

            {mode === "login" ? "[ CRIAR CONTA ]" : "[ JÁ TENHO ACESSO ]"}
          </button>
        }
      </div>
    </div>);

};

export default Auth;