import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { z } from "zod";

const ItemSchema = z.object({
  kind: z.enum(["movement", "recurring", "receivable", "payable"]),
  movement_type: z.enum(["income", "expense"]).optional(),
  description: z.string().min(1),
  amount: z.number().positive(),
  status: z.enum(["open", "done"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional().nullable(),
  active: z.boolean().optional().nullable(),
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
    const parsed = ItemSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;

    if (d.kind === "movement" && !d.movement_type) {
      return NextResponse.json(
        { error: "movement_type required for kind movement" },
        { status: 400 }
      );
    }

    const row = {
      kind: d.kind,
      movement_type: d.kind === "movement" ? d.movement_type : null,
      description: d.description,
      amount: d.amount,
      status:
        d.kind === "receivable" || d.kind === "payable"
          ? d.status ?? "open"
          : null,
      date: d.date,
      note: d.note ?? null,
      active: d.kind === "recurring" ? (d.active ?? true) : null,
    };

    const supabase = getSupabase();
    const { data: item, error: insertErr } = await supabase
      .from("items")
      .insert(row)
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to create item", details: insertErr.message },
        { status: 500 }
      );
    }

    if (d.kind === "movement" && d.movement_type) {
      const { data: state } = await supabase
        .from("app_state")
        .select("balance")
        .eq("id", 1)
        .single();

      const current = Number(state?.balance ?? 0);
      const delta = d.movement_type === "income" ? d.amount : -d.amount;
      const nextBalance = current + delta;

      const { error: updErr } = await supabase
        .from("app_state")
        .upsert(
          {
            id: 1,
            balance: nextBalance,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (updErr) {
        return NextResponse.json(
          {
            error: "Item created but balance update failed",
            details: updErr.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Items create error", details: message },
      { status: 500 }
    );
  }
}
