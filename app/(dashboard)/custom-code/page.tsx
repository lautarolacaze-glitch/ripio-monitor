"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  FileCode,
  Paintbrush,
  Activity,
  Code2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

interface CustomCodeItem {
  id: number;
  scan_id: number;
  page_url: string;
  type: string;
  location: string;
  content: string;
  size_bytes: number;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function classifyScript(content: string, type: string): string {
  const lower = (content + " " + type).toLowerCase();
  if (
    lower.includes("analytics") ||
    lower.includes("gtag") ||
    lower.includes("ga(") ||
    lower.includes("google-analytics") ||
    lower.includes("gtm")
  )
    return "analytics";
  if (
    lower.includes("ads") ||
    lower.includes("adsbygoogle") ||
    lower.includes("fbevents") ||
    lower.includes("pixel") ||
    lower.includes("doubleclick")
  )
    return "advertising";
  if (
    lower.includes("jquery") ||
    lower.includes("bootstrap") ||
    lower.includes("react") ||
    lower.includes("vue") ||
    lower.includes("angular") ||
    lower.includes("lodash")
  )
    return "functional";
  return "unknown";
}

function badgeVariantForType(
  classification: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (classification) {
    case "analytics":
      return "secondary";
    case "advertising":
      return "outline";
    case "functional":
      return "default";
    default:
      return "destructive";
  }
}

function classificationLabel(classification: string): string {
  switch (classification) {
    case "analytics":
      return "Analytics";
    case "advertising":
      return "Publicidad";
    case "functional":
      return "Funcional";
    default:
      return "Desconocido";
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function CustomCodePage() {
  const [data, setData] = useState<CustomCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CustomCodeItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/scan");
        if (!res.ok) throw new Error("Error al cargar datos");
        const json = await res.json();
        setData(json.custom_code ?? []);
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

  const scripts = data.filter(
    (d) => d.type === "script" || d.type === "external_script"
  );
  const styles = data.filter(
    (d) => d.type === "style" || d.type === "inline_style"
  );
  const tracking = data.filter(
    (d) =>
      d.type === "tracking" ||
      d.type === "pixel" ||
      classifyScript(d.content, d.type) === "analytics" ||
      classifyScript(d.content, d.type) === "advertising"
  );
  const embeds = data.filter(
    (d) =>
      d.type === "embed" ||
      d.type === "iframe" ||
      d.type === "third_party"
  );

  const riskyItems = data.filter(
    (d) => classifyScript(d.content, d.type) === "unknown"
  );

  function openPreview(item: CustomCodeItem) {
    setSelectedItem(item);
    setDialogOpen(true);
  }

  function renderTable(items: CustomCodeItem[]) {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center py-12 text-slate-400">
          No hay elementos en esta categoria.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-white/5">
            <TableHead className="text-slate-300">Tipo</TableHead>
            <TableHead className="text-slate-300">Ubicacion</TableHead>
            <TableHead className="text-slate-300">Fuente / Contenido</TableHead>
            <TableHead className="text-slate-300">Tamano</TableHead>
            <TableHead className="text-slate-300">Clasificacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const classification = classifyScript(item.content, item.type);
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer border-white/5 hover:bg-white/5"
                onClick={() => openPreview(item)}
              >
                <TableCell className="text-slate-300 font-mono text-xs">
                  {item.type}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {item.location}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs text-slate-400 font-mono text-xs">
                  {truncate(item.content, 60)}
                </TableCell>
                <TableCell className="text-slate-400">
                  {formatBytes(item.size_bytes)}
                </TableCell>
                <TableCell>
                  <Badge variant={badgeVariantForType(classification)}>
                    {classificationLabel(classification)}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl bg-white/5" />
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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <FileCode className="h-10 w-10 text-slate-500" />
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
        <h1 className="text-2xl font-bold text-white">Custom Code</h1>
        <p className="mt-1 text-sm text-slate-400">
          Analisis de scripts, estilos y codigo personalizado detectado en el
          sitio.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Total scripts
            </CardDescription>
            <CardTitle className="text-2xl text-white">
              {scripts.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-blue-400">
              <FileCode className="h-4 w-4" />
              <span className="text-xs">Scripts detectados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Estilos inline
            </CardDescription>
            <CardTitle className="text-2xl text-white">
              {styles.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-purple-400">
              <Paintbrush className="h-4 w-4" />
              <span className="text-xs">Hojas de estilo y estilos inline</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Tracking pixels
            </CardDescription>
            <CardTitle className="text-2xl text-white">
              {tracking.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-amber-400">
              <Activity className="h-4 w-4" />
              <span className="text-xs">Pixeles de seguimiento</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-[#0f1d32]">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Third-party
            </CardDescription>
            <CardTitle className="text-2xl text-white">
              {embeds.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-emerald-400">
              <Code2 className="h-4 w-4" />
              <span className="text-xs">Scripts de terceros / embeds</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts for risky/unknown scripts */}
      {riskyItems.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <CardTitle className="text-red-300">
                Scripts no identificados ({riskyItems.length})
              </CardTitle>
            </div>
            <CardDescription className="text-red-300/70">
              Se detectaron scripts que no pudieron ser clasificados. Revise
              manualmente para asegurar que no sean maliciosos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskyItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 cursor-pointer hover:bg-red-500/10"
                  onClick={() => openPreview(item)}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span className="text-sm text-red-200 font-mono truncate max-w-md">
                      {truncate(item.content, 80)}
                    </span>
                  </div>
                  <span className="text-xs text-red-300">
                    {item.page_url}
                  </span>
                </div>
              ))}
              {riskyItems.length > 5 && (
                <p className="text-xs text-red-300/60 text-center pt-1">
                  ...y {riskyItems.length - 5} mas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardContent className="pt-4">
          <Tabs defaultValue="scripts">
            <TabsList className="bg-white/5">
              <TabsTrigger value="scripts" className="text-slate-300 data-active:text-white">
                Scripts
              </TabsTrigger>
              <TabsTrigger value="styles" className="text-slate-300 data-active:text-white">
                Estilos
              </TabsTrigger>
              <TabsTrigger value="tracking" className="text-slate-300 data-active:text-white">
                Tracking
              </TabsTrigger>
              <TabsTrigger value="embeds" className="text-slate-300 data-active:text-white">
                Embeds
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4 bg-white/5" />

            <TabsContent value="scripts">{renderTable(scripts)}</TabsContent>
            <TabsContent value="styles">{renderTable(styles)}</TabsContent>
            <TabsContent value="tracking">{renderTable(tracking)}</TabsContent>
            <TabsContent value="embeds">{renderTable(embeds)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Code Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-[#0f1d32] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Vista previa del codigo
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedItem?.page_url} &mdash;{" "}
              <Badge variant={badgeVariantForType(classifyScript(selectedItem?.content ?? "", selectedItem?.type ?? ""))}>
                {classificationLabel(classifyScript(selectedItem?.content ?? "", selectedItem?.type ?? ""))}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>
                <strong className="text-slate-300">Tipo:</strong>{" "}
                {selectedItem?.type}
              </span>
              <span>
                <strong className="text-slate-300">Ubicacion:</strong>{" "}
                {selectedItem?.location}
              </span>
              <span>
                <strong className="text-slate-300">Tamano:</strong>{" "}
                {formatBytes(selectedItem?.size_bytes ?? 0)}
              </span>
            </div>
            <pre className="max-h-96 overflow-auto rounded-lg bg-black/50 p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
              {selectedItem?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
