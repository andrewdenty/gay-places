import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = {
  name: string;
  cityName: string;
  cityId: string | null;
  citySlug: string | null;
  venueType: string;
  instagramUrl: string | null;
  websiteUrl: string | null;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, cityName, cityId, citySlug, venueType, instagramUrl, websiteUrl } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Place name is required." }, { status: 400 });
  }
  if (!cityName?.trim()) {
    return NextResponse.json({ error: "City is required." }, { status: 400 });
  }

  // Try to get authenticated user — anonymous submissions are allowed.
  const sessionClient = await createSupabaseServerClient();
  const { data: { user } } = await sessionClient.auth.getUser();

  const adminClient = createSupabaseAdminClient();

  // If city wasn't resolved client-side, do a server-side fuzzy match.
  let resolvedCityId = cityId;
  let resolvedCitySlug = citySlug;
  if (!resolvedCityId && cityName.trim()) {
    const { data: city } = await adminClient
      .from("cities")
      .select("id,slug")
      .eq("published", true)
      .ilike("name", cityName.trim())
      .maybeSingle();
    if (city) {
      resolvedCityId = city.id as string;
      resolvedCitySlug = city.slug as string;
    }
  }

  const proposed_data = {
    name: name.trim(),
    city_name: cityName.trim(),
    ...(resolvedCityId ? { city_id: resolvedCityId } : {}),
    ...(resolvedCitySlug ? { city_slug: resolvedCitySlug } : {}),
    venue_type: venueType,
    ...(instagramUrl ? { instagram_url: instagramUrl } : {}),
    ...(websiteUrl ? { website_url: websiteUrl } : {}),
  };

  const submitterId = user?.id ?? null;

  // Attempt 1: insert with submitter_id (null for anon once migration has run).
  const { data: submission, error: insertError } = await adminClient
    .from("submissions")
    .insert({
      kind: "new_venue",
      city_id: resolvedCityId ?? null,
      proposed_data,
      status: "pending",
      submitter_id: submitterId,
    })
    .select("id")
    .single();

  if (insertError) {
    // If the NOT NULL constraint fires (code 23502), the DB migration hasn't run yet.
    // Create a transient anonymous user via the admin API (works regardless of whether
    // client-side anonymous sign-in is enabled in the Supabase dashboard).
    if (insertError.code === "23502" && !submitterId) {
      const anonEmail = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}@anonymous.internal`;
      const { data: anonData, error: anonError } = await adminClient.auth.admin.createUser({
        email: anonEmail,
        email_confirm: true,
        user_metadata: { is_anonymous: true },
      });
      if (anonError || !anonData?.user) {
        console.error("[suggest] failed to create anon user:", anonError?.message);
        return NextResponse.json(
          { error: "Submission failed. Please try again." },
          { status: 500 },
        );
      }

      const { data: retryData, error: retryError } = await adminClient
        .from("submissions")
        .insert({
          kind: "new_venue",
          city_id: resolvedCityId ?? null,
          proposed_data,
          status: "pending",
          submitter_id: anonData.user.id,
        })
        .select("id")
        .single();

      if (retryError) {
        console.error("[suggest] retry insert failed:", retryError.message);
        return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, id: retryData.id });
    }

    console.error("[suggest] insert failed:", insertError.code, insertError.message);
    return NextResponse.json(
      { error: "Submission failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: submission.id });
}
