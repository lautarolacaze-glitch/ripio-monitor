"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  FileSearch,
  Zap,
  RefreshCw,
  Globe,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Shield,
  Code2,
  Eye,
  Search,
  Radar,
  Settings,
  ArrowRight,
  ChevronRight,
  ScanLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { LineChart } from "@/components/charts/LineChart";

interface ScanData {
  site_status: "up" | "down";
  response_time_ms: number;
  total_pages: number;
  overall_score: number;
  last_scan: string;
  history: { date: string; score: number }[];
  issues: { severity: string; count: number }[];
}

function mapApiToScanData(json: Record<string, unknown>): ScanData | null {
  const scan = json.scan as Record<string, unknown> | undefined;
  const pages = json.pages as Array<Record<string, unknown>> | undefined;
  const issues = json.issues as Array<Record<string, unknown>> | undefined;

  if (!scan) return null;

  // Aggregate issues by severity
  const severityCounts: Record<string, number> = {};
  (issues ?? []).forEach((issue) => {
    const sev = (issue.severity as string) ?? "unknown";
    severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;
  });
  const issuesChart = Object.entries(severityCounts).map(([severity, count]) => ({
    severity,
    count,
  }));

  const firstPage = pages?.[0];

  return {
    site_status: firstPage && (firstPage.status_code as number) >= 200 && (firstPage.status_code as number) < 400 ? "up" : "down",
    response_time_ms: (firstPage?.response_time_ms as number) ?? 0,
    total_pages: (scan.pages_scanned as number) ?? (pages?.length ?? 0),
    overall_score: (scan.score as number) ?? 0,
    last_scan: (scan.timestamp as string) ?? "",
    history: [],
    issues: issuesChart,
  };
}

const COOLDOWN_SECONDS = 300;

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                   */
/* ------------------------------------------------------------------ */
const severityMeta: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Critico", color: "#ef4444", bg: "bg-red-500" },
  high: { label: "Alto", color: "#f97316", bg: "bg-orange-500" },
  medium: { label: "Medio", color: "#eab308", bg: "bg-yellow-500" },
  low: { label: "Bajo", color: "#3b82f6", bg: "bg-blue-500" },
};

function getSeverityInfo(key: string) {
  return severityMeta[key.toLowerCase()] ?? { label: key, color: "#64748b", bg: "bg-slate-500" };
}

/* ------------------------------------------------------------------ */
/*  Category score derivation                                          */
/* ------------------------------------------------------------------ */
function deriveCategoryScores(issues: { severity: string; count: number }[]) {
  const totalIssues = issues.reduce((sum, i) => sum + i.count, 0);
  const base = Math.max(0, 100 - totalIssues * 5);
  // Distribute with slight variance per category
  return [
    { key: "seo", label: "SEO", icon: Search, score: Math.min(100, Math.max(0, base + 8)) },
    { key: "performance", label: "Performance", icon: Zap, score: Math.min(100, Math.max(0, base - 3)) },
    { key: "accessibility", label: "Accesibilidad", icon: Eye, score: Math.min(100, Math.max(0, base + 2)) },
    { key: "code", label: "Codigo", icon: Code2, score: Math.min(100, Math.max(0, base - 6)) },
  ];
}

/* ------------------------------------------------------------------ */
/*  Quick action links                                                 */
/* ------------------------------------------------------------------ */
const quickActions = [
  { label: "Performance", href: "/performance", icon: Zap },
  { label: "SEO", href: "/seo", icon: Search },
  { label: "Problemas", href: "/issues", icon: AlertTriangle },
  { label: "Configuracion", href: "/settings", icon: Settings },
];

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */
export default function OverviewPage() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/scan");
      if (res.status === 404) {
        setData(null);
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData(mapApiToScanData(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleScan() {
    try {
      setScanning(true);
      const res = await fetch("/api/scan", { method: "POST" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      await fetchData();
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al escanear");
    } finally {
      setScanning(false);
    }
  }

  function formatCooldown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  /* ---------------------------------------------------------------- */
  /*  Loading state                                                    */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-white/5 bg-[#0f1d32]/80 p-6">
          <Skeleton className="mb-3 h-8 w-64 rounded-lg bg-white/5" />
          <Skeleton className="mb-4 h-4 w-48 rounded bg-white/5" />
          <Skeleton className="h-10 w-40 rounded-lg bg-white/5" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-[#0f1d32]/80 p-5">
              <Skeleton className="mb-3 h-4 w-24 rounded bg-white/5" />
              <Skeleton className="mb-2 h-8 w-20 rounded bg-white/5" />
              <Skeleton className="h-2 w-full rounded bg-white/5" />
            </div>
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-[#0f1d32]/80 p-6">
            <Skeleton className="mb-4 h-5 w-40 rounded bg-white/5" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-3 flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-full bg-white/5" />
                <Skeleton className="h-3 w-16 rounded bg-white/5" />
                <Skeleton className="h-3 flex-1 rounded bg-white/5" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 bg-[#0f1d32]/80 p-6">
            <Skeleton className="mb-4 h-5 w-40 rounded bg-white/5" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 py-4">
                  <Skeleton className="h-16 w-16 rounded-full bg-white/5" />
                  <Skeleton className="h-3 w-20 rounded bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* History skeleton */}
        <div className="rounded-xl border border-white/5 bg-[#0f1d32]/80 p-6">
          <Skeleton className="mb-4 h-5 w-48 rounded bg-white/5" />
          <Skeleton className="h-64 w-full rounded-lg bg-white/5" />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Error state                                                      */
  /* ---------------------------------------------------------------- */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-500/20 bg-[#0f1d32]/90 p-8 text-center backdrop-blur-xl">
          {/* Red glow */}
          <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Error al cargar</h3>
            <p className="mb-6 text-sm text-red-300/80">{error}</p>
            <Button
              onClick={fetchData}
              className="border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Empty / no-data state                                            */
  /* ---------------------------------------------------------------- */
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] items-center justify-center"
      >
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/5 bg-[#0f1d32]/90 p-10 text-center backdrop-blur-xl">
          {/* Ambient glow */}
          <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            {/* Pulse ring behind icon */}
            <div className="relative mx-auto mb-6 h-24 w-24">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/10" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-blue-500/5" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
                <Radar className="h-10 w-10 text-blue-400" />
              </div>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-white">
              Bienvenido a Ripio Monitor
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-slate-400">
              Ejecuta tu primer escaneo para analizar el rendimiento, SEO y
              accesibilidad de tu sitio web.
            </p>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="group relative inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              }}
            >
              {scanning ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Escaneando...
                </>
              ) : (
                <>
                  <ScanLine className="h-5 w-5 transition-transform group-hover:scale-110" />
                  Iniciar primer escaneo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main dashboard with data                                         */
  /* ---------------------------------------------------------------- */
  const totalIssues = data.issues.reduce((sum, i) => sum + i.count, 0);
  const maxIssueCount = Math.max(...data.issues.map((i) => i.count), 1);
  const categoryScores = deriveCategoryScores(data.issues);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      {/* ============================================================ */}
      {/*  1. Hero header                                               */}
      {/* ============================================================ */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f1d32]/80 p-6 backdrop-blur-xl sm:p-8"
      >
        {/* Decorative gradient blob */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Panel de Monitoreo
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Globe className="h-3.5 w-3.5" />
                ripio.com
              </span>
              <StatusBadge status={scanning ? "scanning" : data.site_status} />
              {data.last_scan && (
                <span className="text-xs text-slate-500">
                  Ultimo escaneo:{" "}
                  {new Date(data.last_scan).toLocaleString("es-AR")}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning || cooldown > 0}
            className="group relative inline-flex w-fit items-center gap-2 rounded-xl px-6 py-2.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${scanning ? "animate-spin" : "transition-transform group-hover:rotate-90"}`}
            />
            {scanning
              ? "Escaneando..."
              : cooldown > 0
                ? `Espere ${formatCooldown(cooldown)}`
                : "Escanear ahora"}
          </button>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/*  2. Quick stats row                                           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* --- Site Status --- */}
        <motion.div variants={fadeUp} custom={1}>
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f1d32]/80 p-5 backdrop-blur-xl">
            {/* Green gradient top border */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-green-500/80 to-emerald-400/40" />
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Estado del sitio
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                {data.site_status === "up" && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                )}
                <div
                  className={`relative h-10 w-10 rounded-full ${
                    data.site_status === "up"
                      ? "bg-green-500/20 shadow-lg shadow-green-500/20"
                      : "bg-red-500/20 shadow-lg shadow-red-500/20"
                  } flex items-center justify-center`}
                >
                  <Activity
                    className={`h-5 w-5 ${
                      data.site_status === "up" ? "text-green-400" : "text-red-400"
                    }`}
                  />
                </div>
              </div>
              <span
                className={`text-2xl font-bold ${
                  data.site_status === "up" ? "text-green-400" : "text-red-400"
                }`}
              >
                {data.site_status === "up" ? "UP" : "DOWN"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* --- Response Time --- */}
        <motion.div variants={fadeUp} custom={2}>
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f1d32]/80 p-5 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500/80 to-cyan-400/40" />
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Tiempo de respuesta
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white">
                  {data.response_time_ms}
                </span>
                <span className="ml-1 text-sm text-slate-500">ms</span>
              </div>
            </div>
            {/* Mini sparkline bar */}
            <div className="mt-3 flex items-end gap-[2px]">
              {[40, 65, 45, 80, 55, 70, 60, Math.min(100, (data.response_time_ms / 10))].map(
                (h, i) => (
                  <div
                    key={i}
                    className="w-full rounded-sm bg-blue-500/20"
                    style={{ height: `${Math.max(4, h / 5)}px` }}
                  />
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* --- Pages Scanned --- */}
        <motion.div variants={fadeUp} custom={3}>
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f1d32]/80 p-5 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-yellow-500/80 to-amber-400/40" />
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Paginas escaneadas
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <FileSearch className="h-5 w-5 text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-white">
                {data.total_pages}
              </span>
            </div>
          </div>
        </motion.div>

        {/* --- Health Score (embedded ring) --- */}
        <motion.div variants={fadeUp} custom={4}>
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0f1d32]/80 p-5 backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500/80 to-violet-400/40" />
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Health Score
            </p>
            <div className="flex items-center gap-4">
              <ScoreCard score={data.overall_score} label="" size={64} />
              <div>
                <span className="text-2xl font-bold text-white">
                  {data.overall_score}
                </span>
                <span className="text-sm text-slate-500">/100</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/*  3. Main content grid                                         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* --- LEFT: Issues breakdown --- */}
        <motion.div variants={fadeUp} custom={5}>
          <Card className="overflow-hidden border-white/5 bg-[#0f1d32]/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                Resumen de Problemas
                {totalIssues > 0 && (
                  <span className="ml-auto rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-normal text-slate-400">
                    {totalIssues} total
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.issues.length > 0 ? (
                <div className="space-y-4">
                  {["critical", "high", "medium", "low"].map((severity) => {
                    const issue = data.issues.find(
                      (i) => i.severity.toLowerCase() === severity
                    );
                    const count = issue?.count ?? 0;
                    const info = getSeverityInfo(severity);
                    const pct = maxIssueCount > 0 ? (count / maxIssueCount) * 100 : 0;

                    return (
                      <div key={severity} className="group">
                        <div className="mb-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: info.color }}
                            />
                            <span className="text-sm font-medium text-slate-300">
                              {info.label}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {count}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: info.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Show any extra severities not in the predefined list */}
                  {data.issues
                    .filter(
                      (i) =>
                        !["critical", "high", "medium", "low"].includes(
                          i.severity.toLowerCase()
                        )
                    )
                    .map((issue) => {
                      const info = getSeverityInfo(issue.severity);
                      const pct =
                        maxIssueCount > 0
                          ? (issue.count / maxIssueCount) * 100
                          : 0;

                      return (
                        <div key={issue.severity}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: info.color }}
                              />
                              <span className="text-sm font-medium text-slate-300">
                                {info.label}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {issue.count}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: info.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                duration: 0.8,
                                delay: 0.3,
                                ease: "easeOut",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Shield className="mb-2 h-8 w-8 text-green-500/40" />
                  <p className="text-sm text-slate-500">
                    No se encontraron problemas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* --- RIGHT: Category scores 2x2 --- */}
        <motion.div variants={fadeUp} custom={6}>
          <Card className="overflow-hidden border-white/5 bg-[#0f1d32]/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <TrendingUp className="h-4 w-4 text-slate-400" />
                Score por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {categoryScores.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] py-5 transition-colors hover:bg-white/[0.04]"
                  >
                    <ScoreCard score={cat.score} label={cat.label} size={80} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/*  4. Scan history timeline                                     */}
      {/* ============================================================ */}
      <motion.div variants={fadeUp} custom={7}>
        <Card className="overflow-hidden border-white/5 bg-[#0f1d32]/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Activity className="h-4 w-4 text-slate-400" />
              Historial de Escaneos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.history && data.history.length > 0 ? (
              <LineChart
                data={data.history}
                xKey="date"
                yKey="score"
                color="#3B82F6"
                height={280}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-white/[0.03]">
                  <BarChart3 className="h-7 w-7 text-slate-600" />
                </div>
                <p className="mb-1 text-sm font-medium text-slate-400">
                  Sin historial disponible
                </p>
                <p className="text-xs text-slate-600">
                  Los datos apareceran despues de multiples escaneos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ============================================================ */}
      {/*  5. Quick actions footer                                      */}
      {/* ============================================================ */}
      <motion.div variants={fadeUp} custom={8}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-[#0f1d32]/80 px-4 py-3 backdrop-blur-xl transition-all hover:border-white/10 hover:bg-[#111a2e]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors group-hover:bg-blue-500/10">
                <action.icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                {action.label}
              </span>
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
