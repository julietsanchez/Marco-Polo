import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError ?? "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing item id" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data: item, error: fetchErr } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !item) {
      return NextResponse.json(
        { error: "Item not found", details: fetchErr?.message },
        { status: 404 }
      );
    }

    const kind = item.kind as string;
    if (kind !== "receivable" && kind !== "payable") {
      return NextResponse.json(
        { error: "Only receivable or payable can be completed" },
        { status: 400 }
      );
    }

    if (item.active === false) {
      return NextResponse.json(
        { error: "Item already completed" },
        { status: 400 }
      );
    }

    const amount = Number(item.amount);
    const desc = String(item.description);

    const { error: activeErr } = await supabase
      .from("items")
      .update({ active: false })
      .eq("id", id);

    if (activeErr) {
      return NextResponse.json(
        { error: "Failed to mark item completed", details: activeErr.message },
        { status: 500 }
      );
    }

    const prefix = kind === "receivable" ? "Cobro: " : "Pago: ";
    const movementType = kind === "receivable" ? "income" : "expense";
    const today = new Date().toISOString().slice(0, 10);

    const { error: movErr } = await supabase.from("items").insert({
      kind: "movement",
      movement_type: movementType,
      description: prefix + desc,
      amount,
      date: today,
      note: null,
      active: null,
    });

    if (movErr) {
      return NextResponse.json(
        { error: "Item marked completed but movement create failed", details: movErr.message },
        { status: 500 }
      );
    }

    const { data: state } = await supabase
      .from("app_state")
      .select("balance")
      .eq("id", 1)
      .single();

    const current = Number(state?.balance ?? 0);
    const delta = kind === "receivable" ? amount : -amount;
    const nextBalance = current + delta;

    const { error: balErr } = await supabase
      .from("app_state")
      .upsert(
        {
          id: 1,
          balance: nextBalance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (balErr) {
      return NextResponse.json(
        {
          error: "Item and movement ok but balance update failed",
          details: balErr.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Complete error", details: message },
      { status: 500 }
    );
  }
}
