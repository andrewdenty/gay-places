"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function submitReview(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const venue_id = getText(formData, "venue_id");
  const rating = Number(getText(formData, "rating"));
  const body = getText(formData, "body");
  if (!venue_id || !Number.isFinite(rating)) throw new Error("Invalid review");

  const { data: venue } = await supabase
    .from("venues")
    .select("id,city_id")
    .eq("id", venue_id)
    .maybeSingle();
  if (!venue) throw new Error("Venue not found");

  const proposed_data = { venue_id, rating, body };
  const { error } = await supabase.from("submissions").insert({
    kind: "new_review",
    venue_id,
    city_id: venue.city_id,
    proposed_data,
    status: "pending",
    submitter_id: user.id,
  });
  if (error) throw error;

  redirect("/account");
}

