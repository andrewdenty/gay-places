"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function updateSubmissionWithData(
  submissionId: string,
  proposedData: {
    venue_id: string;
    caption: string;
    storage_path: string;
    filename: string;
  },
): Promise<{ approved: boolean }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("submissions")
    .update({ proposed_data: proposedData })
    .eq("id", submissionId)
    .eq("submitter_id", user.id)
    .eq("status", "pending");
  if (error) throw error;

  // Auto-approve immediately when the submitter is an admin.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin === true) {
    const admin = createSupabaseAdminClient();
    const dest = `public/${proposedData.venue_id}/${proposedData.filename}`;

    const { error: copyError } = await admin.storage
      .from("venue-photos")
      .copy(proposedData.storage_path, dest);
    if (copyError) throw copyError;

    await admin.storage.from("venue-photos").remove([proposedData.storage_path]);

    const { error: photoError } = await admin.from("venue_photos").insert({
      venue_id: proposedData.venue_id,
      storage_path: dest,
      caption: proposedData.caption,
      author_id: user.id,
    });
    if (photoError) throw photoError;

    const { error: approveError } = await admin
      .from("submissions")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", submissionId);
    if (approveError) throw approveError;

    return { approved: true };
  }

  return { approved: false };
}
