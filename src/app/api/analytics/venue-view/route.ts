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

  const { data: existing, error: readError } = await supabase
    .from("venue_page_views_daily")
    .select("views")
    .eq("date", date)
    .eq("venue_id", venue_id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });

  if (!existing) {
    const { error } = await supabase.from("venue_page_views_daily").insert({
      date,
      venue_id,
      views: 1,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("venue_page_views_daily")
    .update({ views: (existing.views ?? 0) + 1 })
    .eq("date", date)
    .eq("venue_id", venue_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

