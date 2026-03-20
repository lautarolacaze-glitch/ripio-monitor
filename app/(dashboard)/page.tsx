"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  FileSearch,
  Star,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
        </div>
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
        className="flex flex-col items-center justify-center gap-4 py-20"
      >
        <p className="text-sm text-slate-400">
          No hay datos. Ejecute un escaneo primero.
        </p>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? "Escaneando..." : "Escanear ahora"}
        </Button>
      </motion.div>
    );
  }

  const issuesChartData = (data.issues ?? []).map((item) => ({
    severity: item.severity,
    count: item.count,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={scanning ? "scanning" : data.site_status} />
          {data.last_scan && (
            <span className="text-xs text-slate-500">
              Ultimo escaneo: {new Date(data.last_scan).toLocaleString("es-AR")}
            </span>
          )}
        </div>
        <Button
          onClick={handleScan}
          disabled={scanning || cooldown > 0}
          className="w-fit"
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
          {scanning
            ? "Escaneando..."
            : cooldown > 0
              ? `Espere ${formatCooldown(cooldown)}`
              : "Escanear ahora"}
        </Button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Activity}
          title="Estado del sitio"
          value={data.site_status === "up" ? "UP" : "DOWN"}
        />
        <MetricCard
          icon={Clock}
          title="Tiempo de respuesta"
          value={`${data.response_time_ms} ms`}
        />
        <MetricCard
          icon={FileSearch}
          title="Paginas escaneadas"
          value={data.total_pages}
        />
        <MetricCard
          icon={Star}
          title="Score general"
          value={`${data.overall_score}/100`}
        />
      </div>

      {/* Score Card */}
      <div className="flex justify-center">
        <Card className="border-white/10 bg-[#0f1d32]">
          <CardContent className="flex items-center justify-center py-4">
            <ScoreCard score={data.overall_score} label="Score General" />
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-[#0f1d32]">
          <CardHeader>
            <CardTitle className="text-white">
              Historial de escaneos
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
              <p className="py-10 text-center text-sm text-slate-500">
                No hay historial disponible
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0f1d32]">
          <CardHeader>
            <CardTitle className="text-white">
              Problemas por severidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {issuesChartData.length > 0 ? (
              <BarChart
                data={issuesChartData}
                xKey="severity"
                yKey="count"
                color="#F59E0B"
                height={280}
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                No se encontraron problemas
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
