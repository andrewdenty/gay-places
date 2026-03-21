"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface AdminCityImageUploadProps {
  cityId: string;
  citySlug: string;
  uploadAction: (formData: FormData) => Promise<void>;
}

export function AdminCityImageUpload({
  cityId,
  citySlug,
  uploadAction,
}: AdminCityImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string | null>(null);

  return (
    <form action={uploadAction} className="mt-4">
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="city_slug" value={citySlug} />
      <input
        ref={fileInputRef}
        type="file"
        name="image"
        accept="image/*"
        className="sr-only"
        required
        onChange={(e) => setFilename(e.target.files?.[0]?.name ?? null)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose image
        </Button>
        {filename && (
          <span className="max-w-xs truncate text-sm text-muted-foreground">
            {filename}
          </span>
        )}
        <Button
          type="submit"
          disabled={!filename}
          aria-label={filename ? "Upload image" : "Choose an image first to enable upload"}
        >
          Upload
        </Button>
      </div>
    </form>
  );
}
