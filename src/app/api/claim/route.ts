import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = {
  venueId: string;
  name: string;
  email: string;
  role?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { venueId, name, email, role } = body;

  if (!venueId?.trim()) {
    return NextResponse.json({ error: "Venue is required." }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();

  // Verify the venue exists and is published.
  const { data: venue, error: venueError } = await adminClient
    .from("venues")
    .select("id")
    .eq("id", venueId.trim())
    .eq("published", true)
    .maybeSingle();

  if (venueError || !venue) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  const { error: insertError } = await adminClient
    .from("venue_claims")
    .insert({
      venue_id: venueId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role?.trim() ?? "",
    });

  if (insertError) {
    console.error("[claim] insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to submit claim. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
