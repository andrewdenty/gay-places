"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteVenue } from "./actions";
import { venueUrlPath } from "@/lib/slugs";

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
  updated_at?: string | null;
  cities: { name: string; slug: string } | null;
};

type SortOption = "alphabetical" | "newest" | "oldest";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "updated just now";
  if (mins < 60) return `updated ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `updated ${days}d ago`;
}

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
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = venues.filter((v) => {
      if (cityFilter && v.city_id !== cityFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      );
    });

    if (sortBy === "newest") {
      result.sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bTime - aTime;
      });
    } else if (sortBy === "oldest") {
      result.sort((a, b) => {
        const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return aTime - bTime;
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [venues, search, cityFilter, sortBy]);

  function handleDelete(venue: VenueRow) {
    if (
      !window.confirm(
        `Delete "${venue.name}"? This will permanently remove the place and cannot be undone.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteVenue(venue.id);
      setVenues((prev) => prev.filter((v) => v.id !== venue.id));
      showToast(`"${venue.name}" deleted`);
    });
  }

  return (
    <div className="mt-6">
      {/* Search + City filter + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search places…"
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
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="h-11 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm sm:w-48"
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="newest">Newest updates</option>
          <option value="oldest">Oldest updates</option>
        </select>
      </div>

      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
        {filtered.length} place{filtered.length !== 1 ? "s" : ""}
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
                  <Link
                    href={`/admin/venues/${v.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {v.name}
                  </Link>
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
                  {v.updated_at ? ` · ${timeAgo(v.updated_at)}` : ""}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDelete(v)}
                  disabled={isPending}
                  className="text-sm text-red-500 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
                <Link href={`/admin/venues/${v.slug}`}>
                  <Button size="sm" variant="secondary">Edit</Button>
                </Link>
                {v.cities?.slug && v.slug && (
                  <Link
                    href={venueUrlPath(v.cities.slug, v.venue_type, v.slug)}
                    target="_blank"
                  >
                    <Button size="sm" variant="secondary" className="flex items-center gap-1">
                      View <ExternalLink size={12} strokeWidth={1.5} />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
