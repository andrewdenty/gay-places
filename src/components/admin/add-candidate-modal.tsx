"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminModal } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";

const VENUE_TYPES = [
  "bar",
  "cafe",
  "club",
  "cocktail_bar",
  "dance_club",
  "drag_bar",
  "leather_bar",
  "restaurant",
  "sauna",
  "sex_club",
  "other",
];

const INPUT =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";
const SELECT =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";

type CityOption = {
  id: string;
  name: string;
  slug: string;
  country: string;
};

interface Props {
  cities: CityOption[];
}

export function AddCandidateModal({ cities }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClose() {
    setOpen(false);
    setError(null);
  }

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
      const res = await fetch("/api/admin/ingest/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Failed to create candidate");
      }
      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create candidate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Add manually
      </Button>

      <AdminModal isOpen={open} onClose={handleClose} title="Add place manually">
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
            <select name="city_slug" required className={SELECT} disabled={busy}>
              <option value="">Select city…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}, {c.country}
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
              {VENUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
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
