"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Gauge,
  Clock,
  MousePointerClick,
  Move,
  Paintbrush,
  Zap,
  TrendingUp,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { LineChart } from "@/components/charts/LineChart";

interface WebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  speed_index: number;
}

interface Recommendation {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface PerformanceData {
  mobile: {
    score: number;
    vitals: WebVitals;
    history: { date: string; score: number }[];
    recommendations: Recommendation[];
  };
  desktop: {
    score: number;
    vitals: WebVitals;
    history: { date: string; score: number }[];
    recommendations: Recommendation[];
  };
}

function getVitalColor(metric: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fid: [100, 300],
    cls: [0.1, 0.25],
    fcp: [1800, 3000],
    ttfb: [800, 1800],
    speed_index: [3400, 5800],
  };
  const [good, poor] = thresholds[metric] ?? [0, 0];
  if (value <= good) return "text-green-400";
  if (value <= poor) return "text-yellow-400";
  return "text-red-400";
}

function formatVitalValue(metric: string, value: number): string {
  if (metric === "cls") return value.toFixed(3);
  if (value >= 1000) return `${(value / 1000).toFixed(2)} s`;
  return `${Math.round(value)} ms`;
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case "high":
      return "border-red-500/30 bg-red-500/10 text-red-400";
    case "medium":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }
}

const vitalsConfig = [
  { key: "lcp", label: "LCP", fullLabel: "Largest Contentful Paint", icon: Paintbrush },
  { key: "fid", label: "FID", fullLabel: "First Input Delay", icon: MousePointerClick },
  { key: "cls", label: "CLS", fullLabel: "Cumulative Layout Shift", icon: Move },
  { key: "fcp", label: "FCP", fullLabel: "First Contentful Paint", icon: Clock },
  { key: "ttfb", label: "TTFB", fullLabel: "Time to First Byte", icon: Zap },
  { key: "speed_index", label: "Speed Index", fullLabel: "Speed Index", icon: TrendingUp },
] as const;

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("mobile");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/performance");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json: PerformanceData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAnalyze() {
    try {
      setAnalyzing(true);
      const res = await fetch("/api/performance", { method: "POST" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg bg-white/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl bg-white/5" />
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

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-2 py-20"
      >
        <Gauge className="h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-400">
          No hay datos. Ejecute un escaneo primero.
        </p>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? "Analizando..." : "Analizar ahora"}
        </Button>
      </motion.div>
    );
  }

  const current = activeTab === "mobile" ? data.mobile : data.desktop;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">Rendimiento</h2>
        <Button onClick={handleAnalyze} disabled={analyzing} className="w-fit">
          <RefreshCw className={`mr-1.5 h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
          {analyzing ? "Analizando..." : "Analizar ahora"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="desktop">Desktop</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="space-y-6">
            {/* Gauge */}
            <div className="flex justify-center">
              <Card className="border-white/10 bg-[#0f1d32]">
                <CardContent className="flex items-center justify-center py-6">
                  <GaugeChart
                    value={current.score}
                    size={220}
                    title={`Score ${activeTab === "mobile" ? "Mobile" : "Desktop"}`}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Web Vitals */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vitalsConfig.map(({ key, label, fullLabel, icon }) => {
                const value = current.vitals[key as keyof WebVitals];
                const colorClass = getVitalColor(key, value);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="border-white/10 bg-[#0f1d32]">
                      <CardContent className="space-y-1">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = icon;
                            return <Icon className="h-4 w-4 text-slate-400" />;
                          })()}
                          <p className="text-xs text-slate-400">{fullLabel}</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-xl font-bold ${colorClass}`}>
                            {formatVitalValue(key, value)}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {label}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* History chart */}
            <Card className="border-white/10 bg-[#0f1d32]">
              <CardHeader>
                <CardTitle className="text-white">
                  Historial de rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {current.history && current.history.length > 0 ? (
                  <LineChart
                    data={current.history}
                    xKey="date"
                    yKey="score"
                    color={activeTab === "mobile" ? "#8B5CF6" : "#3B82F6"}
                    height={280}
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-slate-500">
                    No hay historial disponible
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-white/10 bg-[#0f1d32]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {current.recommendations && current.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {current.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${getImpactColor(rec.impact)}`}
                          >
                            {rec.impact === "high"
                              ? "Alto"
                              : rec.impact === "medium"
                                ? "Medio"
                                : "Bajo"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-white">
                              {rec.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-400">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-slate-500">
                    No hay recomendaciones disponibles
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
