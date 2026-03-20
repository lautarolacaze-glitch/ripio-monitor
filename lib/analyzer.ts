import type { PageScanResult } from "./scraper";

// --- Tipos ---

export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type IssueCategory =
  | "seo"
  | "performance"
  | "accessibility"
  | "custom-code";

export interface Issue {
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  recommendation: string;
}

export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  issues: Issue[];
}

// --- Constantes de severidad para puntuación ---

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = {
  critical: 15,
  high: 10,
  medium: 5,
  low: 2,
};

// --- Análisis SEO ---

export function analyzePageSeo(page: PageScanResult): Issue[] {
  const issues: Issue[] = [];

  // Título
  if (!page.title) {
    issues.push({
      category: "seo",
      severity: "critical",
      title: "Falta el título de la página",
      description: "La página no tiene una etiqueta <title> definida.",
      recommendation:
        "Agregar una etiqueta <title> descriptiva de entre 30 y 60 caracteres.",
    });
  } else if (page.title.length < 10) {
    issues.push({
      category: "seo",
      severity: "high",
      title: "Título demasiado corto",
      description: `El título tiene solo ${page.title.length} caracteres.`,
      recommendation:
        "El título debe tener entre 30 y 60 caracteres para un rendimiento SEO óptimo.",
    });
  } else if (page.title.length > 70) {
    issues.push({
      category: "seo",
      severity: "medium",
      title: "Título demasiado largo",
      description: `El título tiene ${page.title.length} caracteres y puede ser truncado en los resultados de búsqueda.`,
      recommendation: "Reducir el título a un máximo de 60-70 caracteres.",
    });
  }

  // Meta description
  if (!page.description) {
    issues.push({
      category: "seo",
      severity: "high",
      title: "Falta la meta descripción",
      description:
        "La página no tiene una etiqueta <meta name='description'> definida.",
      recommendation:
        "Agregar una meta descripción de entre 120 y 160 caracteres que resuma el contenido de la página.",
    });
  } else if (page.description.length < 50) {
    issues.push({
      category: "seo",
      severity: "medium",
      title: "Meta descripción demasiado corta",
      description: `La meta descripción tiene solo ${page.description.length} caracteres.`,
      recommendation:
        "La meta descripción debe tener entre 120 y 160 caracteres.",
    });
  } else if (page.description.length > 170) {
    issues.push({
      category: "seo",
      severity: "low",
      title: "Meta descripción demasiado larga",
      description: `La meta descripción tiene ${page.description.length} caracteres y puede ser truncada.`,
      recommendation:
        "Reducir la meta descripción a un máximo de 160 caracteres.",
    });
  }

  // H1
  if (page.h1Count === 0) {
    issues.push({
      category: "seo",
      severity: "critical",
      title: "Falta la etiqueta H1",
      description: "La página no contiene ninguna etiqueta <h1>.",
      recommendation:
        "Agregar exactamente una etiqueta <h1> que describa el contenido principal de la página.",
    });
  } else if (page.h1Count > 1) {
    issues.push({
      category: "seo",
      severity: "medium",
      title: "Múltiples etiquetas H1",
      description: `La página tiene ${page.h1Count} etiquetas <h1>. Se recomienda usar solo una.`,
      recommendation:
        "Usar una sola etiqueta <h1> por página para una mejor estructura SEO.",
    });
  }

  // Canonical URL
  if (!page.canonicalUrl) {
    issues.push({
      category: "seo",
      severity: "medium",
      title: "Falta la URL canónica",
      description:
        "La página no tiene una etiqueta <link rel='canonical'> definida.",
      recommendation:
        "Agregar una URL canónica para evitar problemas de contenido duplicado.",
    });
  }

  // Open Graph tags
  if (!page.ogTitle) {
    issues.push({
      category: "seo",
      severity: "medium",
      title: "Falta og:title",
      description:
        "La página no tiene la etiqueta Open Graph para el título.",
      recommendation:
        "Agregar <meta property='og:title'> para mejorar la vista previa en redes sociales.",
    });
  }

  if (!page.ogDescription) {
    issues.push({
      category: "seo",
      severity: "medium",
      title: "Falta og:description",
      description:
        "La página no tiene la etiqueta Open Graph para la descripción.",
      recommendation:
        "Agregar <meta property='og:description'> para mejorar la vista previa en redes sociales.",
    });
  }

  if (!page.ogImage) {
    issues.push({
      category: "seo",
      severity: "low",
      title: "Falta og:image",
      description:
        "La página no tiene una imagen Open Graph definida.",
      recommendation:
        "Agregar <meta property='og:image'> con una imagen representativa (mínimo 1200x630px).",
    });
  }

  // Meta robots
  if (page.metaRobots && page.metaRobots.includes("noindex")) {
    issues.push({
      category: "seo",
      severity: "high",
      title: "Página marcada como noindex",
      description:
        "La etiqueta meta robots indica que esta página no debe ser indexada.",
      recommendation:
        "Verificar que esta configuración sea intencional. Si la página debe aparecer en buscadores, remover 'noindex'.",
    });
  }

  return issues;
}

// --- Análisis de rendimiento ---

export function analyzePagePerformance(page: PageScanResult): Issue[] {
  const issues: Issue[] = [];

  // Demasiados scripts
  if (page.totalScripts > 20) {
    issues.push({
      category: "performance",
      severity: "critical",
      title: "Exceso de scripts",
      description: `La página carga ${page.totalScripts} scripts. Esto afecta significativamente el rendimiento.`,
      recommendation:
        "Reducir el número de scripts, combinar archivos cuando sea posible y usar carga diferida (defer/async).",
    });
  } else if (page.totalScripts > 10) {
    issues.push({
      category: "performance",
      severity: "high",
      title: "Demasiados scripts",
      description: `La página carga ${page.totalScripts} scripts.`,
      recommendation:
        "Considerar combinar scripts y eliminar los que no sean necesarios.",
    });
  }

  // Scripts inline grandes
  const largeInlineScripts = page.scripts.filter(
    (s) => s.isInline && s.size > 10_000
  );
  if (largeInlineScripts.length > 0) {
    issues.push({
      category: "performance",
      severity: "high",
      title: "Scripts inline de gran tamaño",
      description: `Se encontraron ${largeInlineScripts.length} scripts inline mayores a 10KB.`,
      recommendation:
        "Mover scripts inline grandes a archivos externos para aprovechar el cacheo del navegador.",
    });
  }

  // Estilos inline grandes
  const largeInlineStyles = page.styles.filter(
    (s) => s.isInline && s.size > 5_000
  );
  if (largeInlineStyles.length > 0) {
    issues.push({
      category: "performance",
      severity: "medium",
      title: "Estilos inline de gran tamaño",
      description: `Se encontraron ${largeInlineStyles.length} bloques de estilos inline mayores a 5KB.`,
      recommendation:
        "Mover estilos inline grandes a hojas de estilo externas.",
    });
  }

  // Demasiadas hojas de estilo externas (recursos que bloquean el render)
  const externalStyles = page.styles.filter((s) => !s.isInline);
  if (externalStyles.length > 5) {
    issues.push({
      category: "performance",
      severity: "high",
      title: "Demasiadas hojas de estilo externas",
      description: `Se cargan ${externalStyles.length} hojas de estilo externas que bloquean el renderizado.`,
      recommendation:
        "Combinar hojas de estilo y usar CSS crítico inline para el contenido above-the-fold.",
    });
  }

  // Scripts sin defer ni async (potencialmente bloqueantes)
  const blockingScripts = page.scripts.filter(
    (s) => s.src && !s.isInline
  );
  if (blockingScripts.length > 5) {
    issues.push({
      category: "performance",
      severity: "medium",
      title: "Posibles recursos bloqueantes del renderizado",
      description: `Se detectaron ${blockingScripts.length} scripts externos que podrían bloquear el renderizado.`,
      recommendation:
        "Agregar los atributos 'async' o 'defer' a los scripts que no sean críticos para el renderizado inicial.",
    });
  }

  // Demasiadas imágenes
  if (page.totalImages > 50) {
    issues.push({
      category: "performance",
      severity: "medium",
      title: "Exceso de imágenes",
      description: `La página contiene ${page.totalImages} imágenes.`,
      recommendation:
        "Implementar lazy loading para imágenes fuera de la vista inicial y optimizar formatos (WebP/AVIF).",
    });
  }

  // Tiempo de respuesta alto
  if (page.responseTimeMs > 3000) {
    issues.push({
      category: "performance",
      severity: "critical",
      title: "Tiempo de respuesta del servidor muy alto",
      description: `El servidor tardó ${page.responseTimeMs}ms en responder.`,
      recommendation:
        "Optimizar el tiempo de respuesta del servidor. Idealmente debe ser menor a 200ms.",
    });
  } else if (page.responseTimeMs > 1000) {
    issues.push({
      category: "performance",
      severity: "high",
      title: "Tiempo de respuesta del servidor alto",
      description: `El servidor tardó ${page.responseTimeMs}ms en responder.`,
      recommendation:
        "Revisar la configuración del servidor, implementar cacheo y optimizar consultas a bases de datos.",
    });
  }

  return issues;
}

// --- Análisis de accesibilidad ---

export function analyzePageAccessibility(page: PageScanResult): Issue[] {
  const issues: Issue[] = [];

  // Imágenes sin alt
  const imagesWithoutAlt = page.images.filter(
    (img) => img.alt === null || img.alt.trim() === ""
  );
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      category: "accessibility",
      severity: "high",
      title: "Imágenes sin texto alternativo",
      description: `Se encontraron ${imagesWithoutAlt.length} de ${page.totalImages} imágenes sin atributo alt.`,
      recommendation:
        "Agregar texto alternativo descriptivo a todas las imágenes. Usar alt='' solo para imágenes decorativas.",
    });
  }

  // Falta atributo lang
  if (!page.lang) {
    issues.push({
      category: "accessibility",
      severity: "critical",
      title: "Falta el atributo lang",
      description:
        "La etiqueta <html> no tiene el atributo 'lang' definido.",
      recommendation:
        "Agregar el atributo lang al elemento <html>, por ejemplo: <html lang='es'>.",
    });
  }

  // Jerarquía de encabezados
  if (page.headings.length > 0) {
    // Verificar que comience con H1
    if (page.headings[0].level !== 1) {
      issues.push({
        category: "accessibility",
        severity: "medium",
        title: "Jerarquía de encabezados incorrecta",
        description: `El primer encabezado de la página es un H${page.headings[0].level} en lugar de H1.`,
        recommendation:
          "La jerarquía de encabezados debe comenzar con un H1.",
      });
    }

    // Verificar saltos en la jerarquía (ej: H1 -> H3 sin H2)
    for (let i = 1; i < page.headings.length; i++) {
      const current = page.headings[i].level;
      const previous = page.headings[i - 1].level;
      if (current > previous + 1) {
        issues.push({
          category: "accessibility",
          severity: "medium",
          title: "Salto en la jerarquía de encabezados",
          description: `Se detectó un salto de H${previous} a H${current}. Se omitió el nivel H${previous + 1}.`,
          recommendation:
            "Mantener una jerarquía de encabezados secuencial sin saltar niveles.",
        });
        break; // Solo reportar el primer salto
      }
    }
  }

  // Meta viewport
  if (!page.metaViewport) {
    issues.push({
      category: "accessibility",
      severity: "high",
      title: "Falta meta viewport",
      description:
        "La página no tiene configurado el meta viewport para dispositivos móviles.",
      recommendation:
        "Agregar <meta name='viewport' content='width=device-width, initial-scale=1'>.",
    });
  }

  return issues;
}

// --- Análisis de código personalizado ---

export function analyzeCustomCode(page: PageScanResult): Issue[] {
  const issues: Issue[] = [];

  // Detectar píxeles de seguimiento comunes
  const trackingPatterns = [
    { name: "Google Analytics", pattern: /google-analytics\.com|gtag|ga\(/ },
    { name: "Google Tag Manager", pattern: /googletagmanager\.com|gtm\.js/ },
    { name: "Facebook Pixel", pattern: /facebook\.net\/en_US\/fbevents|fbq\(/ },
    { name: "Hotjar", pattern: /hotjar\.com|hj\(/ },
    { name: "Mixpanel", pattern: /mixpanel\.com|mixpanel\.init/ },
    { name: "Segment", pattern: /segment\.com|analytics\.js/ },
    { name: "Amplitude", pattern: /amplitude\.com|amplitude\.getInstance/ },
    { name: "Intercom", pattern: /intercom\.io|Intercom\(/ },
    { name: "Drift", pattern: /drift\.com|driftt/ },
    { name: "HubSpot", pattern: /hubspot\.com|hbspt/ },
  ];

  for (const script of page.scripts) {
    const content = script.src || script.content;
    for (const tracker of trackingPatterns) {
      if (tracker.pattern.test(content)) {
        issues.push({
          category: "custom-code",
          severity: "low",
          title: `Píxel de seguimiento detectado: ${tracker.name}`,
          description: `Se encontró código de ${tracker.name} en la página.`,
          recommendation:
            "Verificar que este servicio de seguimiento sea necesario y cumpla con las políticas de privacidad.",
        });
      }
    }
  }

  // Scripts de terceros potencialmente riesgosos
  const riskyDomains = [
    "cdn.jsdelivr.net",
    "unpkg.com",
    "cdnjs.cloudflare.com",
  ];
  for (const script of page.scripts) {
    if (script.src) {
      for (const domain of riskyDomains) {
        if (script.src.includes(domain)) {
          issues.push({
            category: "custom-code",
            severity: "medium",
            title: `Script de CDN público detectado`,
            description: `Se carga un script desde ${domain}: ${script.src}`,
            recommendation:
              "Considerar alojar estos recursos localmente para mayor control y seguridad. Usar atributos integrity (SRI).",
          });
        }
      }
    }
  }

  // Scripts inline grandes
  const largeInlineScripts = page.scripts.filter(
    (s) => s.isInline && s.size > 5_000
  );
  for (const script of largeInlineScripts) {
    issues.push({
      category: "custom-code",
      severity: "medium",
      title: "Script inline de gran tamaño detectado",
      description: `Se encontró un script inline de ${Math.round(script.size / 1024)}KB.`,
      recommendation:
        "Revisar el contenido de este script. Considerar moverlo a un archivo externo.",
    });
  }

  // Estilos inline
  const inlineStyles = page.styles.filter((s) => s.isInline);
  if (inlineStyles.length > 3) {
    issues.push({
      category: "custom-code",
      severity: "low",
      title: "Múltiples bloques de estilos inline",
      description: `Se encontraron ${inlineStyles.length} bloques de estilos <style> inline.`,
      recommendation:
        "Consolidar los estilos inline en una hoja de estilo externa para mejor mantenimiento.",
    });
  }

  return issues;
}

// --- Recomendaciones priorizadas ---

export function generateRecommendations(issues: Issue[]): Recommendation[] {
  const groupedByTitle = new Map<string, Issue[]>();

  for (const issue of issues) {
    const key = issue.recommendation;
    const group = groupedByTitle.get(key);
    if (group) {
      group.push(issue);
    } else {
      groupedByTitle.set(key, [issue]);
    }
  }

  const recommendations: Recommendation[] = [];

  for (const [recommendation, relatedIssues] of groupedByTitle.entries()) {
    // Calcular prioridad basada en la severidad más alta del grupo
    const maxSeverity = relatedIssues.reduce((max, issue) => {
      return SEVERITY_WEIGHT[issue.severity] > SEVERITY_WEIGHT[max]
        ? issue.severity
        : max;
    }, "low" as IssueSeverity);

    recommendations.push({
      priority: SEVERITY_WEIGHT[maxSeverity],
      title: relatedIssues[0].title,
      description: recommendation,
      issues: relatedIssues,
    });
  }

  // Ordenar por prioridad (más alta primero)
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations;
}

// --- Cálculo de puntuación ---

export function calculateScore(issues: Issue[]): number {
  if (issues.length === 0) return 100;

  let totalDeductions = 0;

  for (const issue of issues) {
    totalDeductions += SEVERITY_WEIGHT[issue.severity];
  }

  // Puntuación entre 0 y 100
  const score = Math.max(0, Math.min(100, 100 - totalDeductions));
  return Math.round(score);
}
