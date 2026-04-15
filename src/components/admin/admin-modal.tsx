"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
}: PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
}>) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Guard against SSR — document is always defined on the client and isOpen is
  // always false during server rendering, so this branch is never hit in practice.
  if (typeof document === "undefined") return null;

  // Portal to document.body so that CSS `transform` on ancestor elements
  // (e.g. the NavDrawer slide animation) does not confine `position: fixed`
  // children — transforms create a new containing block for fixed descendants.
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(23,23,23,0.35)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-x-4 top-[50%] z-50 mx-auto max-w-lg -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-lg sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2"
        style={{ maxHeight: "calc(100dvh - 48px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2
            id="modal-title"
            className="text-sm font-semibold tracking-tight"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 160px)" }}>
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
