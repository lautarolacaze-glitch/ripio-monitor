import { NextResponse } from "next/server";
import { createToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    const dashboardPassword = process.env.DASHBOARD_PASSWORD;

    if (!dashboardPassword) {
      console.error(
        "DASHBOARD_PASSWORD no está configurada en las variables de entorno"
      );
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    if (password !== dashboardPassword) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    const token = createToken();

    const response = NextResponse.json(
      { success: true, message: "Autenticación exitosa" },
      { status: 200 }
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 400 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada exitosamente" },
    { status: 200 }
  );

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
