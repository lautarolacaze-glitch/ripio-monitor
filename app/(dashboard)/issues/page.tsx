"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Severity = "critical" | "high" | "medium" | "low";
type Category = "seo" | "performance" | "accessibility" | "code" | "links";

interface Issue {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  page: string;
  description: string;
  recommendation: string;
}

interface ScanData {
  issues: Issue[];
}

const severityConfig: Record<
  Severity,
  { label: string; className: string; order: number }
> = {
  critical: {
    label: "Critico",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    order: 0,
  },
  high: {
    label: "Alto",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    order: 1,
  },
  medium: {
    label: "Medio",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    order: 2,
  },
  low: {
    label: "Bajo",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    order: 3,
  },
};

const categoryLabels: Record<Category | "all", string> = {
  all: "Todas",
  seo: "SEO",
  performance: "Rendimiento",
  accessibility: "Accesibilidad",
  code: "Codigo",
  links: "Enlaces",
};

type SortOption = "severity" | "category" | "page";

function IssueItem({ issue }: { issue: Issue }) {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[issue.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-white/10 bg-[#0f1d32] p-4 transition-colors hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.className}`}
            >
              {sev.label}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {categoryLabels[issue.category] ?? issue.category}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-white">{issue.title}</h3>
          {issue.page && (
            <p className="text-xs text-slate-500 truncate">
              Pagina: {issue.page}
            </p>
          )}
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
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="mt-3 space-y-3 border-t border-white/5 pt-3"
        >
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">
              Descripcion
            </p>
            <p className="text-sm text-slate-300">{issue.description}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-400">
              Recomendacion
            </p>
            <p className="text-sm text-green-300/90">{issue.recommendation}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function IssuesPage() {
  const [data, setData] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("severity");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/scan");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json: ScanData = await res.json();
      setData(json.issues ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    data.forEach((issue) => {
      map[issue.severity] = (map[issue.severity] ?? 0) + 1;
    });
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    let result = data;

    if (severityFilter !== "all") {
      result = result.filter((i) => i.severity === severityFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((i) => i.category === categoryFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "severity":
          return (
            severityConfig[a.severity].order - severityConfig[b.severity].order
          );
        case "category":
          return a.category.localeCompare(b.category);
        case "page":
          return (a.page ?? "").localeCompare(b.page ?? "");
        default:
          return 0;
      }
    });

    return result;
  }, [data, severityFilter, categoryFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-lg bg-white/5" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-20"
      >
        <p className="text-sm text-red-400">{error}</p>
        <Button variant="outline" onClick={fetchData} className="border-white/10 text-slate-300">
          Reintentar
        </Button>
      </motion.div>
    );
  }

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-2 py-20"
      >
        <AlertTriangle className="h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">
          No hay datos. Ejecute un escaneo primero.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Severity count badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => {
          const config = severityConfig[sev];
          return (
            <button
              key={sev}
              onClick={() =>
                setSeverityFilter((prev) => (prev === sev ? "all" : sev))
              }
              className={`rounded-lg border p-3 text-center transition-colors ${
                severityFilter === sev
                  ? config.className + " border-current"
                  : "border-white/10 bg-[#0f1d32] hover:border-white/20"
              }`}
            >
              <p className="text-xl font-bold text-white">{counts[sev] ?? 0}</p>
              <p className="text-xs text-slate-400">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <Card className="border-white/10 bg-[#0f1d32]">
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              Filtros:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={severityFilter}
                onValueChange={(val) => setSeverityFilter(val as Severity | "all")}
              >
                <SelectTrigger size="sm" className="border-white/10 bg-white/5 text-slate-300">
                  <SelectValue placeholder="Severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las severidades</SelectItem>
                  <SelectItem value="critical">Critico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={(val) => setCategoryFilter(val as Category | "all")}
              >
                <SelectTrigger size="sm" className="border-white/10 bg-white/5 text-slate-300">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="performance">Rendimiento</SelectItem>
                  <SelectItem value="accessibility">Accesibilidad</SelectItem>
                  <SelectItem value="code">Codigo</SelectItem>
                  <SelectItem value="links">Enlaces</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(val) => setSortBy(val as SortOption)}
              >
                <SelectTrigger size="sm" className="border-white/10 bg-white/5 text-slate-300">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="severity">Ordenar por severidad</SelectItem>
                  <SelectItem value="category">Ordenar por categoria</SelectItem>
                  <SelectItem value="page">Ordenar por pagina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <span className="ml-auto text-xs text-slate-500">
              {filtered.length} de {data.length} problemas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Issues list */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((issue, i) => <IssueItem key={issue.id ?? i} issue={issue} />)
        ) : (
          <div className="flex flex-col items-center gap-2 py-16">
            <Info className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">
              No se encontraron problemas con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
