"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateSubmissionWithData(
  submissionId: string,
  proposedData: {
    venue_id: string;
    caption: string;
    storage_path: string;
    filename: string;
  },
) {
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
}
