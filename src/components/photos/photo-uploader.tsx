"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

interface PhotoUploaderProps {
  venueId: string;
  onUpdateSubmission: (
    submissionId: string,
    proposedData: {
      venue_id: string;
      caption: string;
      storage_path: string;
      filename: string;
    },
  ) => Promise<void>;
}

export function PhotoUploader({ venueId, onUpdateSubmission }: PhotoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      const createRes = await fetch("/api/submissions/photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          caption,
          filename: file.name,
        }),
      });
      const created = (await createRes.json()) as
        | { submission_id: string; upload_path: string }
        | { error: string };

      if (!createRes.ok || "error" in created) {
        throw new Error("error" in created ? created.error : "Upload failed");
      }

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("venue-photos")
        .upload(created.upload_path, file, { upsert: false });
      if (uploadError) throw uploadError;

      await onUpdateSubmission(created.submission_id, {
        venue_id: venueId,
        caption,
        storage_path: created.upload_path,
        filename: file.name,
      });

      setStatus("Uploaded. Your photo is now pending moderation.");
      setFile(null);
      setCaption("");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 overflow-hidden">
      <input
        type="file"
        accept="image/*"
        className="w-full min-w-0"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional)"
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
      />
      <Button type="button" onClick={onUpload} disabled={!file || busy}>
        {busy ? "Uploading…" : "Upload for moderation"}
      </Button>
      {status ? <div className="text-sm text-muted-foreground">{status}</div> : null}
    </div>
  );
}

