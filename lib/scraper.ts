// Este módulo debe ejecutarse exclusivamente en el servidor.
// server-only

import * as cheerio from "cheerio";

// --- Tipos ---

export interface LinkInfo {
  href: string;
  text: string;
  isInternal: boolean;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
  width: string | null;
  height: string | null;
}

export interface ScriptInfo {
  src: string | null;
  isInline: boolean;
  content: string;
  size: number;
}

export interface StyleInfo {
  isInline: boolean;
  href: string | null;
  content: string;
  size: number;
}

export interface HeadingInfo {
  level: number;
  text: string;
}

export interface CssClassInfo {
  className: string;
  elementTag: string;
  frequency: number;
}

export interface PageScanResult {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  title: string | null;
  description: string | null;
  headings: HeadingInfo[];
  h1Count: number;
  h2Count: number;
  totalHeadings: number;
  links: LinkInfo[];
  totalLinksInternal: number;
  totalLinksExternal: number;
  images: ImageInfo[];
  totalImages: number;
  scripts: ScriptInfo[];
  totalScripts: number;
  styles: StyleInfo[];
  totalStyles: number;
  cssClasses: CssClassInfo[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  metaViewport: string | null;
  metaRobots: string | null;
  lang: string | null;
  error: string | null;
}

// --- Rate limiting ---

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 30_000; // 30 segundos

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS && lastRequestTime > 0) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

// --- Utilidades ---

function isInternalLink(href: string, baseUrl: URL): boolean {
  try {
    const linkUrl = new URL(href, baseUrl.origin);
    return linkUrl.hostname === baseUrl.hostname;
  } catch {
    // Enlaces relativos son internos
    return !href.startsWith("http://") && !href.startsWith("https://");
  }
}

function normalizeUrl(href: string, baseUrl: URL): string {
  try {
    const url = new URL(href, baseUrl.origin);
    // Eliminar hash y parámetros de seguimiento
    url.hash = "";
    return url.toString();
  } catch {
    return href;
  }
}

// --- Scraper de página individual ---

export async function scrapePage(url: string): Promise<PageScanResult> {
  await enforceRateLimit();

  const result: PageScanResult = {
    url,
    statusCode: 0,
    responseTimeMs: 0,
    title: null,
    description: null,
    headings: [],
    h1Count: 0,
    h2Count: 0,
    totalHeadings: 0,
    links: [],
    totalLinksInternal: 0,
    totalLinksExternal: 0,
    images: [],
    totalImages: 0,
    scripts: [],
    totalScripts: 0,
    styles: [],
    totalStyles: 0,
    cssClasses: [],
    canonicalUrl: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    metaViewport: null,
    metaRobots: null,
    lang: null,
    error: null,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const startTime = Date.now();

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RipioMonitorBot/1.0; +https://ripio.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    result.responseTimeMs = Date.now() - startTime;
    result.statusCode = response.status;

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const baseUrl = new URL(url);

    // Título
    result.title = $("title").first().text().trim() || null;

    // Meta description
    result.description =
      $('meta[name="description"]').attr("content")?.trim() || null;

    // Meta viewport
    result.metaViewport =
      $('meta[name="viewport"]').attr("content")?.trim() || null;

    // Meta robots
    result.metaRobots =
      $('meta[name="robots"]').attr("content")?.trim() || null;

    // Canonical URL
    result.canonicalUrl =
      $('link[rel="canonical"]').attr("href")?.trim() || null;

    // Open Graph tags
    result.ogTitle =
      $('meta[property="og:title"]').attr("content")?.trim() || null;
    result.ogDescription =
      $('meta[property="og:description"]').attr("content")?.trim() || null;
    result.ogImage =
      $('meta[property="og:image"]').attr("content")?.trim() || null;

    // Idioma
    result.lang = $("html").attr("lang")?.trim() || null;

    // Headings
    const headingTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
    for (const tag of headingTags) {
      $(tag).each((_, el) => {
        result.headings.push({
          level: parseInt(tag.substring(1), 10),
          text: $(el).text().trim(),
        });
      });
    }
    result.h1Count = $("h1").length;
    result.h2Count = $("h2").length;
    result.totalHeadings = result.headings.length;

    // Links
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const internal = isInternalLink(href, baseUrl);
      result.links.push({
        href: normalizeUrl(href, baseUrl),
        text: $(el).text().trim(),
        isInternal: internal,
      });
    });
    result.totalLinksInternal = result.links.filter(
      (l) => l.isInternal
    ).length;
    result.totalLinksExternal = result.links.filter(
      (l) => !l.isInternal
    ).length;

    // Imágenes
    $("img").each((_, el) => {
      result.images.push({
        src: $(el).attr("src") || "",
        alt: $(el).attr("alt") ?? null,
        width: $(el).attr("width") ?? null,
        height: $(el).attr("height") ?? null,
      });
    });
    result.totalImages = result.images.length;

    // Scripts
    $("script").each((_, el) => {
      const src = $(el).attr("src") || null;
      const content = $(el).html() || "";
      result.scripts.push({
        src,
        isInline: !src,
        content: src ? "" : content,
        size: src ? 0 : Buffer.byteLength(content, "utf-8"),
      });
    });
    result.totalScripts = result.scripts.length;

    // Estilos
    $("style").each((_, el) => {
      const content = $(el).html() || "";
      result.styles.push({
        isInline: true,
        href: null,
        content,
        size: Buffer.byteLength(content, "utf-8"),
      });
    });
    $('link[rel="stylesheet"]').each((_, el) => {
      result.styles.push({
        isInline: false,
        href: $(el).attr("href") || null,
        content: "",
        size: 0,
      });
    });
    result.totalStyles = result.styles.length;

    // Clases CSS usadas
    const classMap = new Map<string, { tag: string; count: number }>();
    $("[class]").each((_, el) => {
      const tag = (el as unknown as { tagName: string }).tagName || "unknown";
      const classes = $(el).attr("class")?.split(/\s+/).filter(Boolean) || [];
      for (const cls of classes) {
        const key = `${cls}::${tag}`;
        const existing = classMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          classMap.set(key, { tag, count: 1 });
        }
      }
    });
    for (const [key, value] of classMap.entries()) {
      const className = key.split("::")[0];
      result.cssClasses.push({
        className,
        elementTag: value.tag,
        frequency: value.count,
      });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        result.error = "Tiempo de espera agotado (10s)";
      } else {
        result.error = err.message;
      }
    } else {
      result.error = "Error desconocido al escanear la página";
    }
  }

  return result;
}

// --- Scraper de sitio completo ---

export async function scrapeSite(
  baseUrl: string,
  maxPages: number = 10
): Promise<PageScanResult[]> {
  const results: PageScanResult[] = [];
  const visited = new Set<string>();
  const queue: string[] = [baseUrl];

  // Normalizar URL base
  let baseHostname: string;
  try {
    baseHostname = new URL(baseUrl).hostname;
  } catch {
    return [
      {
        url: baseUrl,
        statusCode: 0,
        responseTimeMs: 0,
        title: null,
        description: null,
        headings: [],
        h1Count: 0,
        h2Count: 0,
        totalHeadings: 0,
        links: [],
        totalLinksInternal: 0,
        totalLinksExternal: 0,
        images: [],
        totalImages: 0,
        scripts: [],
        totalScripts: 0,
        styles: [],
        totalStyles: 0,
        cssClasses: [],
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        metaViewport: null,
        metaRobots: null,
        lang: null,
        error: "URL base inválida",
      },
    ];
  }

  while (queue.length > 0 && results.length < maxPages) {
    const currentUrl = queue.shift()!;

    // Normalizar para evitar duplicados
    let normalizedUrl: string;
    try {
      const parsed = new URL(currentUrl);
      parsed.hash = "";
      normalizedUrl = parsed.toString();
    } catch {
      continue;
    }

    if (visited.has(normalizedUrl)) {
      continue;
    }
    visited.add(normalizedUrl);

    // Solo escanear URLs del mismo dominio
    try {
      const parsedUrl = new URL(normalizedUrl);
      if (parsedUrl.hostname !== baseHostname) {
        continue;
      }
      // Ignorar archivos binarios comunes
      const path = parsedUrl.pathname.toLowerCase();
      if (
        path.match(
          /\.(jpg|jpeg|png|gif|svg|webp|ico|pdf|zip|mp4|mp3|woff2?|ttf|eot)$/
        )
      ) {
        continue;
      }
    } catch {
      continue;
    }

    const pageResult = await scrapePage(normalizedUrl);
    results.push(pageResult);

    // Descubrir enlaces internos para agregar a la cola
    if (!pageResult.error) {
      for (const link of pageResult.links) {
        if (link.isInternal && !visited.has(link.href)) {
          try {
            const linkUrl = new URL(link.href);
            if (linkUrl.hostname === baseHostname) {
              queue.push(link.href);
            }
          } catch {
            // Ignorar enlaces mal formados
          }
        }
      }
    }
  }

  return results;
}
