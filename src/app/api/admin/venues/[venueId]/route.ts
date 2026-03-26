import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Allowlist of fields that can be patched via this endpoint. */
const PATCHABLE_FIELDS = new Set([
  "address",
  "lat",
  "lng",
  "website_url",
  "google_maps_url",
  "venue_tags",
  "opening_hours",
  "description_base",
  "description_editorial",
  "description_generation_status",
  "description_last_generated_at",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { fields?: unknown };
  try {
    body = (await request.json()) as { fields?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.fields !== "object" || body.fields === null) {
    return NextResponse.json({ error: "fields must be an object" }, { status: 400 });
  }

  const incoming = body.fields as Record<string, unknown>;

  // Filter to only allowed fields
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (PATCHABLE_FIELDS.has(key)) {
      update[key] = value;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("venues")
    .update(update)
    .eq("id", venueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/admin/venues/${venueId}`);

  return NextResponse.json({ ok: true });
}
