"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Gauge,
  Search,
  Accessibility,
  Code2,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Check,
  Circle,
  Filter,
} from "lucide-react";

interface ApiIssue {
  id: number;
  scan_id: number;
  page_url: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
}

interface ApiRecommendation {
  priority: number;
  title: string;
  description: string;
  issues: ApiIssue[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "alta" | "media" | "baja";
  effort: "facil" | "moderado" | "complejo";
  affectedPages: number;
  affectedUrls: string[];
  completed: boolean;
}

const CATEGORIES = [
  { key: "all", label: "Todas", icon: Filter },
  { key: "performance", label: "Performance", icon: Gauge },
  { key: "seo", label: "SEO", icon: Search },
  { key: "accessibility", label: "Accesibilidad", icon: Accessibility },
  { key: "code", label: "Codigo", icon: Code2 },
  { key: "security", label: "Seguridad", icon: ShieldCheck },
];

function mapCategory(issueCategory: string): string {
  const lower = issueCategory.toLowerCase();
  if (lower.includes("performance") || lower.includes("rendimiento"))
    return "performance";
  if (lower.includes("seo") || lower.includes("meta")) return "seo";
  if (
    lower.includes("accessibility") ||
    lower.includes("accesibilidad") ||
    lower.includes("a11y")
  )
    return "accessibility";
  if (
    lower.includes("code") ||
    lower.includes("codigo") ||
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("script")
  )
    return "code";
  if (
    lower.includes("security") ||
    lower.includes("seguridad") ||
    lower.includes("https") ||
    lower.includes("ssl")
  )
    return "security";
  return "code";
}

function mapPriority(severity: string): "alta" | "media" | "baja" {
  const lower = severity.toLowerCase();
  if (lower === "high" || lower === "critical" || lower === "alta")
    return "alta";
  if (lower === "medium" || lower === "warning" || lower === "media")
    return "media";
  return "baja";
}

function estimateEffort(
  issueCount: number,
  category: string
): "facil" | "moderado" | "complejo" {
  if (issueCount > 10) return "complejo";
  if (issueCount > 3) return "moderado";
  if (category === "security") return "moderado";
  return "facil";
}

function priorityColor(priority: string): string {
  switch (priority) {
    case "alta":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "media":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "baja":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
}

function effortColor(effort: string): string {
  switch (effort) {
    case "facil":
      return "text-green-400";
    case "moderado":
      return "text-amber-400";
    case "complejo":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "performance":
      return Gauge;
    case "seo":
      return Search;
    case "accessibility":
      return Accessibility;
    case "code":
      return Code2;
    case "security":
      return ShieldCheck;
    default:
      return Lightbulb;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "performance":
      return "Performance";
    case "seo":
      return "SEO";
    case "accessibility":
      return "Accesibilidad";
    case "code":
      return "Codigo";
    case "security":
      return "Seguridad";
    default:
      return category;
  }
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const COMPLETED_KEY = "ripio-recommendations-completed";

function loadCompleted(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCompleted(completed: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
}

export default function RecommendationsPage() {
  const [apiRecommendations, setApiRecommendations] = useState<ApiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCompletedMap(loadCompleted());
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/scan");
        if (res.status === 404) {
          setApiRecommendations([]);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Error al cargar datos");
        const json = await res.json();
        setApiRecommendations(json.recommendations ?? []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error al cargar datos"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const recommendations: Recommendation[] = useMemo(() => {
    return apiRecommendations.map((rec, index) => {
      const issues = rec.issues ?? [];
      const urls = new Set<string>();
      let bestCategory = "code";
      let bestSeverity = "low";

      for (const issue of issues) {
        urls.add(issue.page_url);
        bestCategory = issue.category;
        // Escalate severity
        if (
          mapPriority(issue.severity) === "alta" &&
          mapPriority(bestSeverity) !== "alta"
        ) {
          bestSeverity = issue.severity;
        } else if (
          mapPriority(issue.severity) === "media" &&
          mapPriority(bestSeverity) === "baja"
        ) {
          bestSeverity = issue.severity;
        }
      }

      const cat = mapCategory(bestCategory);
      const priority = mapPriority(bestSeverity);
      const affectedPages = urls.size;
      const effort = estimateEffort(affectedPages, cat);
      const key = `${rec.title}__${index}`;

      return {
        id: key,
        title: rec.title,
        description: rec.description,
        category: cat,
        priority,
        effort,
        affectedPages,
        affectedUrls: Array.from(urls),
        completed: !!completedMap[key],
      };
    });
  }, [apiRecommendations, completedMap]);

  const filteredRecommendations = useMemo(() => {
    if (activeCategory === "all") return recommendations;
    return recommendations.filter((r) => r.category === activeCategory);
  }, [recommendations, activeCategory]);

  // Sort: alta first, then media, then baja; incomplete first
  const sortedRecommendations = useMemo(() => {
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    return [...filteredRecommendations].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [filteredRecommendations]);

  const toggleCompleted = useCallback(
    (id: string) => {
      setCompletedMap((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        saveCompleted(next);
        return next;
      });
    },
    []
  );

  const completedCount = recommendations.filter((r) => r.completed).length;
  const totalCount = recommendations.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-lg bg-white/5" />
        <Skeleton className="h-4 w-full rounded bg-white/5" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (apiRecommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Lightbulb className="h-10 w-10 text-slate-500" />
        <p className="text-slate-400">
          No hay datos. Ejecute un escaneo primero.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">Recomendaciones</h1>
        <p className="mt-1 text-sm text-slate-400">
          Acciones sugeridas basadas en los problemas detectados en el
          escaneo.
        </p>
      </div>

      {/* Progress */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-300">
              Progreso: <strong className="text-white">{completedCount}</strong>{" "}
              de <strong className="text-white">{totalCount}</strong>{" "}
              recomendaciones completadas
            </div>
            <span className="text-sm font-bold text-blue-400">
              {progressPercent}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          const count =
            cat.key === "all"
              ? recommendations.length
              : recommendations.filter((r) => r.category === cat.key).length;

          return (
            <Button
              key={cat.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.key)}
              className={
                isActive
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {cat.label}
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 text-[10px] px-1.5"
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Recommendation Cards */}
      <div className="space-y-3">
        {sortedRecommendations.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No hay recomendaciones en esta categoria.
          </div>
        )}

        {sortedRecommendations.map((rec) => {
          const Icon = getCategoryIcon(rec.category);

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`border-white/5 bg-[#0f1d32] transition-all ${
                  rec.completed ? "opacity-60" : ""
                }`}
              >
                <CardContent className="pt-4">
                  <div className="flex gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleCompleted(rec.id)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                        rec.completed
                          ? "border-green-500 bg-green-500/20 text-green-400"
                          : "border-white/20 text-transparent hover:border-white/40"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Priority badge */}
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityColor(
                            rec.priority
                          )}`}
                        >
                          {rec.priority}
                        </span>

                        {/* Category */}
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Icon className="h-3 w-3" />
                          {getCategoryLabel(rec.category)}
                        </span>

                        {/* Effort */}
                        <span
                          className={`text-xs ${effortColor(rec.effort)}`}
                        >
                          Esfuerzo: {rec.effort}
                        </span>

                        {/* Affected pages */}
                        <span className="text-xs text-slate-500">
                          {rec.affectedPages}{" "}
                          {rec.affectedPages === 1
                            ? "pagina afectada"
                            : "paginas afectadas"}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-semibold ${
                          rec.completed
                            ? "text-slate-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {rec.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        {rec.description}
                      </p>

                      {rec.affectedUrls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {rec.affectedUrls.slice(0, 3).map((url) => (
                            <span
                              key={url}
                              className="inline-block max-w-[200px] truncate rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-500"
                            >
                              {url}
                            </span>
                          ))}
                          {rec.affectedUrls.length > 3 && (
                            <span className="text-[10px] text-slate-600">
                              +{rec.affectedUrls.length - 3} mas
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
