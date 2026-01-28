import { NextRequest, NextResponse } from "next/server";
import { isValidAppSecret } from "@/lib/api-auth";

export const config = {
  matcher: ["/preview-secret", "/api/:path*"],
};

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path === "/preview-secret") {
    const secret = process.env.APP_SECRET ?? "preview-secret";
    const url = new URL("/", req.url);
    url.searchParams.set("k", secret);
    return NextResponse.redirect(url, 302);
  }

  if (path.startsWith("/api/")) {
    if (isValidAppSecret(req)) {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: "Unauthorized", message: "Missing or invalid x-app-secret / ?k=" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}
