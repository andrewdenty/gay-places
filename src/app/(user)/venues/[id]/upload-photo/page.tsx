import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PhotoUploader } from "@/components/photos/photo-uploader";
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
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">Upload a photo</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Photo for <span className="font-medium text-foreground">{venue.name}</span>.{" "}
          Your photo will be moderated before it appears publicly.
        </p>

        <Card className="mt-6 p-6">
          <PhotoUploader venueId={venue.id} onUpdateSubmission={updateSubmissionWithData} />
        </Card>
      </div>
    </Container>
  );
}

