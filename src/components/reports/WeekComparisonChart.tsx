import { useMemo, useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { startOfWeek, endOfWeek, addWeeks, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userId: string;
  habits: { id: string; name: string; days_of_week: number[] }[];
};

const WeekComparisonChart = ({ userId, habits }: Props) => {
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState<{ week: string; rate: number; executed: number; total: number }[]>([]);

  useEffect(() => {
    if (!userId || habits.length === 0) return;
    loadWeeks();
  }, [userId, habits]);

  const loadWeeks = async () => {
    setLoading(true);
    const now = new Date();
    const weeks: { start: Date; end: Date; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = addWeeks(now, -i);
      const s = startOfWeek(ref, { weekStartsOn: 0 });
      const e = endOfWeek(ref, { weekStartsOn: 0 });
      weeks.push({
        start: s,
        end: e,
        label: format(s, "dd/MM", { locale: ptBR }),
      });
    }

    const globalStart = format(weeks[0].start, "yyyy-MM-dd");
    const globalEnd = format(weeks[weeks.length - 1].end, "yyyy-MM-dd");

    const { data: execs } = await supabase
      .from("daily_executions")
      .select("habit_id, execution_date, status")
      .eq("user_id", userId)
      .gte("execution_date", globalStart)
      .lte("execution_date", globalEnd);

    const execMap = new Map<string, string>();
    (execs ?? []).forEach((e: any) => {
      execMap.set(`${e.habit_id}_${e.execution_date}`, e.status);
    });

    const result = weeks.map((w) => {
      const days = eachDayOfInterval({ start: w.start, end: w.end });
      let total = 0, executed = 0;
      habits.forEach((h) => {
        days.forEach((d) => {
          if (!h.days_of_week.includes(d.getDay())) return;
          const dateStr = format(d, "yyyy-MM-dd");
          // skip future dates
          if (new Date(dateStr) > now) return;
          total++;
          if (execMap.get(`${h.id}_${dateStr}`) === "executed") executed++;
        });
      });
      return {
        week: w.label,
        rate: total > 0 ? Math.round((executed / total) * 100) : 0,
        executed,
        total,
      };
    });

    setWeekData(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="hud-border bg-card/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h3 className="font-display text-sm text-primary">Comparação Semanal</h3>
        </div>
        <div className="h-32 flex items-center justify-center">
          <span className="font-mono text-[10px] text-muted-foreground animate-pulse">Carregando...</span>
        </div>
      </div>
    );
  }

  const trend = weekData.length >= 2
    ? weekData[weekData.length - 1].rate - weekData[weekData.length - 2].rate
    : 0;

  return (
    <div className="hud-border bg-card/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h3 className="font-display text-sm text-primary">Comparação Semanal</h3>
        </div>
        {trend !== 0 && (
          <span
            className={`font-mono text-[10px] ${
              trend > 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 30% 18% / 0.5)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "hsl(160 15% 45%)", fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(160 15% 45%)", fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(210 15% 9%)",
                border: "1px solid hsl(160 30% 18%)",
                borderRadius: 4,
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                color: "hsl(160 100% 85%)",
              }}
              formatter={(value: number) => [`${value}%`, "Taxa"]}
              labelFormatter={(label) => `Sem. ${label}`}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="hsl(160 100% 50%)"
              strokeWidth={2}
              dot={{ fill: "hsl(160 100% 50%)", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "hsl(160 100% 50%)", stroke: "hsl(210 15% 6%)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
        <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">Últimas 6 semanas</span>
        <span className="font-mono text-[9px] text-muted-foreground">
          Média: {weekData.length > 0 ? Math.round(weekData.reduce((a, b) => a + b.rate, 0) / weekData.length) : 0}%
        </span>
      </div>
    </div>
  );
};

export default WeekComparisonChart;
