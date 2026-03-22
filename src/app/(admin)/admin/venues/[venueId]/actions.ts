"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) redirect("/");
  return supabase;
}

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateVenueDetails(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");
  const city_id = getText(formData, "city_id");
  const name = getText(formData, "name");
  const address = getText(formData, "address");
  const lat = Number(getText(formData, "lat"));
  const lng = Number(getText(formData, "lng"));
  const venue_type = getText(formData, "venue_type") || "other";
  const description_base = getText(formData, "description_base") || null;
  const description_editorial = getText(formData, "description_editorial") || null;
  const website_url = getText(formData, "website_url") || null;
  const google_maps_url = getText(formData, "google_maps_url") || null;
  const instagram_url = getText(formData, "instagram_url") || null;
  const facebook_url = getText(formData, "facebook_url") || null;
  const published = formData.get("published") === "on";
  const closed = formData.get("closed") === "on";

  const venueTagsRaw = getText(formData, "venue_tags");
  let venue_tags: Record<string, unknown> = {};
  try {
    venue_tags = venueTagsRaw ? JSON.parse(venueTagsRaw) : {};
  } catch {
    // Keep empty if invalid JSON
  }

  const openingHoursRaw = getText(formData, "opening_hours");
  let opening_hours: Record<string, unknown> = {};
  try {
    opening_hours = openingHoursRaw ? JSON.parse(openingHoursRaw) : {};
  } catch {
    // Keep empty if invalid JSON
  }

  // Mark status as human_edited when an admin saves a non-empty editorial description.
  // When editorial is cleared, reset to 'generated' if a base description exists, otherwise leave unchanged.
  const descriptionBaseExists = !!description_base;
  const description_generation_status = description_editorial
    ? "human_edited"
    : descriptionBaseExists
      ? "generated"
      : undefined;

  const { error } = await supabase
    .from("venues")
    .update({
      city_id,
      name,
      address,
      lat,
      lng,
      venue_type,
      description_base,
      description_editorial,
      ...(description_generation_status !== undefined && {
        description_generation_status,
      }),
      website_url,
      google_maps_url,
      instagram_url,
      facebook_url,
      venue_tags,
      opening_hours,
      published,
      closed,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${id}`);
}

/**
 * Generate (or regenerate) a venue's base description (summary) using Gemini.
 * Produces a 1–3 sentence editorial summary matching the style used by the
 * ingest pipeline's summary_short field.
 */
export async function generateBaseDescription(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your environment variables.");
  }

  const { data: venue, error: fetchError } = await supabase
    .from("venues")
    .select("name,venue_type,venue_tags,city_id,cities(name,country)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const venueTags = (venue.venue_tags ?? {}) as Record<string, unknown>;
  const flatTags = Object.values(venueTags)
    .flatMap((v) => (Array.isArray(v) ? (v as string[]) : []));

  const venueTypeLabel =
    venue.venue_type === "club" ? "dance club"
    : venue.venue_type === "cafe" ? "café"
    : venue.venue_type === "event_space" ? "event space"
    : (venue.venue_type ?? "venue");

  const tagLine = flatTags.length > 0 ? ` Known for: ${flatTags.join(", ")}.` : "";

  const prompt = `You are a travel writer for Gay Places, an editorial guide to gay venues around the world. Your writing is authoritative, specific, and culturally aware — closer to Monocle or a boutique travel magazine than a nightlife directory.

Write a summary of 1–3 sentences about the following venue. This appears alongside a venue listing on a city page, so it needs to work at a glance. Lead with what makes the venue worth visiting — its character, crowd, design, history, or position in the city's scene. Be specific and concrete. Do not use: vibrant, iconic, legendary, must-visit, welcoming, lively, beloved, thriving, or any phrase that could apply to any venue in any city.

Venue: ${venue.name}
Type: ${venueTypeLabel}
City: ${cityRow?.name ?? ""}${cityRow?.country ? `, ${cityRow.country}` : ""}${tagLine}

Return ONLY the summary text — no labels, no quotes, no markdown.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 256,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini API returned HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (json.error) throw new Error(`Gemini API error: ${json.error.message ?? "Unknown"}`);

  const summary = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!summary) throw new Error("Gemini returned an empty response");

  const { error: updateError } = await supabase
    .from("venues")
    .update({
      description_base: summary,
      description_generation_status: "ai_draft",
      description_last_generated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw updateError;

  revalidatePath(`/admin/venues/${id}`);
}

/**
 * Generate (or regenerate) a venue's editorial description using Gemini.
 * Produces an in-depth editorial paragraph designed to appear after the
 * base summary on the venue detail page.
 */
export async function generateEditorialDescription(formData: FormData) {
  const supabase = await requireAdmin();
  const id = getText(formData, "id");

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your environment variables.");
  }

  const { data: venue, error: fetchError } = await supabase
    .from("venues")
    .select("name,venue_type,venue_tags,description_base,city_id,cities(name,country)")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!venue) throw new Error("Venue not found");

  const cityRow = venue.cities as unknown as { name: string; country: string } | null;
  const venueTags = (venue.venue_tags ?? {}) as Record<string, unknown>;
  const flatTags = Object.values(venueTags)
    .flatMap((v) => (Array.isArray(v) ? (v as string[]) : []));

  const venueTypeLabel =
    venue.venue_type === "club" ? "dance club"
    : venue.venue_type === "cafe" ? "café"
    : venue.venue_type === "event_space" ? "event space"
    : (venue.venue_type ?? "venue");

  const tagLine = flatTags.length > 0 ? ` Known for: ${flatTags.join(", ")}.` : "";
  const summaryLine = venue.description_base ? `\nExisting summary: ${venue.description_base}` : "";

  const prompt = `You are a travel writer for Gay Places, an editorial guide to gay venues around the world. Your writing is authoritative, specific, and culturally aware — closer to Monocle or a boutique travel magazine than a nightlife directory.

Write a single editorial paragraph of 3–5 sentences about the following venue. This paragraph appears on the venue page immediately after a short summary sentence, so it should go deeper — not repeat. Draw on the venue's character, crowd, programming, design, or role in the local scene. Write in prose, no lists or bullet points. Be specific and concrete. Do not use: vibrant, iconic, legendary, must-visit, welcoming, lively, beloved, thriving, or any phrase that could apply to any venue in any city.

Venue: ${venue.name}
Type: ${venueTypeLabel}
City: ${cityRow?.name ?? ""}${cityRow?.country ? `, ${cityRow.country}` : ""}${tagLine}${summaryLine}

Return ONLY the paragraph text — no labels, no quotes, no markdown.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini API returned HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (json.error) throw new Error(`Gemini API error: ${json.error.message ?? "Unknown"}`);

  const editorial = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!editorial) throw new Error("Gemini returned an empty response");

  const { error: updateError } = await supabase
    .from("venues")
    .update({
      description_editorial: editorial,
      description_generation_status: "ai_draft",
    })
    .eq("id", id);
  if (updateError) throw updateError;

  revalidatePath(`/admin/venues/${id}`);
}

export async function deleteVenueById(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const id = getText(formData, "id");

  // Delete photos from storage first
  const { data: photos } = await supabase
    .from("venue_photos")
    .select("storage_path")
    .eq("venue_id", id);

  if (photos && photos.length > 0) {
    await adminSupabase.storage
      .from("venue-photos")
      .remove(photos.map((p) => p.storage_path));
    await supabase.from("venue_photos").delete().eq("venue_id", id);
  }

  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function uploadVenuePhoto(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const venueId = getText(formData, "venue_id");
  const file = formData.get("photo") as File;

  if (!file?.size) return;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `public/${venueId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: storageError } = await adminSupabase.storage
    .from("venue-photos")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (storageError) throw storageError;

  const { error } = await supabase.from("venue_photos").insert({
    venue_id: venueId,
    storage_path: path,
  });
  if (error) throw error;

  revalidatePath(`/admin/venues/${venueId}`);
}

export async function deleteVenuePhoto(formData: FormData) {
  const supabase = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();
  const photoId = getText(formData, "photo_id");
  const storagePath = getText(formData, "storage_path");
  const venueId = getText(formData, "venue_id");

  await adminSupabase.storage.from("venue-photos").remove([storagePath]);
  const { error } = await supabase
    .from("venue_photos")
    .delete()
    .eq("id", photoId);
  if (error) throw error;

  revalidatePath(`/admin/venues/${venueId}`);
}
