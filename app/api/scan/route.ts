import { NextResponse } from "next/server";
import {
  initDb,
  saveScan,
  getLatestScan,
  savePageData,
  saveCssClass,
  saveIssue,
  saveCustomCode,
  getPagesByScan,
  getIssuesByScan,
  getCssClassesByScan,
  getCustomCodeByScan,
} from "@/lib/db";
import { scrapeSite } from "@/lib/scraper";
import {
  analyzePageSeo,
  analyzePagePerformance,
  analyzePageAccessibility,
  analyzeCustomCode,
  calculateScore,
  generateRecommendations,
} from "@/lib/analyzer";
import { RateLimiter, validateUrl } from "@/lib/security";

// Rate limiter: 1 escaneo cada 5 minutos
const scanRateLimiter = new RateLimiter(5 * 60 * 1000, 1);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Verificar rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!scanRateLimiter.check(clientIp)) {
      const timeToReset = scanRateLimiter.getTimeToReset(clientIp);
      const minutesLeft = Math.ceil(timeToReset / 60_000);
      return NextResponse.json(
        {
          error: `Límite de escaneos alcanzado. Intente de nuevo en ${minutesLeft} minuto(s).`,
        },
        { status: 429 }
      );
    }

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

    // Inicializar base de datos
    initDb();

    const startTime = Date.now();

    // Ejecutar escaneo del sitio
    const pageResults = await scrapeSite(siteUrl, 10);
    const durationMs = Date.now() - startTime;

    // Analizar cada página y recolectar issues
    const allIssues: Array<{
      pageUrl: string;
      category: string;
      severity: string;
      title: string;
      description: string;
      recommendation: string;
    }> = [];

    for (const page of pageResults) {
      const seoIssues = analyzePageSeo(page);
      const perfIssues = analyzePagePerformance(page);
      const a11yIssues = analyzePageAccessibility(page);
      const codeIssues = analyzeCustomCode(page);

      for (const issue of [
        ...seoIssues,
        ...perfIssues,
        ...a11yIssues,
        ...codeIssues,
      ]) {
        allIssues.push({
          pageUrl: page.url,
          ...issue,
        });
      }
    }

    // Guardar escaneo en la base de datos
    const scan = saveScan({
      timestamp: new Date().toISOString(),
      status: "completed",
      duration_ms: durationMs,
      pages_scanned: pageResults.length,
      total_issues: allIssues.length,
    });

    // Guardar datos de cada página
    for (const page of pageResults) {
      savePageData({
        scan_id: scan.id,
        url: page.url,
        status_code: page.statusCode,
        response_time_ms: page.responseTimeMs,
        title: page.title,
        description: page.description,
        h1_count: page.h1Count,
        h2_count: page.h2Count,
        total_headings: page.totalHeadings,
        total_images: page.totalImages,
        total_links_internal: page.totalLinksInternal,
        total_links_external: page.totalLinksExternal,
        total_scripts: page.totalScripts,
        total_styles: page.totalStyles,
        meta_viewport: page.metaViewport,
        meta_robots: page.metaRobots,
        canonical_url: page.canonicalUrl,
        og_title: page.ogTitle,
        og_description: page.ogDescription,
        og_image: page.ogImage,
      });

      // Guardar clases CSS (limitar a las 50 más frecuentes por página)
      const sortedClasses = [...page.cssClasses]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 50);

      for (const cssClass of sortedClasses) {
        saveCssClass({
          scan_id: scan.id,
          page_url: page.url,
          class_name: cssClass.className,
          element_tag: cssClass.elementTag,
          frequency: cssClass.frequency,
        });
      }

      // Guardar código personalizado (scripts y estilos)
      for (const script of page.scripts) {
        saveCustomCode({
          scan_id: scan.id,
          page_url: page.url,
          type: "script",
          location: script.src || "inline",
          content: script.content.substring(0, 5000), // Limitar tamaño
          size_bytes: script.size,
        });
      }

      for (const style of page.styles) {
        saveCustomCode({
          scan_id: scan.id,
          page_url: page.url,
          type: "style",
          location: style.href || "inline",
          content: style.content.substring(0, 5000),
          size_bytes: style.size,
        });
      }
    }

    // Guardar issues
    for (const issue of allIssues) {
      saveIssue({
        scan_id: scan.id,
        page_url: issue.pageUrl,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
      });
    }

    // Calcular puntuación y recomendaciones
    const issueObjects = allIssues.map((i) => ({
      category: i.category as "seo" | "performance" | "accessibility" | "custom-code",
      severity: i.severity as "critical" | "high" | "medium" | "low",
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
    }));

    const score = calculateScore(issueObjects);
    const recommendations = generateRecommendations(issueObjects);

    return NextResponse.json({
      success: true,
      scan: {
        ...scan,
        score,
      },
      pages: pageResults.length,
      issues: allIssues.length,
      recommendations: recommendations.slice(0, 10),
    });
  } catch (err: unknown) {
    console.error("Error durante el escaneo:", err);
    const message =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error durante el escaneo: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    initDb();

    const scan = getLatestScan();
    if (!scan) {
      return NextResponse.json(
        { error: "No se encontraron escaneos. Ejecute un escaneo primero." },
        { status: 404 }
      );
    }

    const pages = getPagesByScan(scan.id);
    const issues = getIssuesByScan(scan.id);
    const cssClasses = getCssClassesByScan(scan.id);
    const customCode = getCustomCodeByScan(scan.id);

    const issueObjects = issues.map((i) => ({
      category: i.category as "seo" | "performance" | "accessibility" | "custom-code",
      severity: i.severity as "critical" | "high" | "medium" | "low",
      title: i.title,
      description: i.description,
      recommendation: i.recommendation,
    }));

    const score = calculateScore(issueObjects);
    const recommendations = generateRecommendations(issueObjects);

    return NextResponse.json({
      scan: {
        ...scan,
        score,
      },
      pages,
      issues,
      cssClasses,
      customCode,
      recommendations: recommendations.slice(0, 10),
    });
  } catch (err: unknown) {
    console.error("Error al obtener resultados:", err);
    const message =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al obtener resultados: ${message}` },
      { status: 500 }
    );
  }
}
