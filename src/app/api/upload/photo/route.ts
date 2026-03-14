import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Authenticate the requesting user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const submissionId = String(formData.get("submission_id") ?? "").trim();
  const uploadPath = String(formData.get("upload_path") ?? "").trim();

  if (!file?.size || !submissionId || !uploadPath) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Enforce that photos may only land in the staging prefix
  if (!uploadPath.startsWith("staging/")) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  // Verify the submission belongs to this user and is still pending
  const { data: submission } = await supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("submitter_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Use the authenticated user's session to upload; storage RLS policy
  // "Users upload staged venue photos" authorizes this path+submission combination.
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read file data" }, { status: 400 });
  }

  const { error: uploadError } = await supabase.storage
    .from("venue-photos")
    .upload(uploadPath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, storage_path: uploadPath });
}
