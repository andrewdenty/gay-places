"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteVenue } from "./actions";

type City = { id: string; name: string; slug: string };

export type VenueRow = {
  id: string;
  name: string;
  address: string;
  venue_type: string;
  published: boolean;
  closed: boolean | null;
  city_id: string;
  slug: string;
  cities: { name: string; slug: string } | null;
};

export function VenuesList({
  venues: initialVenues,
  cities,
}: {
  venues: VenueRow[];
  cities: City[];
}) {
  const [venues, setVenues] = useState(initialVenues);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return venues.filter((v) => {
      if (cityFilter && v.city_id !== cityFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      );
    });
  }, [venues, search, cityFilter]);

  function handleDelete(venue: VenueRow) {
    if (
      !window.confirm(
        `Delete "${venue.name}"? This will permanently remove the venue and cannot be undone.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteVenue(venue.id);
      setVenues((prev) => prev.filter((v) => v.id !== venue.id));
    });
  }

  return (
    <div className="mt-6">
      {/* Search + City filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues…"
          className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm sm:w-48"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
        {filtered.length} venue{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="mt-3 grid gap-2">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{v.name}</span>
                  {!v.published && (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                      Hidden
                    </span>
                  )}
                  {v.closed && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                      Closed
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {v.cities?.name}
                  {v.address ? ` · ${v.address}` : ""}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/venues/${v.slug}`}>
                  <Button size="sm">Edit</Button>
                </Link>
                {v.cities?.slug && v.slug && (
                  <Link
                    href={`/city/${v.cities.slug}/venue/${v.slug}`}
                    target="_blank"
                  >
                    <Button size="sm" variant="secondary">
                      View ↗
                    </Button>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(v)}
                  disabled={isPending}
                  className="text-sm text-red-500 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

