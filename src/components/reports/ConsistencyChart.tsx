import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  days: Date[];
  habits: { id: string; name: string; days_of_week: number[] }[];
  getExec: (habitId: string, date: Date) => { status: string; completion_type?: string };
};

const ConsistencyChart = ({ days, habits, getExec }: Props) => {
  const data = useMemo(() => {
    return days.map((day) => {
      let total = 0, executed = 0;
      habits.forEach((h) => {
        if (!h.days_of_week.includes(day.getDay())) return;
        total++;
        const e = getExec(h.id, day);
        if (e.status === "executed") executed++;
      });
      const rate = total > 0 ? Math.round((executed / total) * 100) : 0;
      return {
        label: format(day, "dd/MM", { locale: ptBR }),
        short: format(day, "EEE", { locale: ptBR }).slice(0, 3),
        rate,
        executed,
        total,
      };
    });
  }, [days, habits, getExec]);

  if (data.length === 0) return null;

  return (
    <div className="hud-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h3 className="font-display text-sm text-primary">Consistência Diária</h3>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 30% 18% / 0.5)" vertical={false} />
            <XAxis
              dataKey={data.length <= 7 ? "short" : "label"}
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
              labelFormatter={(label) => label}
            />
            <Bar dataKey="rate" radius={[2, 2, 0, 0]} maxBarSize={24}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.rate >= 80
                      ? "hsl(160 100% 50%)"
                      : entry.rate >= 50
                      ? "hsl(160 100% 42%)"
                      : entry.rate > 0
                      ? "hsl(45 93% 47%)"
                      : "hsl(160 30% 18%)"
                  }
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsistencyChart;
