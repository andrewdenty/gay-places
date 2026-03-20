import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";

const VALID_STATUSES = new Set(["draft", "ready_to_publish", "dismissed"]);
const VALID_TAGS_BY_CATEGORY: Record<string, Set<string>> = Object.fromEntries(
  TAG_CATEGORIES.map((cat) => [cat.key, new Set(cat.tags)]),
);

export async function PATCH(
  request: Request,
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Fetch current draft
  const { data: current, error: fetchErr } = await admin
    .from("ingest_drafts")
    .select("id,status,draft,notes")
    .eq("id", id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json(
      { error: fetchErr?.message ?? "Draft not found" },
      { status: 404 },
    );
  }

  const row = current as {
    id: string;
    status: string;
    draft: Record<string, unknown>;
    notes: string;
  };

  if (row.status === "published") {
    return NextResponse.json(
      { error: "Published drafts cannot be edited" },
      { status: 400 },
    );
  }

  // Merge the incoming draft fields with the existing draft
  const updatedDraft = { ...row.draft };

  if (typeof body.name === "string") {
    updatedDraft.name = body.name.trim();
  }
  if (typeof body.google_maps_url === "string") {
    updatedDraft.google_maps_url = body.google_maps_url.trim() || null;
  }
  if (typeof body.website_url === "string") {
    updatedDraft.website_url = body.website_url.trim() || null;
  }
  if (typeof body.instagram_url === "string") {
    updatedDraft.instagram_url = body.instagram_url.trim() || null;
  }
  if (typeof body.facebook_url === "string") {
    updatedDraft.facebook_url = body.facebook_url.trim() || null;
  }
  if (typeof body.summary_short === "string") {
    updatedDraft.summary_short = body.summary_short.trim();
  }
  if (typeof body.why_unique !== "undefined") {
    updatedDraft.why_unique = Array.isArray(body.why_unique)
      ? body.why_unique.filter(
          (s): s is string => typeof s === "string" && s.trim() !== "",
        )
      : [];
  }
  if (typeof body.opening_hours === "object" && body.opening_hours !== null) {
    updatedDraft.opening_hours = body.opening_hours;
  }
  if (typeof body.venue_tags === "object" && body.venue_tags !== null) {
    // Validate tags against allowlist
    const incomingTags = body.venue_tags as Record<string, unknown>;
    const validatedTags: VenueTags = {};
    for (const cat of TAG_CATEGORIES) {
      const catTags = Array.isArray(incomingTags[cat.key])
        ? (incomingTags[cat.key] as unknown[])
            .filter((t): t is string => typeof t === "string")
            .filter((t) => VALID_TAGS_BY_CATEGORY[cat.key]?.has(t))
        : [];
      if (catTags.length > 0) {
        validatedTags[cat.key] = catTags;
      }
    }
    updatedDraft.venue_tags = validatedTags;
  }

  // Validate required fields if name or google_maps_url were updated
  const updatedName =
    typeof updatedDraft.name === "string" ? updatedDraft.name.trim() : "";
  if (!updatedName) {
    return NextResponse.json(
      { error: "name cannot be empty" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = { draft: updatedDraft };

  if (typeof body.notes === "string") {
    updates.notes = body.notes;
  }
  if (typeof body.status === "string" && VALID_STATUSES.has(body.status)) {
    updates.status = body.status;
  }

  const { error: updateErr } = await admin
    .from("ingest_drafts")
    .update(updates)
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
