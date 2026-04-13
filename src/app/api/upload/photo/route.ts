import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Authenticate the requesting user (if logged in)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const submissionId = String(formData.get("submission_id") ?? "").trim();
  const uploadPath = String(formData.get("upload_path") ?? "").trim();
  const sessionId = String(formData.get("session_id") ?? "").trim() || null;

  if (!file?.size || !submissionId || !uploadPath) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Enforce that photos may only land in the staging prefix
  if (!uploadPath.startsWith("staging/")) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  // Verify the submission belongs to this user/session and is still pending
  let submissionQuery = supabase
    .from("submissions")
    .select("id")
    .eq("id", submissionId)
    .eq("status", "pending");

  // For authenticated users, verify ownership via submitter_id
  if (user) {
    submissionQuery = submissionQuery.eq("submitter_id", user.id);
  } else {
    // For anonymous users, verify ownership via session_id
    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id required for anonymous uploads" },
        { status: 400 }
      );
    }
    submissionQuery = submissionQuery.eq("session_id", sessionId);
  }

  const { data: submission } = await submissionQuery.maybeSingle();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Use the service-role client to bypass Storage RLS
  const adminSupabase = createSupabaseAdminClient();
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: "Failed to read file data" }, { status: 400 });
  }

  const { error: uploadError } = await adminSupabase.storage
    .from("venue-photos")
    .upload(uploadPath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, storage_path: uploadPath });
}
