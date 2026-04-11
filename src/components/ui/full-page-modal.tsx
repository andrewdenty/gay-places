"use client";

import { useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";

/**
 * FullPageModal — reusable full-screen modal shell for multi-step flows.
 * Used for: suggest a venue, claim a venue, submit a change, etc.
 *
 * Intentionally NOT dismissible via the Escape key — callers handle their own
 * keyboard navigation internally (e.g. Escape to go back a step).
 *
 * Header layout: 3-column grid — back button (left), center slot (e.g. progress
 * dots), close button (right). Back button is invisible when `showBack` is false
 * but still occupies space to keep the layout stable.
 */
export function FullPageModal({
  children,
  onClose,
  onBack,
  showBack = false,
  centerSlot,
}: {
  children: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
  showBack?: boolean;
  centerSlot?: React.ReactNode;
}) {
  // Prevent body scroll while the modal is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        backgroundColor: "color-mix(in srgb, var(--background) 99%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Scrollable content — header pinned to top, form content positioned lower */}
      <div className="min-h-full px-4 pt-4 pb-16">
        <div className="mx-auto w-full max-w-lg">

          {/* Header row: 3-column grid — back | center slot | close */}
          <div className="grid grid-cols-3 items-center">
            {/* Left: back button — same style as X, invisible when not shown */}
            <div>
              <button
                type="button"
                onClick={(e) => {
                  onBack?.();
                  (e.currentTarget as HTMLButtonElement).blur();
                }}
                aria-label="Go back"
                className={`flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#E4E4E1] hover:bg-[#F7F7F5] transition-colors ${
                  showBack ? "" : "pointer-events-none opacity-0"
                }`}
              >
                <ChevronLeft size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Center: progress dots or other slot */}
            <div className="flex justify-center">{centerSlot}</div>

            {/* Right: close button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#E4E4E1] hover:bg-[#F7F7F5] transition-colors"
              >
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Content — 48px below header on mobile; on desktop calc positions
              the form at ~15vh from the viewport top (matching search modal rhythm) */}
          <div className="mt-12 sm:mt-[calc(15vh-4rem)]">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
