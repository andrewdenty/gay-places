import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { venue_id?: string }
    | null;
  const venue_id = String(body?.venue_id ?? "").trim();
  if (!venue_id) return NextResponse.json({ error: "venue_id required" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Single atomic upsert via a SQL function — replaces the previous read-then-write
  // pattern that had a race condition under concurrent requests and used 2 round-trips.
  const { error } = await supabase.rpc("increment_venue_view", {
    p_venue_id: venue_id,
    p_date: date,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

