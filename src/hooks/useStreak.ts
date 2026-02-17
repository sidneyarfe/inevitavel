import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useStreak = (userId: string | undefined) => {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const calculateStreak = async () => {
      setLoading(true);

      // Get distinct dates where ALL habits for that day were executed
      const { data, error } = await supabase
        .from("daily_executions")
        .select("execution_date, status")
        .eq("user_id", userId)
        .order("execution_date", { ascending: false });

      if (error || !data) {
        setStreak(0);
        setLoading(false);
        return;
      }

      // Group by date
      const byDate = new Map<string, { total: number; executed: number }>();
      for (const row of data) {
        const entry = byDate.get(row.execution_date) ?? { total: 0, executed: 0 };
        entry.total++;
        if (row.status === "executed") entry.executed++;
        byDate.set(row.execution_date, entry);
      }

      // Sort dates descending
      const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

      let count = 0;
      const today = new Date();

      for (let i = 0; i < dates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        const expectedStr = expectedDate.toISOString().split("T")[0];

        if (dates[i] !== expectedStr) break;

        const entry = byDate.get(dates[i])!;
        // Day counts if all habits were executed
        if (entry.executed === entry.total && entry.total > 0) {
          count++;
        } else if (i === 0) {
          // Today can be incomplete — don't break streak, just don't count it
          continue;
        } else {
          break;
        }
      }

      setStreak(count);
      setLoading(false);
    };

    calculateStreak();
  }, [userId]);

  return { streak, loading };
};
