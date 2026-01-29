import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/api/:path*"],
};

export async function middleware(req: NextRequest) {
  // El middleware solo protege las rutas API
  // La autenticación se verifica en cada ruta API individualmente
  // Las rutas de páginas se protegen en el cliente
  return NextResponse.next();
}
