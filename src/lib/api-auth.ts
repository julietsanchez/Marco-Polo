import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Cliente de Supabase para verificar tokens en el servidor
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function getAuthenticatedUser(req: NextRequest): Promise<{
  user: { id: string; email?: string } | null;
  error: string | null;
}> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, error: "Missing or invalid authorization header" };
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: error?.message ?? "Invalid token" };
    }

    return { user: { id: user.id, email: user.email }, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Authentication error",
    };
  }
}

export function requireAuth(req: NextRequest): Response | null {
  // Esta función será usada de forma asíncrona, así que retornamos null
  // y la validación se hace en las rutas directamente
  return null;
}
