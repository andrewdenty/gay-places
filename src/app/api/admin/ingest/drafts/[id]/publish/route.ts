import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VenueTags } from "@/lib/venue-tags";
import { extractListingSentence } from "@/lib/ai/prompts";
import { VENUE_TYPE_SET, type VenueTypeValue } from "@/lib/venue-types";

function toVenueType(v: unknown): VenueTypeValue {
  const s = typeof v === "string" ? v : "other";
  if (s === "dance club" || s === "dance_club") return "club";
  if (s === "cruising club" || s === "cruising_club") return "cruising";
  if (s === "sex_club" || s === "sex club") return "cruising";
  return VENUE_TYPE_SET.has(s) ? (s as VenueTypeValue) : "other";
}

function buildSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Verify admin via session
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin, error: adminErr } =
    await sessionClient.rpc("is_admin");
  if (adminErr || isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();

  // Fetch draft with candidate data
  const { data: draftRow, error: fetchErr } = await admin
    .from("ingest_drafts")
    .select(
      "id,status,draft,candidate_id,ingest_candidates(city_slug,city_name,country)",
    )
    .eq("id", id)
    .single();

  if (fetchErr || !draftRow) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Draft not found" },
      { status: 404 },
    );
  }

  const row = draftRow as unknown as {
    id: string;
    status: string;
    draft: Record<string, unknown>;
    candidate_id: string;
    ingest_candidates: {
      city_slug: string;
      city_name: string;
      country: string;
    } | null;
  };

  if (row.status === "published") {
    return NextResponse.json(
      { error: "Draft is already published" },
      { status: 400 },
    );
  }
  if (row.status === "dismissed") {
    return NextResponse.json(
      { error: "Draft has been dismissed" },
      { status: 400 },
    );
  }

  const draft = row.draft;
  const candidate = row.ingest_candidates;

  if (!candidate) {
    return NextResponse.json(
      { error: "Candidate data not found" },
      { status: 400 },
    );
  }

  // Validate required fields
  const name =
    typeof draft.name === "string" ? draft.name.trim() : "";
  const googleMapsUrl =
    typeof draft.google_maps_url === "string" ? draft.google_maps_url.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Draft is missing required field: name" },
      { status: 400 },
    );
  }
  if (!googleMapsUrl) {
    return NextResponse.json(
      { error: "Draft is missing required field: google_maps_url" },
      { status: 400 },
    );
  }

  try {
    // Resolve city_id and timezone
    const { data: city, error: cityErr } = await admin
      .from("cities")
      .select("id,timezone")
      .eq("slug", candidate.city_slug)
      .maybeSingle();

    if (cityErr) throw cityErr;
    if (!city) {
      throw new Error(
        `City "${candidate.city_slug}" not found. Add it in /admin/cities first.`,
      );
    }

    const baseSlug = buildSlug(name);
    const { data: existing } = await admin
      .from("venues")
      .select("id")
      .eq("city_id", city.id)
      .eq("slug", baseSlug)
      .maybeSingle();
    const slug = existing ? `${baseSlug}-${id.slice(0, 6)}` : baseSlug;

    const address =
      typeof draft.address === "string" ? draft.address.trim() : "";
    const lat =
      typeof draft.lat === "number" && isFinite(draft.lat) ? draft.lat : 0;
    const lng =
      typeof draft.lng === "number" && isFinite(draft.lng) ? draft.lng : 0;
    // New unified format: description = full paragraph; extract sentence 1 for listing.
    // Legacy format: summary_short = listing text; why_unique = editorial text.
    const unifiedDescription =
      typeof draft.description === "string" ? draft.description.trim() : null;
    const summaryShort = unifiedDescription
      ? extractListingSentence(unifiedDescription)
      : (typeof draft.summary_short === "string" ? draft.summary_short.trim() : "");
    const whyUnique = unifiedDescription
      ? unifiedDescription
      : (typeof draft.why_unique === "string" ? draft.why_unique.trim() : "");
    const venueTags =
      typeof draft.venue_tags === "object" && draft.venue_tags !== null
        ? (draft.venue_tags as VenueTags)
        : {};
    const openingHoursRaw =
      typeof draft.opening_hours === "object" && draft.opening_hours !== null
        ? (draft.opening_hours as Record<string, unknown>)
        : {};
    // Ensure tz is set from the city's timezone. The draft's tz may be missing
    // or defaulted to "UTC" when the enrichment couldn't determine the timezone.
    const cityTz = typeof city.timezone === "string" && city.timezone ? city.timezone : "UTC";
    const openingHours = {
      ...openingHoursRaw,
      tz: typeof openingHoursRaw.tz === "string" && openingHoursRaw.tz && openingHoursRaw.tz !== "UTC"
        ? openingHoursRaw.tz
        : cityTz,
    };
    const websiteUrl =
      typeof draft.website_url === "string" ? draft.website_url : null;
    const instagramUrl =
      typeof draft.instagram_url === "string" ? draft.instagram_url : null;
    const facebookUrl =
      typeof draft.facebook_url === "string" ? draft.facebook_url : null;

    // Create venue as published
    const { data: newVenue, error: insertErr } = await admin
      .from("venues")
      .insert({
        city_id: city.id,
        name,
        slug,
        address,
        lat,
        lng,
        venue_type: toVenueType(draft.venue_type),
        description: summaryShort,
        description_base: summaryShort,
        description_editorial: whyUnique || null,
        description_generation_status: "ai_draft",
        venue_tags: venueTags,
        tags: [],
        website_url: websiteUrl,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        google_maps_url: googleMapsUrl,
        opening_hours: openingHours,
        published: true,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // Mark draft as published
    const { error: draftUpdateErr } = await admin
      .from("ingest_drafts")
      .update({
        status: "published",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (draftUpdateErr) throw draftUpdateErr;

    const venueType = toVenueType(draft.venue_type);
    return NextResponse.json({ ok: true, venue_id: newVenue.id, city_slug: candidate.city_slug, venue_slug: slug, venue_type: venueType });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
