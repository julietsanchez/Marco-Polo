import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") ?? "";
    const q = (searchParams.get("q") ?? "").trim();

    const supabase = getSupabase();
    let query = supabase
      .from("items")
      .select("*")
      .order("date", { ascending: false });

    if (q.length > 0) {
      query = query.ilike("description", `%${q}%`);
    }

    if (kind && kind !== "all") {
      if (kind === "income") {
        query = query.eq("kind", "movement").eq("movement_type", "income");
      } else if (kind === "expense") {
        query = query.eq("kind", "movement").eq("movement_type", "expense");
      } else if (
        ["movement", "recurring", "receivable", "payable"].includes(kind)
      ) {
        query = query.eq("kind", kind);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch history", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "History error", details: message },
      { status: 500 }
    );
  }
}
