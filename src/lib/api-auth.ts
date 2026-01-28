import { NextRequest } from "next/server";

const APP_SECRET = process.env.APP_SECRET;

export function isValidAppSecret(req: NextRequest): boolean {
  if (!APP_SECRET || APP_SECRET.length === 0) {
    return false;
  }
  const header = req.headers.get("x-app-secret");
  if (header !== null && header === APP_SECRET) {
    return true;
  }
  const param = req.nextUrl.searchParams.get("k");
  return param !== null && param === APP_SECRET;
}

export function requireAppSecret(req: NextRequest): Response | null {
  if (isValidAppSecret(req)) return null;
  return new Response(
    JSON.stringify({ error: "Unauthorized", message: "Missing or invalid x-app-secret / ?k=" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
