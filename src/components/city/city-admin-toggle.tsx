"use client";

/**
 * CityAdminToggle
 *
 * A seamless inline edit toggle for admin users on the public city page.
 * Mirrors the VenueAdminToggle pattern — client-side admin check, lazy data
 * fetch, cross-fade transition between view and edit modes.
 */

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { CityData } from "@/components/admin/city-edit-form";

// Lazy-load the edit form — never shipped to non-admin visitors.
const CityEditForm = lazy(() =>
  import("@/components/admin/city-edit-form").then((m) => ({
    default: m.CityEditForm,
  })),
);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EditData {
  city: CityData;
  countryOptions: { name: string }[];
}

interface Props {
  citySlug: string;
  children: React.ReactNode;
}

// ─── Toggle pill (shared design) ──────────────────────────────────────────────

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
      <div
        className="admin-toggle-indicator"
        style={{ transform: editMode ? "translateX(100%)" : "translateX(0)" }}
      />

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

export function CityAdminToggle({ citySlug, children }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const adminChecked = useRef(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supabase.rpc("is_admin");
        if (data === true) setIsAdmin(true);
      } catch {
        // Silently ignore.
      } finally {
        adminChecked.current = true;
      }
    })();
  }, []);

  const handleToggle = async (mode: "view" | "edit") => {
    if (mode === "edit") {
      if (!editData) {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(`/api/admin/cities/${citySlug}/edit-data`);
          if (!res.ok) throw new Error(`Failed to load edit data (${res.status})`);
          const data = (await res.json()) as EditData;
          setEditData(data);
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

  if (!mounted || !isAdmin) return <>{children}</>;

  return (
    <>
      <div className="admin-toggle-container" style={{ opacity: mounted ? 1 : 0 }}>
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

      {/* Edit content */}
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
          <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading editor…</div>}>
            <CityEditForm
              city={editData.city}
              countryOptions={editData.countryOptions}
              inline
            />
          </Suspense>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
