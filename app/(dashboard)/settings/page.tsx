"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  Globe,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  LogOut,
  Settings,
  Save,
  X,
} from "lucide-react";

const FREQUENCY_OPTIONS = [
  { value: "1h", label: "Cada 1 hora" },
  { value: "6h", label: "Cada 6 horas" },
  { value: "12h", label: "Cada 12 horas" },
  { value: "24h", label: "Cada 24 horas" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [scanFrequency, setScanFrequency] = useState("24h");
  const [monitoredUrls, setMonitoredUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Error al cargar configuracion");
        const json = await res.json();
        setScanFrequency(json.scan_frequency ?? "24h");
        setMonitoredUrls(json.monitored_urls ?? []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Error al cargar configuracion"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const saveSettings = useCallback(
    async (freq: string, urls: string[]) => {
      setSaving(true);
      setSaveMessage(null);
      try {
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scan_frequency: freq,
            monitored_urls: urls,
          }),
        });
        if (!res.ok) throw new Error("Error al guardar");
        setSaveMessage("Configuracion guardada correctamente");
        setTimeout(() => setSaveMessage(null), 3000);
      } catch {
        setSaveMessage("Error al guardar configuracion");
        setTimeout(() => setSaveMessage(null), 3000);
      } finally {
        setSaving(false);
      }
    },
    []
  );

  function handleFrequencyChange(value: string | null) {
    if (!value) return;
    setScanFrequency(value);
    saveSettings(value, monitoredUrls);
  }

  function handleAddUrl() {
    const url = newUrl.trim();
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return;
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    if (monitoredUrls.includes(normalizedUrl)) {
      setNewUrl("");
      return;
    }

    const updated = [...monitoredUrls, normalizedUrl];
    setMonitoredUrls(updated);
    setNewUrl("");
    saveSettings(scanFrequency, updated);
  }

  function handleRemoveUrl(url: string) {
    const updated = monitoredUrls.filter((u) => u !== url);
    setMonitoredUrls(updated);
    saveSettings(scanFrequency, updated);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/scan");
      if (!res.ok) throw new Error("Error al exportar");
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ripio-monitor-reporte-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }

  async function handleClearHistory() {
    setClearing(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (!res.ok) throw new Error("Error al limpiar");
      setClearDialogOpen(false);
      setSaveMessage("Historial eliminado correctamente");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Error al limpiar historial");
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setClearing(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg bg-white/5" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl bg-white/5" />
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">Configuracion</h1>
        <p className="mt-1 text-sm text-slate-400">
          Administre la frecuencia de escaneo, URLs y opciones del sistema.
        </p>
      </div>

      {/* Save feedback */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border px-4 py-2 text-sm ${
            saveMessage.includes("Error")
              ? "border-red-500/20 bg-red-500/10 text-red-400"
              : "border-green-500/20 bg-green-500/10 text-green-400"
          }`}
        >
          {saveMessage}
        </motion.div>
      )}

      {/* Scan Frequency */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">
              Frecuencia de escaneo
            </CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Configure cada cuanto tiempo se ejecuta un escaneo automatico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={scanFrequency}
            onValueChange={handleFrequencyChange}
          >
            <SelectTrigger className="w-64 border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Seleccionar frecuencia" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#1a2744]">
              {FREQUENCY_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-slate-300 focus:bg-white/10 focus:text-white"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Monitored URLs */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            <CardTitle className="text-white">URLs a monitorear</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Agregue las URLs que desea monitorear con cada escaneo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add URL */}
          <div className="flex gap-2">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="https://ejemplo.com"
              className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
            <Button
              onClick={handleAddUrl}
              disabled={!newUrl.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Agregar
            </Button>
          </div>

          {/* URL List */}
          {monitoredUrls.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No hay URLs configuradas. Agregue una URL para comenzar.
            </p>
          ) : (
            <div className="space-y-2">
              {monitoredUrls.map((url) => (
                <div
                  key={url}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="text-sm text-slate-300 font-mono truncate">
                      {url}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveUrl(url)}
                    className="text-slate-500 hover:text-red-400 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Report */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white">Exportar reporte</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Descargue un reporte JSON del ultimo escaneo realizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="border-white/10 text-slate-300 hover:text-white hover:border-white/20"
          >
            <Download className="h-4 w-4 mr-1.5" />
            {exporting ? "Exportando..." : "Descargar reporte JSON"}
          </Button>
        </CardContent>
      </Card>

      {/* Clear History */}
      <Card className="border-red-500/10 bg-[#0f1d32]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            <CardTitle className="text-white">Limpiar historial</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Elimine todos los datos de escaneos anteriores de la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setClearDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Limpiar historial
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card className="border-white/5 bg-[#0f1d32]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-white">Cerrar sesion</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Cierre su sesion actual y vuelva a la pantalla de inicio de sesion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white/10 text-slate-300 hover:text-red-400 hover:border-red-500/20"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Cerrar sesion
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Clear History */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="border-white/10 bg-[#0f1d32] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Confirmar eliminacion
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Esta seguro? Esta accion no se puede deshacer. Se eliminaran
              todos los escaneos, paginas, problemas y codigo personalizado
              almacenados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearDialogOpen(false)}
              className="border-white/10 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearHistory}
              disabled={clearing}
            >
              {clearing ? "Eliminando..." : "Si, eliminar todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
