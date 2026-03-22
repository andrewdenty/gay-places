"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

// Convert a HEIC/HEIF file to JPEG via canvas.
// Works natively on Safari (macOS/iOS). Rejects on other browsers.
async function convertHeicToJpeg(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          "HEIC photos can only be uploaded from Safari. Please use Safari or convert the photo to JPEG first.",
        ),
      );
    };
    img.src = url;
  });
}

interface AdminPhotoUploadProps {
  venueId: string;
  uploadAction: (formData: FormData) => Promise<void>;
}

export function AdminPhotoUpload({
  venueId,
  uploadAction,
}: AdminPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const rawFormData = new FormData(e.currentTarget);
      const file = rawFormData.get("photo") as File | null;
      if (!file?.size) return;

      if (isHeic(file)) {
        const converted = await convertHeicToJpeg(file);
        rawFormData.set("photo", converted, converted.name);
      }

      await uploadAction(rawFormData);
      setFilename(null);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4">
      <input type="hidden" name="venue_id" value={venueId} />
      <input
        ref={fileInputRef}
        type="file"
        name="photo"
        accept="image/*"
        className="sr-only"
        required
        onChange={(e) => {
          const selected = e.target.files?.[0] ?? null;
          setFilename(selected?.name ?? null);
          if (selected) formRef.current?.requestSubmit();
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose photo
        </Button>
        {filename && (
          <span className="max-w-xs truncate text-sm text-muted-foreground">
            {busy ? "Uploading…" : filename}
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
