"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  color?: string;
  title?: string;
  height?: number;
  layout?: "horizontal" | "vertical";
}

export function BarChart({
  data,
  xKey,
  yKey,
  color = "#3B82F6",
  title,
  height = 300,
  layout = "horizontal",
}: BarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data} layout={isVertical ? "vertical" : "horizontal"}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#1e293b" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#1e293b" }}
                tickLine={false}
                width={100}
              />
            </>
          ) : (
            <>
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
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f1d32",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#e2e8f0",
              fontSize: 12,
            }}
            labelStyle={{ color: "#94a3b8" }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
