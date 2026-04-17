"use client";

import { useState, useEffect, useCallback } from "react";

type Photo = {
  id: string;
  storage_path: string;
};

type Props = {
  photos: Photo[];
  venueName: string;
};

const STORAGE_BASE =
  "https://oxdlypfblekvcsfarghv.supabase.co/storage/v1/object/public/venue-photos";

function photoUrl(storagePath: string) {
  return `${STORAGE_BASE}/${storagePath}`;
}

export function PhotoGallery({ photos, venueName }: Props) {
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
      <div
        className={[
          "mt-8 flex gap-2",
          photos.length >= 4 ? "overflow-x-auto scrollbar-none" : "",
        ].join(" ").trim()}
      >
        {photos.map((photo, i) => {
          // Mobile layout classes based on photo count (desktop always 112×112 squares)
          let sizeClass: string;
          if (photos.length === 1) {
            // Single photo: full width on mobile, square on desktop
            sizeClass = "h-[240px] w-full sm:h-[112px] sm:w-[112px] sm:shrink-0";
          } else if (photos.length <= 3) {
            // 2–3 photos: equal-width fill on mobile, square on desktop
            sizeClass = "h-[180px] flex-1 min-w-0 sm:h-[112px] sm:w-[112px] sm:flex-none sm:shrink-0";
          } else {
            // 4+ photos: fixed squares with horizontal scroll
            sizeClass = "h-[112px] w-[112px] shrink-0";
          }
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => open(i)}
              className={`overflow-hidden bg-[var(--muted)] cursor-pointer ${sizeClass}`}
              aria-label={`View photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl(photo.storage_path)}
                alt={`${venueName} photo ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-opacity hover:opacity-80"
              />
            </button>
          );
        })}
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="1" y1="1" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="17" y1="1" x2="1" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
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
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
                <path d="M9 1L1 9L9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
              alt={`${venueName} photo ${lightboxIndex + 1}`}
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
              <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
                <path d="M1 1L9 9L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
