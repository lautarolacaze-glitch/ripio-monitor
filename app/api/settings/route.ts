import { initDb, getSetting, setSetting, clearHistory, getDb } from "@/lib/db";

initDb();

export async function GET() {
  try {
    const scanFrequency = getSetting("scan_frequency") ?? "24h";
    const monitoredUrlsRaw = getSetting("monitored_urls") ?? "[]";

    let monitoredUrls: string[] = [];
    try {
      monitoredUrls = JSON.parse(monitoredUrlsRaw);
    } catch {
      monitoredUrls = [];
    }

    return Response.json({
      scan_frequency: scanFrequency,
      monitored_urls: monitoredUrls,
    });
  } catch (error) {
    return Response.json(
      { error: "Error al obtener configuracion" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scan_frequency, monitored_urls } = body;

    if (scan_frequency) {
      const valid = ["1h", "6h", "12h", "24h"];
      if (!valid.includes(scan_frequency)) {
        return Response.json(
          { error: "Frecuencia no valida" },
          { status: 400 }
        );
      }
      setSetting("scan_frequency", scan_frequency);
    }

    if (monitored_urls !== undefined) {
      if (!Array.isArray(monitored_urls)) {
        return Response.json(
          { error: "monitored_urls debe ser un array" },
          { status: 400 }
        );
      }
      setSetting("monitored_urls", JSON.stringify(monitored_urls));
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: "Error al guardar configuracion" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    clearHistory();
    return Response.json({ ok: true, message: "Historial eliminado" });
  } catch (error) {
    return Response.json(
      { error: "Error al limpiar historial" },
      { status: 500 }
    );
  }
}
