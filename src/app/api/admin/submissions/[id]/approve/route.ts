import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Submission = {
  id: string;
  kind: "new_venue" | "edit_venue" | "new_review" | "new_photo";
  status: "pending" | "approved" | "rejected";
  city_id: string | null;
  venue_id: string | null;
  submitter_id: string;
  proposed_data: Record<string, unknown>;
};

type VenueType =
  | "bar"
  | "club"
  | "restaurant"
  | "cafe"
  | "sauna"
  | "event_space"
  | "other";

function asString(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

function asNumber(v: unknown): number | null {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim()
        ? Number(v)
        : NaN;
  return Number.isFinite(n) ? n : null;
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Verify admin using the user's session (RLS function).
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: isAdmin, error: isAdminError } = await sessionClient.rpc("is_admin");
  if (isAdminError || isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const { data: submission, error } = await admin
    .from("submissions")
    .select("id,kind,status,city_id,venue_id,submitter_id,proposed_data")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const s = submission as Submission;
  if (s.status !== "pending") {
    return NextResponse.json({ error: "Submission is not pending" }, { status: 400 });
  }

  try {
    if (s.kind === "new_venue") {
      const pd = s.proposed_data ?? {};
      const name = asString(pd.name) ?? "Untitled";
      const address = asString(pd.address) ?? "";
      const lat = asNumber(pd.lat) ?? 0;
      const lng = asNumber(pd.lng) ?? 0;
      const venue_type = (asString(pd.venue_type) ?? "other") as VenueType;
      const description = asString(pd.description) ?? "";
      const website_url = asString(pd.website_url);
      const google_maps_url = asString(pd.google_maps_url);
      const tags = asStringArray(pd.tags);

      if (!s.city_id) throw new Error("Missing city_id");

      const { error: insertError } = await admin.from("venues").insert({
        city_id: s.city_id,
        name,
        address,
        lat,
        lng,
        venue_type,
        description,
        website_url,
        google_maps_url,
        tags,
        opening_hours: pd.opening_hours ?? {},
        published: true,
      });
      if (insertError) throw insertError;
    }

    if (s.kind === "edit_venue") {
      if (!s.venue_id) throw new Error("Missing venue_id");
      const pd = s.proposed_data ?? {};
      const patch: Record<string, unknown> = {};

      for (const k of [
        "name",
        "address",
        "description",
        "website_url",
        "google_maps_url",
        "venue_type",
        "opening_hours",
      ] as const) {
        if (pd[k] !== undefined) patch[k] = pd[k];
      }
      if (pd.lat !== undefined) patch.lat = asNumber(pd.lat);
      if (pd.lng !== undefined) patch.lng = asNumber(pd.lng);
      if (pd.tags !== undefined) patch.tags = asStringArray(pd.tags);

      const { error: updateError } = await admin
        .from("venues")
        .update(patch)
        .eq("id", s.venue_id);
      if (updateError) throw updateError;
    }

    if (s.kind === "new_review") {
      if (!s.venue_id) throw new Error("Missing venue_id");
      const pd = s.proposed_data ?? {};
      const rating = asNumber(pd.rating);
      const body = asString(pd.body) ?? "";
      if (!rating) throw new Error("Missing rating");

      const { error: reviewError } = await admin.from("reviews").insert({
        venue_id: s.venue_id,
        author_id: s.submitter_id,
        rating,
        body,
      });
      if (reviewError) throw reviewError;
    }

    if (s.kind === "new_photo") {
      if (!s.venue_id) throw new Error("Missing venue_id");
      const pd = s.proposed_data ?? {};
      const source = asString(pd.storage_path);
      const filename = asString(pd.filename) ?? "photo";
      const caption = asString(pd.caption) ?? "";
      if (!source) throw new Error("Missing storage_path");

      const dest = `public/${s.venue_id}/${filename}`;
      const { error: copyError } = await admin.storage
        .from("venue-photos")
        .copy(source, dest);
      if (copyError) throw copyError;

      await admin.storage.from("venue-photos").remove([source]);

      const { error: photoError } = await admin.from("venue_photos").insert({
        venue_id: s.venue_id,
        storage_path: dest,
        caption,
        author_id: s.submitter_id,
      });
      if (photoError) throw photoError;
    }

    const { error: approveError } = await admin
      .from("submissions")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", s.id);
    if (approveError) throw approveError;

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Approve failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

