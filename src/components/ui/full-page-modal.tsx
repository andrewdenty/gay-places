"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * FullPageModal — reusable full-screen modal shell for multi-step flows.
 * Used for: suggest a venue, claim a venue, submit a change, etc.
 *
 * Intentionally NOT dismissible via the Escape key — callers handle their own
 * keyboard navigation internally (e.g. Escape to go back a step).
 *
 * `leftAction` renders on the left of the close button row (e.g. a Back button).
 * Passing nothing still reserves the space so the X button stays right-aligned.
 */
export function FullPageModal({
  children,
  onClose,
  leftAction,
}: {
  children: React.ReactNode;
  onClose: () => void;
  leftAction?: React.ReactNode;
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
      {/* Scrollable content — top-aligned, mirrors search modal vertical rhythm */}
      <div className="min-h-full px-4 pt-4 sm:pt-[15vh] pb-16">
        <div className="mx-auto w-full max-w-lg">

          {/* Header row: back button (left) + close button (right) */}
          <div className="flex items-center justify-between">
            {/* Left slot — always rendered to keep close button right-aligned */}
            <div className="min-w-[48px]">{leftAction}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#E4E4E1] hover:bg-[#F7F7F5] transition-colors"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Content — 48px below header on mobile, 32px on desktop */}
          <div className="mt-12 sm:mt-8">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
