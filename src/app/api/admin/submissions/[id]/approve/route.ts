import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Submission = {
  id: string;
  kind: "new_venue" | "edit_venue" | "new_review" | "new_photo";
  status: "pending" | "approved" | "rejected";
  city_id: string | null;
  venue_id: string | null;
  submitter_id: string | null;
  proposed_data: Record<string, unknown>;
};

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
      // User-submitted venues go into the enrichment pipeline (ingest_candidates)
      // rather than publishing directly. This lets admin verify, add coordinates,
      // photos, and a full description before the venue goes live.
      const pd = s.proposed_data ?? {};
      const name = asString(pd.name) ?? "Untitled";
      const cityName = asString(pd.city_name) ?? asString(pd.name) ?? "";
      const citySlug = asString(pd.city_slug) ?? "";
      const country = asString(pd.country) ?? "";
      const venueType = asString(pd.venue_type) ?? "other";
      const instagramUrl = asString(pd.instagram_url);
      const websiteUrl = asString(pd.website_url);

      // Resolve city info if city_slug was stored but country wasn't.
      let resolvedCity: { name: string; slug: string; country: string } | null = null;
      if (citySlug) {
        const { data: city } = await admin
          .from("cities")
          .select("name,slug,country")
          .eq("slug", citySlug)
          .maybeSingle();
        if (city) resolvedCity = city as typeof resolvedCity;
      }

      const finalCityName = resolvedCity?.name ?? cityName;
      const finalCitySlug = resolvedCity?.slug ?? citySlug;
      const finalCountry = resolvedCity?.country ?? country;

      function buildGoogleSearchUrl(n: string, city: string, c: string) {
        return `https://www.google.com/search?q=${encodeURIComponent(`${n} ${city} ${c}`)}`;
      }
      function buildGoogleMapsSearchUrl(n: string, city: string, c: string) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${n} ${city} ${c}`)}`;
      }

      // Create a lightweight ingest_job to satisfy the FK constraint.
      const { data: job, error: jobErr } = await admin
        .from("ingest_jobs")
        .insert({
          type: "user_submission",
          status: "succeeded",
          params: { submission_id: s.id, city_name: finalCityName, city_slug: finalCitySlug },
          stats: { total_inserted: 1 },
          created_by: user.id,
          finished_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (jobErr) throw jobErr;

      const { error: candidateErr } = await admin.from("ingest_candidates").insert({
        job_id: job.id,
        status: "pending",
        city_slug: finalCitySlug,
        city_name: finalCityName,
        country: finalCountry,
        name,
        venue_type: venueType,
        address: null,
        website_url: websiteUrl,
        instagram_url: instagramUrl,
        google_search_url: buildGoogleSearchUrl(name, finalCityName, finalCountry),
        google_maps_search_url: buildGoogleMapsSearchUrl(name, finalCityName, finalCountry),
        source_links: [],
        confidence: "medium",
        notes: `Submitted by ${s.submitter_id ? `user ${s.submitter_id}` : "anonymous user"}`,
      });
      if (candidateErr) throw candidateErr;
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
      if (!s.submitter_id) throw new Error("Review requires an authenticated submitter");
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
        author_id: s.submitter_id ?? null,
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

