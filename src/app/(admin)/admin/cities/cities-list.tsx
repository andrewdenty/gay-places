"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeSearch } from "@/lib/normalize-search";

type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  published: boolean;
};

export function CitiesList({ cities }: { cities: CityRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search.trim());
    if (!q) return cities;
    return cities.filter(
      (c) =>
        normalizeSearch(c.name).includes(q) ||
        normalizeSearch(c.country).includes(q) ||
        normalizeSearch(c.slug).includes(q),
    );
  }, [cities, search]);

  return (
    <div className="mt-6">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search cities…"
        className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <div className="mt-2 text-xs text-[var(--muted-foreground)]">
        {filtered.length} cit{filtered.length !== 1 ? "ies" : "y"}
      </div>

      <div className="mt-3 grid gap-2">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/cities/${c.slug}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  {!c.published && (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {c.slug} · {c.country}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/cities/${c.slug}`}>
                  <Button size="sm" variant="secondary">Edit</Button>
                </Link>
                <Link href={`/city/${c.slug}`} target="_blank">
                  <Button size="sm" variant="secondary">View ↗</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">
            {search ? "No cities match your search." : "No cities yet. Create one above."}
          </p>
        )}
      </div>
    </div>
  );
}
