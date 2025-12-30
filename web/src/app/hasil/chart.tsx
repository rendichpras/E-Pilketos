"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type VotesChartDatum = {
  id: string;
  number: number;
  name: string;
  axis: string;
  votes: number;
  percent: number;
};

function fmtNumber(n: number) {
  return n.toLocaleString("id-ID");
}

function fmtPercent(n: number) {
  return `${n.toFixed(1)}%`;
}

const CustomTooltip = ({
  active,
  payload
}: {
  active?: boolean;
  payload?: { payload: VotesChartDatum }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const p = payload[0]?.payload as VotesChartDatum | undefined;
    if (!p) return null;

    return (
      <div className="bg-popover text-popover-foreground w-[260px] rounded-lg border p-3 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-muted-foreground text-xs">Paslon {p.number}</div>
            <div className="truncate text-sm font-semibold">{p.name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{fmtNumber(p.votes)}</div>
            <div className="text-muted-foreground text-xs">{fmtPercent(p.percent)}</div>
          </div>
        </div>
        <div className="text-muted-foreground mt-2 text-xs">Persentase dari total suara masuk.</div>
      </div>
    );
  }
  return null;
};

const CustomizedAxisTick = (props: { x?: number; y?: number; payload?: { value: string } }) => {
  const { x, y, payload } = props;
  if (x === undefined || y === undefined || !payload) return null;
  return (
    <text
      x={x}
      y={y}
      dy={16}
      textAnchor="middle"
      style={{
        fill: "var(--foreground)",
        fontWeight: 800,
        fontSize: 14
      }}
    >
      {payload.value}
    </text>
  );
};

function TopLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
  const { x, y, width, value } = props;
  if (x === undefined || y === undefined || width === undefined) return null;
  const v = Number(value ?? 0);
  if (!v) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      style={{
        fill: "var(--foreground)",
        fontWeight: 700,
        fontSize: 12
      }}
    >
      {fmtNumber(v)}
    </text>
  );
}

export function VotesBarChart({
  data,
  maxVotes,
  emptyLabel
}: {
  data: VotesChartDatum[];
  maxVotes: number;
  emptyLabel?: string;
}) {
  const hasAnyVotes = data.some((d) => d.votes > 0);

  const minWidth = Math.max(520, data.length * 96);

  return (
    <div className="relative">
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth }} className="h-[260px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 16, left: 8, bottom: 18 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="axis"
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                tick={<CustomizedAxisTick />}
                interval={0}
              />
              <YAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                domain={[0, Math.max(1, maxVotes)]}
              />
              <Tooltip
                cursor={{ fill: "color-mix(in oklch, var(--muted) 55%, transparent)" }}
                content={<CustomTooltip />}
              />
              <Bar
                dataKey="votes"
                fill="var(--primary)"
                radius={[10, 10, 0, 0]}
                isAnimationActive={false}
              >
                <LabelList dataKey="votes" content={<TopLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {!hasAnyVotes ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="bg-background/80 text-muted-foreground rounded-lg border px-3 py-2 text-xs backdrop-blur">
            {emptyLabel ?? "Belum ada suara masuk."}
          </div>
        </div>
      ) : null}
    </div>
  );
}
