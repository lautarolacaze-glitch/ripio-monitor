"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  FileWarning,
  Type,
  FileText,
  Heading1,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Globe,
  Share2,
  Bot,
  Map,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { MetricCard } from "@/components/dashboard/MetricCard";

interface HeadingInfo {
  level: number;
  text: string;
}

interface OgTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

interface PageSeo {
  url: string;
  title: string | null;
  description: string | null;
  h1: string | null;
  canonical: string | null;
  headings: HeadingInfo[];
  og_tags: OgTags;
  has_title: boolean;
  has_description: boolean;
  has_h1: boolean;
  has_canonical: boolean;
  og_complete: boolean;
}

interface ScanData {
  pages: PageSeo[];
  robots_txt: boolean;
  sitemap_xml: boolean;
}

function StatusIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-4 w-4 text-green-400" />
  ) : (
    <XCircle className="h-4 w-4 text-red-400" />
  );
}

export default function SeoPage() {
  const [data, setData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/scan");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setData({
        pages: json.pages ?? [],
        robots_txt: json.robots_txt ?? false,
        sitemap_xml: json.sitemap_xml ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleRow(index: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const stats = useMemo(() => {
    if (!data) return { total: 0, missingTitle: 0, missingDesc: 0, missingH1: 0, withIssues: 0 };
    const pages = data.pages;
    const missingTitle = pages.filter((p) => !p.has_title).length;
    const missingDesc = pages.filter((p) => !p.has_description).length;
    const missingH1 = pages.filter((p) => !p.has_h1).length;
    const withIssues = pages.filter(
      (p) => !p.has_title || !p.has_description || !p.has_h1
    ).length;
    return { total: pages.length, missingTitle, missingDesc, missingH1, withIssues };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (!data || data.pages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-2 py-20"
      >
        <Search className="h-10 w-10 text-slate-600" />
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={FileWarning}
          title="Paginas con problemas"
          value={stats.withIssues}
        />
        <MetricCard
          icon={Type}
          title="Sin titulo"
          value={stats.missingTitle}
        />
        <MetricCard
          icon={FileText}
          title="Sin descripcion"
          value={stats.missingDesc}
        />
        <MetricCard
          icon={Heading1}
          title="Sin H1"
          value={stats.missingH1}
        />
      </div>

      {/* robots.txt and sitemap.xml status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-[#0f1d32]">
          <CardContent className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">robots.txt</p>
              <p className="text-xs text-slate-400">
                {data.robots_txt ? "Detectado correctamente" : "No encontrado"}
              </p>
            </div>
            <StatusIcon ok={data.robots_txt} />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-[#0f1d32]">
          <CardContent className="flex items-center gap-3">
            <Map className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">sitemap.xml</p>
              <p className="text-xs text-slate-400">
                {data.sitemap_xml ? "Detectado correctamente" : "No encontrado"}
              </p>
            </div>
            <StatusIcon ok={data.sitemap_xml} />
          </CardContent>
        </Card>
      </div>

      {/* Pages table */}
      <Card className="border-white/10 bg-[#0f1d32]">
        <CardHeader>
          <CardTitle className="text-white">Estado de meta tags por pagina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">Pagina</TableHead>
                  <TableHead className="text-center text-slate-400">Titulo</TableHead>
                  <TableHead className="text-center text-slate-400">Descripcion</TableHead>
                  <TableHead className="text-center text-slate-400">H1</TableHead>
                  <TableHead className="text-center text-slate-400">Canonical</TableHead>
                  <TableHead className="text-center text-slate-400">OG Tags</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pages.map((page, index) => (
                  <>
                    <TableRow
                      key={`row-${index}`}
                      className="border-white/10 hover:bg-white/5 cursor-pointer"
                      onClick={() => toggleRow(index)}
                    >
                      <TableCell className="max-w-[200px] truncate text-slate-300">
                        {page.url}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon ok={page.has_title} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon ok={page.has_description} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon ok={page.has_h1} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon ok={page.has_canonical} />
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon ok={page.og_complete} />
                      </TableCell>
                      <TableCell>
                        <button className="text-slate-400 hover:text-white">
                          {expandedRows.has(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>

                    {expandedRows.has(index) && (
                      <TableRow
                        key={`detail-${index}`}
                        className="border-white/10 hover:bg-transparent"
                      >
                        <TableCell colSpan={7} className="p-0">
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/5 bg-white/[0.02] px-4 py-4"
                          >
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                              {/* Meta details */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Detalles de meta tags
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-slate-500">Titulo: </span>
                                    <span className="text-slate-300">
                                      {page.title || "No definido"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Descripcion: </span>
                                    <span className="text-slate-300">
                                      {page.description || "No definida"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">H1: </span>
                                    <span className="text-slate-300">
                                      {page.h1 || "No definido"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3.5 w-3.5 text-slate-500" />
                                    <span className="text-slate-500">Canonical: </span>
                                    <span className="text-slate-300">
                                      {page.canonical || "No definido"}
                                    </span>
                                  </div>
                                </div>

                                {/* OG Tags */}
                                <div className="space-y-2">
                                  <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    <Share2 className="h-3.5 w-3.5" />
                                    Open Graph
                                  </h4>
                                  <div className="space-y-1.5 text-sm">
                                    <div>
                                      <span className="text-slate-500">og:title: </span>
                                      <span className="text-slate-300">
                                        {page.og_tags?.title || "No definido"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">og:description: </span>
                                      <span className="text-slate-300">
                                        {page.og_tags?.description || "No definido"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">og:image: </span>
                                      <span className="text-slate-300">
                                        {page.og_tags?.image || "No definido"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">og:url: </span>
                                      <span className="text-slate-300">
                                        {page.og_tags?.url || "No definido"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Heading structure */}
                              <div className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Estructura de encabezados
                                </h4>
                                {page.headings && page.headings.length > 0 ? (
                                  <ul className="space-y-1">
                                    {page.headings.map((heading, hi) => (
                                      <li
                                        key={hi}
                                        className="flex items-center gap-2 text-sm"
                                        style={{
                                          paddingLeft: `${(heading.level - 1) * 16}px`,
                                        }}
                                      >
                                        <Badge
                                          variant="outline"
                                          className="shrink-0 text-[10px]"
                                        >
                                          H{heading.level}
                                        </Badge>
                                        <span className="truncate text-slate-300">
                                          {heading.text}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-slate-500">
                                    No se encontraron encabezados
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
