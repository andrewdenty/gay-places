import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClaimFlow } from "@/components/venue/claim-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Claim this place",
  robots: { index: false, follow: false },
};

export default async function ClaimPage({
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

  return <ClaimFlow venueId={venue.id} venueName={venue.name} />;
}
