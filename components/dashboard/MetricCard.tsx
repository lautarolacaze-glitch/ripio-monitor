"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface MetricCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  change?: number;
  accentColor?: string;
}

export function MetricCard({ icon: Icon, title, value, change, accentColor }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-white/10 bg-[#0f1d32]">
        {/* Accent top border */}
        {accentColor && (
          <div className="h-[2px] w-full" style={{ backgroundColor: accentColor }} />
        )}
        <CardContent className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
            <Icon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-400">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{value}</span>
              {change !== undefined && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                    isPositive
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
