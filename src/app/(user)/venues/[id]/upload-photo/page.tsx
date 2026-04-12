import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoUploadFlow } from "@/components/photos/photo-upload-flow";
import { updateSubmissionWithData } from "./actions";

export const dynamic = "force-dynamic";

export default async function UploadPhotoPage({
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

  return (
    <PhotoUploadFlow
      venueId={venue.id}
      venueName={venue.name}
      onUpdateSubmission={updateSubmissionWithData}
    />
  );
}
