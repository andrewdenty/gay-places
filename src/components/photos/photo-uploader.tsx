"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_MB = 50;
const MAX_DIMENSION = 2560;
const OUTPUT_QUALITY = 0.9;

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

async function compressImage(file: File): Promise<File> {
  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg" });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    file = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        // No resize needed, but still re-encode as JPEG to reduce size
      } else if (width > height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedName = file.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], compressedName, { type: "image/webp" }));
        },
        "image/webp",
        OUTPUT_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload() {
    if (!file) return;
    setBusy(true);
    setStatus(null);
    try {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Photo must be under ${MAX_FILE_SIZE_MB} MB`);
      }

      setStatus("Compressing photo…");
      const compressed = await compressImage(file);

      // Step 1: Create the submission record and get the upload path.
      // Use the compressed file's name so the storage path extension matches
      // the actual content type (e.g. .webp, not .heic).
      setStatus(null);
      const createRes = await fetch("/api/submissions/photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          caption,
          filename: compressed.name,
        }),
      });
      const created = (await createRes.json()) as
        | { submission_id: string; upload_path: string }
        | { error: string };

      if (!createRes.ok || "error" in created) {
        throw new Error("error" in created ? created.error : "Upload failed");
      }

      // Step 2: Upload the file via the server endpoint (uses service-role key,
      //         bypassing Storage RLS)
      const uploadForm = new FormData();
      uploadForm.append("file", compressed);
      uploadForm.append("submission_id", created.submission_id);
      uploadForm.append("upload_path", created.upload_path);

      const uploadRes = await fetch("/api/upload/photo", {
        method: "POST",
        body: uploadForm,
      });
      let uploaded: { success?: boolean; error?: string };
      try {
        uploaded = await uploadRes.json();
      } catch {
        throw new Error("Upload failed");
      }
      if (!uploadRes.ok || uploaded.error) {
        throw new Error(uploaded.error ?? "Upload failed");
      }

      // Step 3: Record the storage path on the submission
      await onUpdateSubmission(created.submission_id, {
        venue_id: venueId,
        caption,
        storage_path: created.upload_path,
        filename: compressed.name,
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose photo
        </Button>
        {file && (
          <span className="max-w-xs truncate text-sm text-muted-foreground">
            {file.name}
          </span>
        )}
      </div>
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

