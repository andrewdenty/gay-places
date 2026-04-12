import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  enrichPlaceDetails,
  enrichTags,
  enrichOpeningHours,
  generateBaseDescriptionText,
  generateEditorialDescriptionText,
  generateUnifiedDescriptionText,
} from "@/lib/ai/venue-enrichment";

type Action =
  | "place_details"
  | "tags"
  | "opening_hours"
  | "base_description"
  | "editorial_description"
  | "unified_description";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Unauthorized" as const };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { supabase: null, error: "Forbidden" as const };
  return { supabase, error: null };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;

  const { supabase, error: authError } = await requireAdmin();
  if (!supabase) {
    return NextResponse.json({ error: authError }, {
      status: authError === "Unauthorized" ? 401 : 403,
    });
  }

  let body: { action?: unknown };
  try {
    body = (await request.json()) as { action?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = body.action as Action | undefined;

  const validActions: Action[] = [
    "place_details",
    "tags",
    "opening_hours",
    "base_description",
    "editorial_description",
    "unified_description",
  ];

  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${validActions.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    switch (action) {
      case "place_details": {
        const proposal = await enrichPlaceDetails(venueId, supabase);
        return NextResponse.json({ ok: true, action, proposal });
      }

      case "tags": {
        const proposal = await enrichTags(venueId, supabase);
        return NextResponse.json({ ok: true, action, proposal });
      }

      case "opening_hours": {
        const proposal = await enrichOpeningHours(venueId, supabase);
        return NextResponse.json({ ok: true, action, proposal });
      }

      case "base_description": {
        const proposal = await generateBaseDescriptionText(venueId, supabase);
        return NextResponse.json({ ok: true, action, proposal });
      }

      case "editorial_description": {
        const proposal = await generateEditorialDescriptionText(venueId, supabase);
        return NextResponse.json({ ok: true, action, proposal });
      }

      case "unified_description": {
        const { full, listing } = await generateUnifiedDescriptionText(venueId, supabase);
        return NextResponse.json({
          ok: true,
          action,
          proposal: {
            description_editorial: full,
            description_base: listing,
          },
        });
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
