import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { runDiscovery } from "@data-pipeline/jobs/run-discovery";
import { CITY_REGISTRY } from "@data-pipeline/config/cities";
import { DISCOVERY_SOURCES } from "@data-pipeline/discovery/index";

/**
 * POST /api/admin/jobs/discover
 *
 * Triggers a venue discovery run from the admin interface.
 * Runs inline — suitable for single-city scans.
 * For full multi-city scans, use the nightly GitHub Actions workflow.
 *
 * Body (all optional):
 *   cities  — array of city slugs to scan (default: all)
 *   sources — array of source IDs to use  (default: all)
 */
export async function POST(request: Request) {
  // Verify admin via session.
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin, error: adminErr } = await sessionClient.rpc("is_admin");
  if (adminErr || isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse and validate the request body.
  let body: { cities?: unknown; sources?: unknown } = {};
  try {
    body = (await request.json()) as { cities?: unknown; sources?: unknown };
  } catch {
    // Empty body is fine — defaults will be used.
  }

  const validCitySlugs = new Set(CITY_REGISTRY.map((c) => c.slug));
  const validSourceIds = new Set(DISCOVERY_SOURCES.map((s) => s.id));

  const cities =
    Array.isArray(body.cities) &&
    body.cities.every((c) => typeof c === "string" && validCitySlugs.has(c))
      ? (body.cities as string[])
      : undefined;

  const sources =
    Array.isArray(body.sources) &&
    body.sources.every((s) => typeof s === "string" && validSourceIds.has(s))
      ? (body.sources as string[])
      : undefined;

  const supabase = createSupabaseAdminClient();

  try {
    const result = await runDiscovery({
      supabase,
      cities,
      sources,
      triggeredBy: "admin",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Discovery failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/admin/jobs/discover
 *
 * Returns the list of available sources and cities.
 */
export async function GET() {
  const sessionClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: isAdmin, error: adminErr } = await sessionClient.rpc("is_admin");
  if (adminErr || isAdmin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    sources: DISCOVERY_SOURCES.map((s) => ({ id: s.id, name: s.displayName, baseUrl: s.baseUrl })),
    cities: CITY_REGISTRY.map((c) => ({ slug: c.slug, name: c.name, country: c.country })),
  });
}
