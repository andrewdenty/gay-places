"use client";

/**
 * InlineVenuePhotos
 *
 * Photo management section for the inline venue edit view (on public venue pages).
 * Mirrors the photo section in the full admin venue page, but manages photos
 * via local state so the parent can stay in sync without a full page reload.
 */

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Photo = { id: string; storage_path: string };

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/venue-photos";

function isHeic(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
}

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
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to convert HEIC image. Please convert to JPEG manually or try a different browser."));
    };
    img.src = url;
  });
}

interface Props {
  venueId: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  uploadAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function InlineVenuePhotos({ venueId, photos, onPhotosChange, uploadAction, deleteAction }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setFilename(file.name);
    setUploadError(null);

    startTransition(async () => {
      try {
        let uploadFile = file;
        if (isHeic(file)) {
          uploadFile = await convertHeicToJpeg(file);
        }
        const fd = new FormData();
        fd.set("venue_id", venueId);
        fd.set("photo", uploadFile, uploadFile.name);
        await uploadAction(fd);
        // Refresh photos list from API
        const res = await fetch(`/api/admin/venues/${venueId}/edit-data`);
        if (res.ok) {
          const data = (await res.json()) as { photos?: Photo[] };
          onPhotosChange(data.photos ?? []);
        }
        setFilename(null);
        formRef.current?.reset();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  async function handleDelete(photo: Photo) {
    // Optimistic update
    onPhotosChange(photos.filter((p) => p.id !== photo.id));
    try {
      const fd = new FormData();
      fd.set("photo_id", photo.id);
      fd.set("storage_path", photo.storage_path);
      fd.set("venue_id", venueId);
      await deleteAction(fd);
    } catch {
      // Revert on failure by re-fetching
      const res = await fetch(`/api/admin/venues/${venueId}/edit-data`);
      if (res.ok) {
        const data = (await res.json()) as { photos?: Photo[] };
        onPhotosChange(data.photos ?? []);
      }
    }
  }

  return (
    <Card className="mt-6 p-6 mb-24">
      <div className="text-sm font-semibold">Photos</div>

      {photos.length > 0 ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${STORAGE_BASE}/${photo.storage_path}`}
                alt=""
                className="h-[90px] w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Delete photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No photos yet.</p>
      )}

      <form ref={formRef} className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          name="photo"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose photo
          </Button>
          {filename && (
            <span className="max-w-xs truncate text-sm text-muted-foreground">
              {isPending ? "Uploading…" : filename}
            </span>
          )}
        </div>
        {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
      </form>
    </Card>
  );
}
