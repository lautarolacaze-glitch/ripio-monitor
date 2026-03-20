"use client";

import { motion } from "framer-motion";

interface ScoreCardProps {
  score: number;
  label: string;
  size?: number;
}

function getColor(score: number): string {
  if (score < 40) return "#ef4444";
  if (score <= 70) return "#eab308";
  return "#22c55e";
}

export function ScoreCard({ score, label, size = 120 }: ScoreCardProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = getColor(clamped);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-white/10"
            strokeWidth={8}
          />
          {/* Score arc */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {clamped}
          </motion.span>
        </div>
      </div>
      <span className="text-sm font-medium text-slate-400">{label}</span>
    </div>
  );
}
