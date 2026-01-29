import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { z } from "zod";

const EditItemSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().optional().nullable(),
  movement_type: z.enum(["income", "expense"]).optional(),
  active: z.boolean().optional().nullable(),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError ?? "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
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

    if (item.kind === "movement") {
      const { data: state } = await supabase
        .from("app_state")
        .select("balance")
        .eq("id", 1)
        .single();
      const current = Number(state?.balance ?? 0);
      const amount = Number(item.amount);
      const delta =
        item.movement_type === "income" ? -amount : amount;
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
          { error: "Balance update failed", details: balErr.message },
          { status: 500 }
        );
      }
    }

    const { error: delErr } = await supabase.from("items").delete().eq("id", id);
    if (delErr) {
      return NextResponse.json(
        { error: "Failed to delete item", details: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Delete error", details: message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError ?? "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    const raw = await req.json();
    const parsed = EditItemSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const d = parsed.data;
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
    const isMovement = kind === "movement";

    if (isMovement) {
      const oldAmount = Number(item.amount);
      const oldType = (item.movement_type as string) ?? "expense";
      const newAmount = d.amount ?? oldAmount;
      const newType = d.movement_type ?? oldType;
      const oldDelta = oldType === "income" ? oldAmount : -oldAmount;
      const newDelta = newType === "income" ? newAmount : -newAmount;
      const balanceDelta = newDelta - oldDelta;

      if (balanceDelta !== 0) {
        const { data: state } = await supabase
          .from("app_state")
          .select("balance")
          .eq("id", 1)
          .single();
        const current = Number(state?.balance ?? 0);
        const nextBalance = current + balanceDelta;
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
            { error: "Balance update failed", details: balErr.message },
            { status: 500 }
          );
        }
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (d.description !== undefined) updatePayload.description = d.description;
    if (d.amount !== undefined) updatePayload.amount = d.amount;
    if (d.date !== undefined) updatePayload.date = d.date;
    if (d.note !== undefined) updatePayload.note = d.note;
    if (d.movement_type !== undefined && isMovement)
      updatePayload.movement_type = d.movement_type;
    if (
      (kind === "recurring" || kind === "receivable" || kind === "payable") &&
      d.active !== undefined
    ) {
      updatePayload.active = d.active;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ ok: true, item });
    }

    const { data: updated, error: updErr } = await supabase
      .from("items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json(
        { error: "Failed to update item", details: updErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Patch error", details: message },
      { status: 500 }
    );
  }
}
