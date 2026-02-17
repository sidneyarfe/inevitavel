import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const retryQueue = useRef<Array<() => Promise<void>>>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Conexão restaurada.", description: "Sincronizando dados..." });
      // Flush retry queue
      const queue = [...retryQueue.current];
      retryQueue.current = [];
      queue.forEach((fn) => fn());
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({ title: "Sem conexão.", description: "Ações serão sincronizadas ao reconectar.", variant: "destructive" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const addToRetryQueue = useCallback((fn: () => Promise<void>) => {
    retryQueue.current.push(fn);
  }, []);

  return { isOnline, addToRetryQueue };
}
