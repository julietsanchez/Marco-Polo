import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import type { DashboardData } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError ?? "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const { data: state, error: stateErr } = await supabase
      .from("app_state")
      .select("balance")
      .eq("id", 1)
      .single();

    if (stateErr && stateErr.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to fetch balance", details: stateErr.message },
        { status: 500 }
      );
    }

    const balance = state?.balance ?? 0;

    const { data: recurring, error: recErr } = await supabase
      .from("items")
      .select("*")
      .eq("kind", "recurring")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (recErr) {
      return NextResponse.json(
        { error: "Failed to fetch recurring", details: recErr.message },
        { status: 500 }
      );
    }

    const recurringList = recurring ?? [];
    const recurringTotal = recurringList.reduce((s, i) => s + Number(i.amount), 0);

    const { data: receivable, error: recvErr } = await supabase
      .from("items")
      .select("*")
      .eq("kind", "receivable")
      .eq("active", true)
      .order("date", { ascending: false });

    if (recvErr) {
      return NextResponse.json(
        { error: "Failed to fetch receivable", details: recvErr.message },
        { status: 500 }
      );
    }

    const receivableList = receivable ?? [];
    const receivableTotal = receivableList.reduce(
      (s, i) => s + Number(i.amount),
      0
    );

    const { data: payable, error: payErr } = await supabase
      .from("items")
      .select("*")
      .eq("kind", "payable")
      .eq("active", true)
      .order("date", { ascending: false });

    if (payErr) {
      return NextResponse.json(
        { error: "Failed to fetch payable", details: payErr.message },
        { status: 500 }
      );
    }

    const payableList = payable ?? [];
    const payableTotal = payableList.reduce((s, i) => s + Number(i.amount), 0);

    const payload: DashboardData = {
      balance,
      recurringTotal,
      recurringList,
      receivableTotal,
      receivableList,
      payableTotal,
      payableList,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Dashboard error", details: message },
      { status: 500 }
    );
  }
}
