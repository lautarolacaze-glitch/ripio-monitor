import { NextResponse } from "next/server";
import { initDb, getSetting, setSetting } from "@/lib/db";
import { validateUrl } from "@/lib/security";

// --- Tipos ---

interface PerformanceMetric {
  id: string;
  title: string;
  score: number | null;
  displayValue: string | null;
  numericValue: number | null;
}

interface PerformanceResult {
  strategy: "mobile" | "desktop";
  overallScore: number | null;
  metrics: {
    lcp: PerformanceMetric | null;
    fid: PerformanceMetric | null;
    cls: PerformanceMetric | null;
    fcp: PerformanceMetric | null;
    ttfb: PerformanceMetric | null;
    speedIndex: PerformanceMetric | null;
  };
  fetchedAt: string;
}

interface CachedPerformance {
  mobile: PerformanceResult;
  desktop: PerformanceResult;
  cachedAt: string;
}

// --- Constantes ---

const CACHE_KEY = "performance_cache";
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutos

const PSI_API_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// --- Utilidades ---

function extractMetric(
  audits: Record<string, unknown>,
  metricId: string,
  title: string
): PerformanceMetric | null {
  const audit = audits[metricId] as
    | {
        score?: number;
        displayValue?: string;
        numericValue?: number;
      }
    | undefined;

  if (!audit) return null;

  return {
    id: metricId,
    title,
    score: audit.score ?? null,
    displayValue: audit.displayValue ?? null,
    numericValue: audit.numericValue ?? null,
  };
}

async function fetchPageSpeedData(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<PerformanceResult> {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });

  const response = await fetch(`${PSI_API_URL}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Error de PageSpeed Insights: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  const lighthouseResult = data.lighthouseResult;
  if (!lighthouseResult) {
    throw new Error("No se recibieron resultados de Lighthouse");
  }

  const audits = lighthouseResult.audits as Record<string, unknown>;
  const categories = lighthouseResult.categories as Record<
    string,
    { score: number }
  >;

  const overallScore = categories?.performance?.score ?? null;

  return {
    strategy,
    overallScore: overallScore !== null ? Math.round(overallScore * 100) : null,
    metrics: {
      lcp: extractMetric(
        audits,
        "largest-contentful-paint",
        "Largest Contentful Paint (LCP)"
      ),
      fid: extractMetric(
        audits,
        "max-potential-fid",
        "First Input Delay (FID)"
      ),
      cls: extractMetric(
        audits,
        "cumulative-layout-shift",
        "Cumulative Layout Shift (CLS)"
      ),
      fcp: extractMetric(
        audits,
        "first-contentful-paint",
        "First Contentful Paint (FCP)"
      ),
      ttfb: extractMetric(
        audits,
        "server-response-time",
        "Time to First Byte (TTFB)"
      ),
      speedIndex: extractMetric(
        audits,
        "speed-index",
        "Speed Index"
      ),
    },
    fetchedAt: new Date().toISOString(),
  };
}

// --- Handler ---

export async function GET(): Promise<NextResponse> {
  try {
    initDb();

    const siteUrl = process.env.SITE_URL;
    if (!siteUrl) {
      return NextResponse.json(
        { error: "SITE_URL no está configurada en las variables de entorno" },
        { status: 500 }
      );
    }

    const urlValidation = validateUrl(siteUrl);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: `URL inválida: ${urlValidation.error}` },
        { status: 400 }
      );
    }

    // Verificar caché
    const cached = getSetting(CACHE_KEY);
    if (cached) {
      try {
        const parsedCache: CachedPerformance = JSON.parse(cached);
        const cacheAge = Date.now() - new Date(parsedCache.cachedAt).getTime();

        if (cacheAge < CACHE_DURATION_MS) {
          return NextResponse.json({
            ...parsedCache,
            fromCache: true,
          });
        }
      } catch {
        // Caché inválida, continuar con solicitud nueva
      }
    }

    // Obtener datos de PageSpeed Insights para mobile y desktop
    const [mobileResult, desktopResult] = await Promise.all([
      fetchPageSpeedData(siteUrl, "mobile"),
      fetchPageSpeedData(siteUrl, "desktop"),
    ]);

    const result: CachedPerformance = {
      mobile: mobileResult,
      desktop: desktopResult,
      cachedAt: new Date().toISOString(),
    };

    // Guardar en caché
    setSetting(CACHE_KEY, JSON.stringify(result));

    return NextResponse.json({
      ...result,
      fromCache: false,
    });
  } catch (err: unknown) {
    console.error("Error al obtener datos de rendimiento:", err);
    const message =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al obtener datos de rendimiento: ${message}` },
      { status: 500 }
    );
  }
}
