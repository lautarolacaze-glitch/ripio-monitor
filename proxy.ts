import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/_next", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isValidToken = authCookie ? verifyToken(authCookie) : false;

  // Si está en /login con cookie válida, redirigir a /
  if (pathname === "/login" && isValidToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si es ruta pública, permitir acceso
  if (isPublicPath(pathname)) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Si no tiene cookie válida, redirigir a /login
  if (!isValidToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "X-XSS-Protection",
    "1; mode=block"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
