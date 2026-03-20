"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface GaugeChartProps {
  value: number;
  size?: number;
  title?: string;
}

function getColor(val: number): string {
  if (val < 40) return "#ef4444";
  if (val <= 70) return "#eab308";
  return "#22c55e";
}

export function GaugeChart({ value, size = 200, title }: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = getColor(clamped);

  const data = [
    { name: "score", value: clamped },
    { name: "remaining", value: 100 - clamped },
  ];

  return (
    <div className="flex flex-col items-center gap-1">
      {title && (
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      )}
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.3}
              outerRadius={size * 0.42}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#1e293b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: 4 }}
        >
          <span
            className="text-2xl font-bold"
            style={{ color }}
          >
            {clamped}
          </span>
          <span className="text-xs text-slate-500"> / 100</span>
        </div>
      </div>
    </div>
  );
}
