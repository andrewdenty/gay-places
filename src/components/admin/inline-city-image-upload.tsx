"use client";

/**
 * InlineCityImageUpload
 *
 * Image upload form for the inline city edit view (on public city pages).
 * Works the same as AdminCityImageUpload but calls onUploaded after a
 * successful upload so the parent can update its local image_path state.
 */

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  cityId: string;
  citySlug: string;
  uploadAction: (formData: FormData) => Promise<void>;
  onUploaded?: (newStoragePath: string) => void;
}

export function InlineCityImageUpload({ cityId, citySlug, uploadAction, onUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFilename(file?.name ?? null);
    if (!file) return;

    startTransition(async () => {
      setError(null);
      try {
        const formData = new FormData();
        formData.set("city_id", cityId);
        formData.set("city_slug", citySlug);
        formData.set("image", file);
        await uploadAction(formData);
        setFilename(null);
        formRef.current?.reset();
        // Derive the new storage path to update local state immediately.
        // The server action uploads to `{cityId}/{timestamp}.{ext}` — since we
        // can't read the exact timestamp, we re-fetch the city's image_path.
        if (onUploaded) {
          const res = await fetch(`/api/admin/cities/${citySlug}/edit-data`);
          if (res.ok) {
            const data = (await res.json()) as { city?: { image_path?: string | null } };
            if (data.city?.image_path) onUploaded(data.city.image_path);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <form ref={formRef} className="mt-4">
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="city_slug" value={citySlug} />
      <input
        ref={fileInputRef}
        type="file"
        name="image"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload image
        </Button>
        {filename && (
          <span className="max-w-xs truncate text-sm text-muted-foreground">
            {isPending ? "Uploading…" : filename}
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
