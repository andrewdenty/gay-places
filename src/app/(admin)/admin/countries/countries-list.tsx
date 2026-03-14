"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteCountry } from "./actions";

export type CountryRow = {
  id: string;
  slug: string;
  name: string;
};

export function CountriesList({
  countries: initialCountries,
}: {
  countries: CountryRow[];
}) {
  const [countries, setCountries] = useState(initialCountries);
  const [isPending, startTransition] = useTransition();

  function handleDelete(country: CountryRow) {
    if (
      !window.confirm(
        `Delete "${country.name}"? This cannot be undone.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteCountry(country.id);
      setCountries((prev) => prev.filter((c) => c.id !== country.id));
    });
  }

  return (
    <div className="mt-6 grid gap-2">
      {countries.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/countries/${c.slug}`}
                className="text-sm font-medium hover:underline"
              >
                {c.name}
              </Link>
              <div className="mt-0.5 text-xs text-[var(--muted-foreground)] font-mono">
                /country/{c.slug}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDelete(c)}
                disabled={isPending}
                className="text-sm text-red-500 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
              <Link href={`/admin/countries/${c.slug}`}>
                <Button size="sm" variant="secondary">Edit</Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
      {countries.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No countries yet. Create one above.
        </p>
      )}
    </div>
  );
}
