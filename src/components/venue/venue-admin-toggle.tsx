"use client";

/**
 * VenueAdminToggle
 *
 * A seamless inline edit toggle for admin users on the public venue page.
 * Renders nothing for non-admin visitors — all logic runs client-side so the
 * page can use ISR without baking user-specific data into the cached HTML.
 *
 * Design: A floating pill segmented control (View / Edit) anchored to the
 * top-right of the viewport, visible only once admin status is confirmed.
 * When "Edit" is activated, the form data is lazily fetched from the API and
 * the edit form replaces the view content with a smooth cross-fade.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { uploadVenuePhoto, deleteVenuePhoto } from "@/app/(admin)/admin/venues/[venueId]/actions";
import type { VenueData, CityData } from "@/components/admin/venue-edit-form";
import type { VenueTagCategory } from "@/lib/venue-tags";
import { InlineVenuePhotos } from "@/components/admin/inline-venue-photos";

// Lazy-load the edit form — never shipped to non-admin visitors.
const VenueEditForm = dynamic(
  () => import("@/components/admin/venue-edit-form").then((m) => m.VenueEditForm),
  { ssr: false, loading: () => <div className="py-8 text-sm text-muted-foreground">Loading editor…</div> },
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EditData {
  venue: VenueData;
  cities: CityData[];
  customTagOptions: Partial<Record<VenueTagCategory, string[]>>;
  cityTimezone: string | null;
  prevVenueId: string | null;
  nextVenueId: string | null;
  prevVenueName: string | null;
  nextVenueName: string | null;
  viewOnSitePath: string | null;
  photos: { id: string; storage_path: string }[];
}

interface Props {
  venueId: string;
  children: React.ReactNode;
}

// ─── Toggle pill ──────────────────────────────────────────────────────────────

function TogglePill({
  editMode,
  loading,
  onToggle,
}: {
  editMode: boolean;
  loading: boolean;
  onToggle: (mode: "view" | "edit") => void;
}) {
  return (
    <div
      className="admin-toggle-pill"
      role="group"
      aria-label="Page mode"
    >
      {/* Sliding indicator */}
      <div
        className="admin-toggle-indicator"
        style={{ transform: editMode ? "translateX(100%)" : "translateX(0)" }}
      />

      {/* View segment */}
      <button
        type="button"
        onClick={() => onToggle("view")}
        className={`admin-toggle-segment${!editMode ? " active" : ""}`}
        aria-pressed={!editMode}
        aria-label="View mode"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        View
      </button>

      {/* Edit segment */}
      <button
        type="button"
        onClick={() => onToggle("edit")}
        className={`admin-toggle-segment${editMode ? " active" : ""}`}
        aria-pressed={editMode}
        aria-label="Edit mode"
      >
        {loading ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="admin-toggle-spinner"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        )}
        Edit
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function VenueAdminToggle({ venueId, children }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [photos, setPhotos] = useState<{ id: string; storage_path: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<Element | null>(null);

  // Check admin status once on mount — same pattern as AdminVenueLink.
  useEffect(() => {
    setMounted(true);
    setHeaderSlot(document.getElementById("admin-toggle-portal"));
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supabase.rpc("is_admin");
        if (data === true) setIsAdmin(true);
      } catch {
        // Silently ignore — toggle simply won't appear.
      }
    })();
  }, []);

  const handleToggle = async (mode: "view" | "edit") => {
    if (mode === "edit") {
      if (!editData) {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/admin/venues/${venueId}/edit-data`);
          if (!res.ok) throw new Error(`Failed to load edit data (${res.status})`);
          const data = (await res.json()) as EditData;
          setEditData(data);
          setPhotos(data.photos ?? []);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
          return;
        }
        setLoading(false);
      }
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  };

  // Don't render anything for non-admins or before mount (SSR compat).
  if (!mounted || !isAdmin) return <>{children}</>;

  return (
    <>
      {/* Mobile: render toggle in the header slot via portal (left of search/menu) */}
      {headerSlot && createPortal(
        <TogglePill editMode={editMode} loading={loading} onToggle={handleToggle} />,
        headerSlot,
      )}

      {/* Desktop: fixed top-right container, hidden on mobile */}
      <div className="admin-toggle-container hidden sm:block">
        <TogglePill editMode={editMode} loading={loading} onToggle={handleToggle} />
      </div>

      {/* View content */}
      <div
        className="admin-mode-panel"
        aria-hidden={editMode}
        style={{
          opacity: editMode ? 0 : 1,
          pointerEvents: editMode ? "none" : undefined,
          position: editMode ? "absolute" : undefined,
          height: editMode ? 0 : undefined,
          overflow: editMode ? "hidden" : undefined,
        }}
      >
        {children}
      </div>

      {/* Edit content — only rendered once data is loaded */}
      {editData && (
        <div
          className="admin-mode-panel"
          aria-hidden={!editMode}
          style={{
            opacity: editMode ? 1 : 0,
            pointerEvents: editMode ? undefined : "none",
            position: editMode ? undefined : "absolute",
            height: editMode ? undefined : 0,
            overflow: editMode ? undefined : "hidden",
          }}
        >
          {/* Edit in admin link */}
          <div className="mt-6 flex justify-end">
            <Link
              href={`/admin/venues/${venueId}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit in admin ↗
            </Link>
          </div>

          <VenueEditForm
            {...editData}
            inline // hides the admin prev/next nav header — save bar style is unaffected
          />

          {/* Photos section */}
          <InlineVenuePhotos
            venueId={venueId}
            photos={photos}
            onPhotosChange={setPhotos}
            uploadAction={uploadVenuePhoto}
            deleteAction={deleteVenuePhoto}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
