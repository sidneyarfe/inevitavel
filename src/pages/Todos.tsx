import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Todo = {
  id: string;
  text: string;
  is_done: boolean;
  sort_order: number;
};

const Todos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const loadTodos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_todos")
      .select("id, text, is_done, sort_order")
      .eq("user_id", user.id)
      .eq("todo_date", today)
      .order("sort_order")
      .order("created_at");
    setTodos((data as Todo[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadTodos(); }, [user]);

  const addTodo = async () => {
    const trimmed = newText.trim();
    if (!trimmed || !user) return;
    const { error } = await supabase.from("daily_todos").insert({
      user_id: user.id,
      text: trimmed,
      todo_date: today,
      sort_order: todos.length,
    });
    if (error) {
      toast({ title: "Erro ao adicionar.", variant: "destructive" });
      return;
    }
    setNewText("");
    loadTodos();
  };

  const toggleTodo = async (id: string, current: boolean) => {
    await supabase.from("daily_todos").update({ is_done: !current }).eq("id", id);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, is_done: !current } : t)));
  };

  const deleteTodo = async (id: string) => {
    await supabase.from("daily_todos").delete().eq("id", id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const doneCount = todos.filter((t) => t.is_done).length;

  return (
    <div className="flex flex-col px-4 pt-6 pb-4 md:px-8 lg:max-w-2xl lg:mx-auto">
      {/* Header */}
      <div className="mb-5 px-1">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm tracking-[0.2em] text-primary uppercase">
            Tarefas do Dia
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}
          </span>
        </div>
        {todos.length > 0 && (
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            {doneCount}/{todos.length} concluídas
          </p>
        )}
      </div>

      {/* Add form */}
      <div className="flex gap-2 mb-4">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Nova tarefa..."
          className="font-mono text-xs bg-card/50 border-border h-9"
        />
        <Button
          onClick={addTodo}
          disabled={!newText.trim()}
          size="sm"
          className="h-9 px-3 font-mono text-[10px] uppercase tracking-wider"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-primary/5 animate-pulse rounded-sm" />
          ))}
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-mono text-[11px] text-muted-foreground">
            Nenhuma tarefa para hoje.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/50 mt-1">
            Adicione acima para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 bg-card/50 group transition-all min-h-[52px]",
                  todo.is_done && "opacity-40"
                )}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.is_done)}
                  className="flex-shrink-0 text-primary hover:scale-110 transition-transform p-1 -m-1"
                >
                  {todo.is_done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 font-mono text-sm md:text-base",
                    todo.is_done && "line-through text-muted-foreground"
                  )}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 md:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 -m-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Todos;
