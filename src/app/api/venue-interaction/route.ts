import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/venue-interaction?venue_id=...&session_id=...
 * Returns the existing interaction row for a session, or null if none.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const venue_id = searchParams.get("venue_id");
  const session_id = searchParams.get("session_id");

  if (!venue_id || !session_id) {
    return NextResponse.json(
      { error: "venue_id and session_id are required" },
      { status: 400 },
    );
  }

  if (!UUID_RE.test(venue_id) || !UUID_RE.test(session_id)) {
    return NextResponse.json(
      { error: "venue_id and session_id must be valid UUIDs" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("venue_interactions")
      .select("been_here, recommend, tag")
      .eq("venue_id", venue_id)
      .eq("session_id", session_id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ interaction: data });
  } catch (err) {
    console.error("venue-interaction fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/venue-interaction
 * Upserts a venue interaction for an anonymous session.
 *
 * Body: { venue_id, session_id, been_here, recommend, tag }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { venue_id, session_id, been_here, recommend, tag } = body as {
    venue_id: string;
    session_id: string;
    been_here: boolean;
    recommend: boolean;
    tag: string | null;
  };

  if (!venue_id || !session_id) {
    return NextResponse.json(
      { error: "venue_id and session_id are required" },
      { status: 400 },
    );
  }

  if (!UUID_RE.test(venue_id) || !UUID_RE.test(session_id)) {
    return NextResponse.json(
      { error: "venue_id and session_id must be valid UUIDs" },
      { status: 400 },
    );
  }

  // Validate tag value
  const VALID_TAGS = ["classic", "trending", "underrated"];
  if (tag && !VALID_TAGS.includes(tag)) {
    return NextResponse.json(
      { error: "tag must be one of: classic, trending, underrated" },
      { status: 400 },
    );
  }

  // If recommend is off, clear the tag
  const resolvedTag = recommend ? (tag ?? null) : null;

  try {
    const supabase = await createSupabaseServerClient();

    // Associate interaction with the authenticated user if one is present.
    // Anonymous sessions remain unaffected — user_id stays null.
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    const { error } = await supabase.from("venue_interactions").upsert(
      {
        venue_id,
        session_id,
        been_here: !!been_here,
        recommend: !!recommend,
        tag: resolvedTag,
        updated_at: new Date().toISOString(),
        ...(userId ? { user_id: userId } : {}),
      },
      { onConflict: "venue_id,session_id" },
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("venue-interaction upsert error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
