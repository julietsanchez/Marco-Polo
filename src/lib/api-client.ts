export async function fetchApi<T>(
  path: string,
  opts: {
    method?: "GET" | "POST";
    body?: unknown;
    apiKey: string | null;
    params?: Record<string, string>;
  }
): Promise<T> {
  const { method = "GET", body, apiKey, params } = opts;

  if (!apiKey) {
    throw new Error("Missing api key (?k=...)");
  }

  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  url.searchParams.set("k", apiKey);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {};
  if (body && method === "POST") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body && method === "POST" ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as
    | { error?: string; details?: string }
    | T;

  if (!res.ok) {
    const obj =
      data !== null && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const err =
      obj && typeof obj.error === "string" ? obj.error : "Request failed";
    const details = obj && typeof obj.details === "string" ? obj.details : undefined;
    throw new Error(details ? `${err}: ${details}` : err);
  }

  return data as T;
}
