import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { z } from "zod";

const BodySchema = z.object({
  balance: z.coerce.number(),
});

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError ?? "Authentication required" },
        { status: 401 }
      );
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { balance } = parsed.data;

    const supabase = getSupabase();
    const { error } = await supabase
      .from("app_state")
      .upsert(
        { id: 1, balance, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (error) {
      return NextResponse.json(
        { error: "Failed to update balance", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, balance });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Balance update error", details: message },
      { status: 500 }
    );
  }
}
