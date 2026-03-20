"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Severity = "critical" | "warning" | "info";

interface IssueCardProps {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

const severityConfig: Record<
  Severity,
  { label: string; className: string }
> = {
  critical: {
    label: "Critico",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  warning: {
    label: "Advertencia",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  info: {
    label: "Info",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

export function IssueCard({
  severity,
  category,
  title,
  description,
  recommendation,
}: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[severity];

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1d32] p-4 transition-colors hover:border-white/15">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.className}`}
            >
              {sev.label}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {category}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label={expanded ? "Colapsar" : "Expandir"}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">
              Descripcion
            </p>
            <p className="text-sm text-slate-300">{description}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">
              Recomendacion
            </p>
            <p className="text-sm text-green-300/90">{recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
