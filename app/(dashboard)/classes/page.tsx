"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Layers, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable, type ColumnDef } from "@/components/dashboard/DataTable";
import { MetricCard } from "@/components/dashboard/MetricCard";

interface CssClass {
  name: string;
  element: string;
  frequency: number;
  pages: string[];
}

interface ScanData {
  css_classes: CssClass[];
}

export default function ClassesPage() {
  const [data, setData] = useState<CssClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/scan");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json: ScanData = await res.json();
      setData(json.css_classes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let result = data;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.element.toLowerCase().includes(q)
      );
    }

    if (activeTab === "duplicated") {
      result = result.filter((c) => c.frequency > 1);
    }

    return result;
  }, [data, search, activeTab]);

  const groupedByPage = useMemo(() => {
    const map = new Map<string, CssClass[]>();
    filtered.forEach((cls) => {
      cls.pages.forEach((page) => {
        const list = map.get(page) ?? [];
        list.push(cls);
        map.set(page, list);
      });
    });
    return map;
  }, [filtered]);

  const totalClasses = data.length;
  const uniqueClasses = new Set(data.map((c) => c.name)).size;
  const duplicatedClasses = data.filter((c) => c.frequency > 1).length;

  const columns: ColumnDef<CssClass & Record<string, unknown>>[] = [
    {
      key: "name",
      header: "Clase",
      sortable: true,
      render: (row) => (
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-blue-300">
          {row.name as string}
        </code>
      ),
    },
    {
      key: "element",
      header: "Elemento",
      sortable: true,
      render: (row) => (
        <span className="text-slate-300">{row.element as string}</span>
      ),
    },
    {
      key: "frequency",
      header: "Frecuencia",
      sortable: true,
      render: (row) => {
        const freq = row.frequency as number;
        const variant =
          freq > 10 ? "destructive" : freq > 5 ? "secondary" : "outline";
        return <Badge variant={variant}>{freq}</Badge>;
      },
    },
    {
      key: "pages",
      header: "Paginas",
      render: (row) => {
        const pages = row.pages as string[];
        return (
          <span className="text-slate-400">{pages.length} pagina(s)</span>
        );
      },
    },
  ];

  const tableData = filtered.map((c) => ({
    ...c,
    pages_count: c.pages.length,
  })) as (CssClass & Record<string, unknown>)[];

  function exportCSV() {
    const headers = ["Clase", "Elemento", "Frecuencia", "Paginas"];
    const rows = filtered.map((c) => [
      c.name,
      c.element,
      String(c.frequency),
      c.pages.join("; "),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        r
          .map((v) =>
            v.includes(",") || v.includes('"')
              ? `"${v.replace(/"/g, '""')}"`
              : v
          )
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clases-css.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl bg-white/5" />
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
        <Code2 className="h-10 w-10 text-slate-600" />
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
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={Code2} title="Total clases" value={totalClasses} />
        <MetricCard icon={Layers} title="Clases unicas" value={uniqueClasses} />
        <MetricCard icon={Copy} title="Clases duplicadas" value={duplicatedClasses} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar clases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-white/10 bg-white/5 text-white placeholder:text-slate-500"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          className="w-fit border-white/10 text-slate-300"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="duplicated">Duplicadas</TabsTrigger>
          <TabsTrigger value="by-page">Por pagina</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DataTable
            data={tableData}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Filtrar por nombre de clase..."
            exportFilename="clases-css"
          />
        </TabsContent>

        <TabsContent value="duplicated">
          <DataTable
            data={tableData}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Filtrar clases duplicadas..."
            exportFilename="clases-duplicadas"
          />
        </TabsContent>

        <TabsContent value="by-page">
          <div className="space-y-4">
            {Array.from(groupedByPage.entries()).map(([page, classes]) => (
              <Card key={page} className="border-white/10 bg-[#0f1d32]">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white">{page}</h3>
                    <Badge variant="secondary">{classes.length} clases</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {classes.map((cls, i) => (
                      <code
                        key={`${cls.name}-${i}`}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-blue-300"
                      >
                        {cls.name}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {groupedByPage.size === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                No se encontraron clases para esta vista.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
