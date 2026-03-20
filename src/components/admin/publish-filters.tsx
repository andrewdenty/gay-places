"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback } from "react";

interface Props {
  cities: string[];
  filterCity: string;
  filterStatus: string;
  filterErrors: boolean;
}

export function PublishFilters({
  cities,
  filterCity,
  filterStatus,
  filterErrors,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const hasFilters = filterCity || filterStatus || filterErrors;
  const statusOptions = [
    "draft",
    "ready_to_publish",
    "dismissed",
    "published",
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <select
        value={filterCity}
        onChange={(e) => updateParam("city", e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filterStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All statuses</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filterErrors}
          onChange={(e) => updateParam("errors", e.target.checked ? "1" : "")}
          className="rounded border-input"
        />
        Has errors
      </label>

      {hasFilters && (
        <Link
          href="/admin/research/publish"
          className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted"
        >
          Clear
        </Link>
      )}
    </div>
  );
}
