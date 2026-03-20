// --- Rate Limiter ---

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;

  /**
   * @param windowMs - Ventana de tiempo en milisegundos
   * @param maxRequests - Máximo de solicitudes permitidas en la ventana
   */
  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Verifica si una IP puede realizar una solicitud.
   * Retorna true si está permitido, false si se excedió el límite.
   */
  check(ip: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(ip);

    // Limpiar entradas expiradas periódicamente
    if (this.requests.size > 1000) {
      this.cleanup();
    }

    if (!entry || now >= entry.resetTime) {
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Retorna los milisegundos restantes hasta que se resetee el límite para una IP.
   */
  getTimeToReset(ip: string): number {
    const entry = this.requests.get(ip);
    if (!entry) return 0;
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Limpia entradas expiradas del mapa.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        this.requests.delete(ip);
      }
    }
  }

  /**
   * Resetea el estado del rate limiter.
   */
  reset(): void {
    this.requests.clear();
  }
}

// --- Validación de URL ---

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0/,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^fd/,
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",
];

/**
 * Valida que una URL sea HTTP/HTTPS y no apunte a direcciones privadas o locales.
 * Retorna un objeto con el resultado de la validación y un mensaje de error si aplica.
 */
export function validateUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "La URL es requerida" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "La URL no tiene un formato válido" };
  }

  // Solo permitir HTTP y HTTPS
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Solo se permiten URLs con protocolo HTTP o HTTPS",
    };
  }

  // Verificar hostnames bloqueados
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return {
      valid: false,
      error: "No se permiten URLs a direcciones locales o privadas",
    };
  }

  // Verificar rangos de IP privadas
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) {
      return {
        valid: false,
        error: "No se permiten URLs a direcciones IP privadas",
      };
    }
  }

  return { valid: true };
}

// --- Sanitización de entrada ---

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

/**
 * Sanitiza un string para prevención básica de XSS.
 * Escapa caracteres HTML peligrosos.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Escapar caracteres HTML
  let sanitized = input.replace(
    /[&<>"'`/]/g,
    (char) => HTML_ENTITIES[char] || char
  );

  // Remover patrones peligrosos comunes
  sanitized = sanitized.replace(/javascript\s*:/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  sanitized = sanitized.replace(/data\s*:/gi, "");
  sanitized = sanitized.replace(/vbscript\s*:/gi, "");

  // Limitar longitud
  if (sanitized.length > 10_000) {
    sanitized = sanitized.substring(0, 10_000);
  }

  return sanitized.trim();
}
