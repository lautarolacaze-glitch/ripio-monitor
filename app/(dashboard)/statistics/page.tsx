"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Code2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Globe,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface PageData {
  id: number;
  scan_id: number;
  url: string;
  status_code: number;
  response_time_ms: number;
  title: string | null;
  description: string | null;
  h1_count: number;
  h2_count: number;
  total_headings: number;
  total_images: number;
  total_links_internal: number;
  total_links_external: number;
  total_scripts: number;
  total_styles: number;
}

interface CustomCodeItem {
  id: number;
  type: string;
  location: string;
  content: string;
  size_bytes: number;
  page_url: string;
}

interface ScanResponse {
  scan: { id: number; timestamp: string; pages_scanned: number };
  pages: PageData[];
  customCode: CustomCodeItem[];
  issues: Array<{ category: string; severity: string }>;
  cssClasses: Array<{ class_name: string; frequency: number }>;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

interface TreeNode {
  name: string;
  fullPath: string;
  children: TreeNode[];
  isPage: boolean;
}

function buildUrlTree(urls: string[]): TreeNode[] {
  const root: TreeNode = {
    name: "root",
    fullPath: "",
    children: [],
    isPage: false,
  };

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname
        .split("/")
        .filter((s) => s.length > 0);
      const host = parsed.origin;

      let hostNode = root.children.find((c) => c.name === host);
      if (!hostNode) {
        hostNode = { name: host, fullPath: host, children: [], isPage: false };
        root.children.push(hostNode);
      }

      let current = hostNode;
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        let child = current.children.find((c) => c.name === seg);
        if (!child) {
          child = {
            name: seg,
            fullPath: host + "/" + segments.slice(0, i + 1).join("/"),
            children: [],
            isPage: false,
          };
          current.children.push(child);
        }
        current = child;
      }
      current.isPage = true;
      if (segments.length === 0) {
        hostNode.isPage = true;
      }
    } catch {
      // skip invalid URLs
    }
  }

  return root.children;
}

function TreeNodeComponent({
  node,
  depth,
}: {
  node: TreeNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-white/5 cursor-pointer ${
          node.isPage ? "text-blue-400" : "text-slate-400"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {depth === 0 ? (
          <Globe className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
        )}
        <span className="truncate">{node.name}</span>
        {node.isPage && (
          <Badge variant="secondary" className="ml-auto text-[10px] h-4">
            pagina
          </Badge>
        )}
      </div>
      {expanded &&
        node.children.map((child, i) => (
          <TreeNodeComponent key={i} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function StatisticsPage() {
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/scan");
        if (res.status === 404) {
          setData(null);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Error al cargar datos");
        const json = await res.json();
        setData(json);
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

  const pages = data?.pages ?? [];
  const customCode = data?.customCode ?? [];

  const totalPages = pages.length;
  const totalImages = useMemo(
    () => pages.reduce((sum, p) => sum + p.total_images, 0),
    [pages]
  );
  const totalLinks = useMemo(
    () =>
      pages.reduce(
        (sum, p) => sum + p.total_links_internal + p.total_links_external,
        0
      ),
    [pages]
  );
  const totalScripts = useMemo(
    () => pages.reduce((sum, p) => sum + p.total_scripts, 0),
    [pages]
  );

  const linksData = useMemo(() => {
    const internal = pages.reduce((s, p) => s + p.total_links_internal, 0);
    const external = pages.reduce((s, p) => s + p.total_links_external, 0);
    return [
      { name: "Internos", value: internal },
      { name: "Externos", value: external },
    ];
  }, [pages]);

  const contentTypes = useMemo(() => {
    const scriptItems = customCode.filter(
      (c) => c.type === "script" || c.type === "external_script"
    ).length;
    const styleItems = customCode.filter(
      (c) => c.type === "style" || c.type === "inline_style"
    ).length;
    const trackingItems = customCode.filter(
      (c) => c.type === "tracking" || c.type === "pixel"
    ).length;
    const embedItems = customCode.filter(
      (c) => c.type === "embed" || c.type === "iframe" || c.type === "third_party"
    ).length;
    const other = customCode.length - scriptItems - styleItems - trackingItems - embedItems;

    return [
      { name: "Scripts", value: scriptItems },
      { name: "Estilos", value: styleItems },
      { name: "Tracking", value: trackingItems },
      { name: "Embeds", value: embedItems },
      ...(other > 0 ? [{ name: "Otros", value: other }] : []),
    ].filter((d) => d.value > 0);
  }, [customCode]);

  const inlineScripts = customCode.filter((c) => c.type === "script").length;
  const externalScripts = customCode.filter(
    (c) => c.type === "external_script"
  ).length;

  const assetsData = useMemo(() => {
    return [
      { name: "Imagenes", value: totalImages },
      { name: "Scripts inline", value: inlineScripts },
      { name: "Scripts externos", value: externalScripts },
      {
        name: "Estilos",
        value: customCode.filter(
          (c) => c.type === "style" || c.type === "inline_style"
        ).length,
      },
    ];
  }, [totalImages, inlineScripts, externalScripts, customCode]);

  const urlTree = useMemo(
    () => buildUrlTree(pages.map((p) => p.url)),
    [pages]
  );

  const mostLinkedPages = useMemo(() => {
    const linkCount: Record<string, number> = {};
    for (const page of pages) {
      const path = (() => {
        try {
          return new URL(page.url).pathname;
        } catch {
          return page.url;
        }
      })();
      linkCount[path] =
        (linkCount[path] || 0) +
        page.total_links_internal +
        page.total_links_external;
    }
    return Object.entries(linkCount)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pages]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
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

  if (!data || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <FileText className="h-10 w-10 text-slate-500" />
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
        <h1 className="text-2xl font-bold text-white">Estadisticas</h1>
        <p className="mt-1 text-sm text-slate-400">
          Resumen general del sitio basado en el ultimo escaneo.
        </p>
      </div>

      {/* Summary MetricCards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total paginas
            </CardDescription>
            <CardTitle className="text-2xl text-white">{totalPages}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-blue-400">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Paginas escaneadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total imagenes
            </CardDescription>
            <CardTitle className="text-2xl text-white">{totalImages}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-purple-400">
              <ImageIcon className="h-4 w-4" />
              <span className="text-xs">Imagenes detectadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total links
            </CardDescription>
            <CardTitle className="text-2xl text-white">{totalLinks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-amber-400">
              <Link2 className="h-4 w-4" />
              <span className="text-xs">Enlaces encontrados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total scripts
            </CardDescription>
            <CardTitle className="text-2xl text-white">
              {totalScripts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-emerald-400">
              <Code2 className="h-4 w-4" />
              <span className="text-xs">Scripts en paginas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Site Navigation Tree */}
        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader>
            <CardTitle className="text-white">
              Arbol de navegacion del sitio
            </CardTitle>
            <CardDescription className="text-slate-400">
              Estructura jerarquica de URLs descubiertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto">
              {urlTree.map((node, i) => (
                <TreeNodeComponent key={i} node={node} depth={0} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links Analysis */}
        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader>
            <CardTitle className="text-white">
              Analisis de enlaces
            </CardTitle>
            <CardDescription className="text-slate-400">
              Distribucion de enlaces internos vs externos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={linksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Content Types Breakdown */}
        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader>
            <CardTitle className="text-white">
              Tipos de contenido
            </CardTitle>
            <CardDescription className="text-slate-400">
              Distribucion de tipos de codigo personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={contentTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {contentTypes.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-500 py-10">
                Sin datos de tipos de contenido
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assets Summary */}
        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader>
            <CardTitle className="text-white">Resumen de assets</CardTitle>
            <CardDescription className="text-slate-400">
              Imagenes, scripts y estilos del sitio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={assetsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={12}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {assetsData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Most Linked Pages */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardHeader>
          <CardTitle className="text-white">
            Paginas con mas enlaces
          </CardTitle>
          <CardDescription className="text-slate-400">
            Las 10 paginas con mayor cantidad de enlaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-slate-300">#</TableHead>
                <TableHead className="text-slate-300">URL</TableHead>
                <TableHead className="text-slate-300 text-right">
                  Total enlaces
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mostLinkedPages.map((item, i) => (
                <TableRow key={item.url} className="border-white/5">
                  <TableCell className="text-slate-500 font-mono text-xs">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {item.url}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{item.count}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {mostLinkedPages.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-slate-500 py-8"
                  >
                    Sin datos de enlaces
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
