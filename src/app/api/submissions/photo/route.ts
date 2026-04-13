import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = (await request.json()) as {
    venue_id?: string;
    caption?: string;
    filename?: string;
    session_id?: string;
    contact_email?: string;
  };

  const venue_id = String(body.venue_id ?? "").trim();
  const caption = String(body.caption ?? "").trim();
  const filename = String(body.filename ?? "").trim();
  const session_id = String(body.session_id ?? "").trim() || null;
  const contact_email = String(body.contact_email ?? "").trim() || null;

  if (!venue_id || !filename) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // For anonymous users, session_id is required
  if (!user && !session_id) {
    return NextResponse.json(
      { error: "session_id required for anonymous submissions" },
      { status: 400 }
    );
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

  // Authenticated users auto-approve; anonymous users need manual review
  const submission_payload = {
    kind: "new_photo",
    venue_id,
    city_id: venue.city_id,
    proposed_data,
    status: "pending",
    submitter_id: user?.id || null,
    session_id: user ? null : session_id,
    contact_email: user ? null : contact_email,
    approval_required: !user, // true for anonymous, false for authenticated
  };

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert(submission_payload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const upload_path = `staging/${submission.id}/${filename}`;
  return NextResponse.json({ submission_id: submission.id, upload_path });
}

