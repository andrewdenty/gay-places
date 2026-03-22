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
  const formRef = useRef<HTMLFormElement>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      await uploadAction(formData);
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
      <input type="hidden" name="city_id" value={cityId} />
      <input type="hidden" name="city_slug" value={citySlug} />
      <input
        ref={fileInputRef}
        type="file"
        name="image"
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
          Choose image
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
