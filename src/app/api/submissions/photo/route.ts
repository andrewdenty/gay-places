import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    venue_id?: string;
    caption?: string;
    filename?: string;
  };

  const venue_id = String(body.venue_id ?? "").trim();
  const caption = String(body.caption ?? "").trim();
  const filename = String(body.filename ?? "").trim();
  if (!venue_id || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id,city_id")
    .eq("id", venue_id)
    .maybeSingle();

  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const proposed_data = { venue_id, caption, filename };
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      kind: "new_photo",
      venue_id,
      city_id: venue.city_id,
      proposed_data,
      status: "pending",
      submitter_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const upload_path = `staging/${submission.id}/${filename}`;
  return NextResponse.json({ submission_id: submission.id, upload_path });
}

