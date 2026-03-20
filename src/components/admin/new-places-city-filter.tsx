"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Props {
  cities: { slug: string; name: string }[];
  filterCity: string;
}

export function NewPlacesCityFilter({ cities, filterCity }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("city", value);
    } else {
      params.delete("city");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <select
        value={filterCity}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      {filterCity && (
        <Link
          href="/admin/research/new-places"
          className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
