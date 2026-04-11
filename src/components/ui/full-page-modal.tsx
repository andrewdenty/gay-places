"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * FullPageModal — reusable full-screen modal shell for multi-step flows.
 * Used for: suggest a venue, claim a venue, submit a change, etc.
 *
 * Intentionally NOT dismissible via the Escape key — callers handle their own
 * keyboard navigation internally (e.g. Escape to go back a step).
 */
export function FullPageModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
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
      <div className="flex min-h-full flex-col">
        {/* Close button row — sticky, aligned with max-w-lg content column */}
        <div
          className="sticky top-0 z-10 px-4 pt-5 pb-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--background) 99%, transparent)",
          }}
        >
          <div className="mx-auto flex w-full max-w-lg justify-end">
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

        {/* Vertically centred content area */}
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
