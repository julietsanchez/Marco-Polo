import { supabase } from "./supabase-client";

export async function fetchApi<T>(
  path: string,
  opts: {
    method?: "GET" | "POST";
    body?: unknown;
    params?: Record<string, string>;
  }
): Promise<T> {
  const { method = "GET", body, params } = opts;

  // Obtener token de sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No hay sesión activa. Por favor inicia sesión.");
  }

  const url = new URL(
    path,
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  );
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
  };
  if (body && method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body && method === "POST" ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as
    | { error?: string; details?: string }
    | T;

  if (!res.ok) {
    // Si es 401, redirigir a login
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
    }

    const obj =
      data !== null && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const err =
      obj && typeof obj.error === "string" ? obj.error : "Request failed";
    const details = obj && typeof obj.details === "string" ? obj.details : undefined;
    throw new Error(details ? `${err}: ${details}` : err);
  }

  return data as T;
}
