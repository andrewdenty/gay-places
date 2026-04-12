import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SuggestEditFlow } from "@/components/venue/suggest-edit-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Suggest an edit",
  robots: { index: false, follow: false },
};

export default async function SuggestEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: venue } = await supabase
    .from("venues")
    .select("id,name")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (!venue) notFound();

  return <SuggestEditFlow venueId={venue.id} venueName={venue.name} />;
}
