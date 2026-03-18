"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Photo = {
  id: string;
  storage_path: string;
};

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/venue-photos";

function photoUrl(storagePath: string) {
  return `${STORAGE_BASE}/${storagePath}`;
}

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = (index: number) => setLightboxIndex(index);
  const close = () => setLightboxIndex(null);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, prev, next]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxIndex]);

  return (
    <>
      {/* Thumbnail strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => open(i)}
            className="h-[112px] w-[112px] shrink-0 overflow-hidden bg-[var(--muted)] cursor-pointer"
            aria-label={`View photo ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photo.storage_path)}
              alt=""
              className="h-full w-full object-cover transition-opacity hover:opacity-80"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.5} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 label-xs text-white/50">
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Prev button */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
          )}

          {/* Image */}
          <div
            className="max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photos[lightboxIndex].storage_path)}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>

          {/* Next button */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center text-white/70 hover:text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight size={24} strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
