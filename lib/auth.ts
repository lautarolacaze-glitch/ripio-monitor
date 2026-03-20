export const AUTH_COOKIE_NAME = "ripio_monitor_auth";

const TOKEN_SECRET = "ripio-monitor-internal-secret-key";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface TokenPayload {
  iat: number;
  exp: number;
  sub: string;
}

/**
 * Crea un token tipo JWT codificado en base64 con fecha de expiración.
 */
export function createToken(): string {
  const now = Date.now();
  const payload: TokenPayload = {
    iat: now,
    exp: now + TOKEN_EXPIRY_MS,
    sub: "dashboard-user",
  };

  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = Buffer.from(
    `${header}.${body}.${TOKEN_SECRET}`
  ).toString("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Verifica un token y retorna true si es válido y no ha expirado.
 */
export function verifyToken(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    const [header, body, signature] = parts;

    // Verificar firma
    const expectedSignature = Buffer.from(
      `${header}.${body}.${TOKEN_SECRET}`
    ).toString("base64url");

    if (signature !== expectedSignature) {
      return false;
    }

    // Decodificar y verificar expiración
    const payload: TokenPayload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf-8")
    );

    if (!payload.exp || payload.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
