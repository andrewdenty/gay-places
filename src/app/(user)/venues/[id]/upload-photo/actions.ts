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
  const admin = createSupabaseAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build the query to find the submission
  let query = admin
    .from("submissions")
    .select("id, submitter_id, status")
    .eq("id", submissionId)
    .eq("status", "pending");

  // For authenticated users, verify they own the submission
  // For anonymous users (submitter_id = null), allow the update
  if (user) {
    query = query.eq("submitter_id", user.id);
  } else {
    // Anonymous users can only update submissions with null submitter_id
    query = query.is("submitter_id", null);
  }

  const { data: submission, error: fetchError } = await query.single();
  if (fetchError || !submission) {
    throw new Error("Submission not found or access denied");
  }

  // Update the submission with proposed data
  const { error: updateError } = await admin
    .from("submissions")
    .update({ proposed_data: proposedData })
    .eq("id", submissionId)
    .eq("status", "pending");
  if (updateError) throw updateError;

  // Auto-approve immediately only if:
  // 1. User is authenticated AND
  // 2. User is an admin AND
  // 3. Submission is from the authenticated user (not anonymous)
  if (user && submission.submitter_id === user.id) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin === true) {
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
  }

  // For non-admin authenticated users and all anonymous users,
  // the submission remains pending for admin review
  return { approved: false };
}
