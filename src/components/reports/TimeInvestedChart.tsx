import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type ExecRow = {
  habit_id: string;
  status: string;
  duration_seconds?: number | null;
};

type Props = {
  habits: { id: string; name: string }[];
  executions: ExecRow[];
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h${rem}m` : `${hrs}h`;
}

const COLORS = [
  "hsl(160 100% 50%)",
  "hsl(160 100% 42%)",
  "hsl(180 80% 45%)",
  "hsl(140 70% 45%)",
  "hsl(200 70% 50%)",
  "hsl(120 60% 45%)",
];

const TimeInvestedChart = ({ habits, executions }: Props) => {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    executions.forEach((e) => {
      if (e.status === "executed" && e.duration_seconds) {
        map[e.habit_id] = (map[e.habit_id] ?? 0) + e.duration_seconds;
      }
    });
    return habits
      .map((h) => ({
        name: h.name.length > 12 ? h.name.slice(0, 12) + "…" : h.name,
        fullName: h.name,
        minutes: Math.round((map[h.id] ?? 0) / 60),
        seconds: map[h.id] ?? 0,
      }))
      .filter((d) => d.seconds > 0)
      .sort((a, b) => b.seconds - a.seconds);
  }, [habits, executions]);

  if (data.length === 0) {
    return (
      <div className="hud-border bg-card/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h3 className="font-display text-sm text-primary">Tempo Investido</h3>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">Nenhum tempo registrado neste período.</p>
      </div>
    );
  }

  return (
    <div className="hud-border bg-card/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h3 className="font-display text-sm text-primary">Tempo Investido</h3>
      </div>
      <div style={{ height: Math.max(120, data.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 9, fill: "hsl(160 15% 45%)", fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}min`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 9, fill: "hsl(160 15% 45%)", fontFamily: "JetBrains Mono" }}
              axisLine={false}
              tickLine={false}
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
              formatter={(value: number, _: string, props: any) => [
                formatDuration(props.payload.seconds),
                props.payload.fullName,
              ]}
            />
            <Bar dataKey="minutes" radius={[0, 2, 2, 0]} maxBarSize={20}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeInvestedChart;
