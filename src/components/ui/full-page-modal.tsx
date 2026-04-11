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
        backgroundColor: "color-mix(in srgb, var(--background) 96%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      {/* Close button — fixed top-right, aligned with content margins */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed top-5 right-4 sm:right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--foreground)] transition-colors hover:bg-[#E4E4E1]"
      >
        <X size={16} strokeWidth={1.75} />
      </button>

      {children}
    </div>
  );
}
