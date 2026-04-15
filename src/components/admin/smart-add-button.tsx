"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminModal } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { VENUE_TYPES } from "@/lib/venue-types";

const INPUT =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";
const SELECT =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";

type CityOption = {
  id: string;
  name: string;
  slug: string;
  country?: string;
};

interface SmartAddButtonProps {
  /** Pre-loaded cities; if omitted the component fetches them on open. */
  cities?: CityOption[];
  /** Pre-select a city slug when the modal opens. */
  defaultCitySlug?: string;
  /** Button label override. */
  label?: string;
  /** Button variant. */
  variant?: "primary" | "secondary" | "ghost";
  /** Button size. */
  size?: "sm" | "md";
  /** Extra class names for the trigger button. */
  className?: string;
  /** Called before the modal opens (e.g. close a parent drawer). */
  onBeforeOpen?: () => void;
  /** Render a custom trigger instead of the default Button. Return a clickable element. */
  renderTrigger?: (props: { onClick: () => void }) => React.ReactNode;
}

export function SmartAddButton({
  cities: citiesProp,
  defaultCitySlug,
  label = "Add a place",
  variant = "primary",
  size = "md",
  className,
  renderTrigger,
  onBeforeOpen,
}: SmartAddButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<CityOption[]>(citiesProp ?? []);
  const [citiesLoaded, setCitiesLoaded] = useState(!!citiesProp?.length);
  const { showToast } = useToast();

  // Fetch cities on first open if not provided via props
  useEffect(() => {
    if (open && !citiesLoaded) {
      setCitiesLoaded(true);
      fetch("/api/cities")
        .then((r) => r.json())
        .then((data: CityOption[]) => setCities(data))
        .catch(() => {});
    }
  }, [open, citiesLoaded]);

  // Keep prop-supplied cities in sync
  useEffect(() => {
    if (citiesProp?.length) {
      setCities(citiesProp);
      setCitiesLoaded(true);
    }
  }, [citiesProp]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      name: String(data.get("name") ?? "").trim(),
      city_slug: String(data.get("city_slug") ?? "").trim(),
      venue_type: String(data.get("venue_type") ?? "").trim(),
      address: String(data.get("address") ?? "").trim() || undefined,
      website_url: String(data.get("website_url") ?? "").trim() || undefined,
    };

    try {
      // Step 1: Create the candidate
      const res = await fetch("/api/admin/ingest/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to create candidate");
      }

      const candidateId = json.id;

      // Step 2: Close modal
      handleClose();

      // Step 3: Trigger enrichment in the background (fire-and-forget)
      if (candidateId) {
        fetch("/api/admin/ingest/enrich", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ candidate_ids: [candidateId] }),
        }).catch(() => {
          // Enrichment failure is non-blocking
        });
      }

      // Step 4: Show toast with link to publish tab
      showToast(
        <span>
          Place added &amp; enrichment started.{" "}
          <Link
            href="/admin/research/publish"
            className="underline underline-offset-2 font-medium"
          >
            Review and publish venue →
          </Link>
        </span>,
        "success",
        { duration: 15000, dismissOnNavigate: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create candidate");
    } finally {
      setBusy(false);
    }
  }

  const handleOpen = useCallback(() => {
    onBeforeOpen?.();
    setOpen(true);
  }, [onBeforeOpen]);

  return (
    <>
      {renderTrigger ? (
        renderTrigger({ onClick: handleOpen })
      ) : (
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          onClick={handleOpen}
        >
          {label}
        </Button>
      )}

      <AdminModal isOpen={open} onClose={handleClose} title="Add place">
        <form onSubmit={handleSubmit} className="grid gap-3 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Eagle Berlin"
              className={INPUT}
              disabled={busy}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              City <span className="text-destructive">*</span>
            </label>
            <select
              name="city_slug"
              required
              className={SELECT}
              disabled={busy}
              defaultValue={defaultCitySlug ?? ""}
            >
              <option value="">Select city…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}{c.country ? `, ${c.country}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Venue type <span className="text-destructive">*</span>
            </label>
            <select name="venue_type" required className={SELECT} disabled={busy}>
              <option value="">Select type…</option>
              {VENUE_TYPES.map((vt) => (
                <option key={vt.value} value={vt.value}>
                  {vt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Address{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              name="address"
              type="text"
              placeholder="e.g. Luckenwalder Str. 23, Berlin"
              className={INPUT}
              disabled={busy}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Website URL{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              name="website_url"
              type="url"
              placeholder="https://…"
              className={INPUT}
              disabled={busy}
            />
          </div>

          {error && (
            <div className="sm:col-span-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add place"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
