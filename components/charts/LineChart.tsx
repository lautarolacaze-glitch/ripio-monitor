"use client";

import {
  ResponsiveContainer,
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  title?: string;
  height?: number;
}

export function LineChart({
  data,
  xKey,
  yKey,
  color = "#3B82F6",
  title,
  height = 300,
}: LineChartProps) {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea data={data}>
          <defs>
            <linearGradient id={`gradient-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "#1e293b" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "#1e293b" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f1d32",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#e2e8f0",
              fontSize: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#94a3b8", marginBottom: 4, fontWeight: 500 }}
            itemStyle={{ color: "#e2e8f0", fontSize: 12 }}
          />
          <Area
            type="monotoneX"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${yKey})`}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{
              r: 6,
              strokeWidth: 3,
              stroke: `${color}40`,
              fill: color,
            }}
          />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}
