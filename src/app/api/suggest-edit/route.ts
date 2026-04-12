import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = {
  venueId: string;
  editType: string;
  note: string;
  email: string | null;
};

const VALID_EDIT_TYPES = new Set([
  "incorrect_details",
  "wrong_hours",
  "wrong_links",
  "wrong_address",
  "place_closed",
  "other",
]);

// Edit types where the user note is optional
const OPTIONAL_NOTE_TYPES = new Set([
  "place_closed",
  "wrong_hours",
  "wrong_address",
]);

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { venueId, editType, note, email } = body;

  if (!venueId?.trim()) {
    return NextResponse.json({ error: "Venue ID is required." }, { status: 400 });
  }
  if (!editType || !VALID_EDIT_TYPES.has(editType)) {
    return NextResponse.json({ error: "Invalid edit type." }, { status: 400 });
  }
  if (!note?.trim() && !OPTIONAL_NOTE_TYPES.has(editType)) {
    return NextResponse.json(
      { error: "Please add a note about what needs changing." },
      { status: 400 },
    );
  }

  // Anonymous submissions are allowed — try to get session user, fall back to null.
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const adminClient = createSupabaseAdminClient();

  // Verify the venue exists and is published
  const { data: venue } = await adminClient
    .from("venues")
    .select("id,city_id")
    .eq("id", venueId)
    .eq("published", true)
    .maybeSingle();

  if (!venue) {
    return NextResponse.json({ error: "Venue not found." }, { status: 404 });
  }

  const proposed_data: Record<string, unknown> = {
    edit_type: editType,
    note: note.trim(),
    ...(email?.trim() ? { contact_email: email.trim() } : {}),
  };

  const submitterId = user?.id ?? null;

  const { data: submission, error: insertError } = await adminClient
    .from("submissions")
    .insert({
      kind: "edit_venue",
      venue_id: venueId,
      city_id: venue.city_id,
      proposed_data,
      status: "pending",
      submitter_id: submitterId,
    })
    .select("id")
    .single();

  if (insertError) {
    // If the NOT NULL constraint fires (code 23502) the DB migration hasn't run yet.
    // Create a transient anonymous user so the insert can succeed.
    if (insertError.code === "23502" && !submitterId) {
      const anonEmail = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}@anonymous.internal`;
      const { data: anonData, error: anonError } = await adminClient.auth.admin.createUser({
        email: anonEmail,
        email_confirm: true,
        user_metadata: { is_anonymous: true },
      });
      if (anonError || !anonData?.user) {
        return NextResponse.json(
          { error: "Submission failed. Please try again." },
          { status: 500 },
        );
      }

      const { data: retryData, error: retryError } = await adminClient
        .from("submissions")
        .insert({
          kind: "edit_venue",
          venue_id: venueId,
          city_id: venue.city_id,
          proposed_data,
          status: "pending",
          submitter_id: anonData.user.id,
        })
        .select("id")
        .single();

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true, id: retryData.id });
    }

    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: submission.id });
}
