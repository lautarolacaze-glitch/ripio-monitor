"use client";

import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line,
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
        <RechartsLine data={data}>
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
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
