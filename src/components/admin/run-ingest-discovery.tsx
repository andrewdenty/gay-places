"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DiscoveryResult {
  ok?: boolean;
  error?: string;
  job_id?: string;
  total_discovered?: number;
  total_inserted?: number;
}

interface Props {
  onComplete?: () => void;
}

export function RunIngestDiscovery({ onComplete }: Props) {
  const [cityName, setCityName] = useState("");
  const [country, setCountry] = useState("");
  const [citySlug, setCitySlug] = useState("");
  const [maxResults, setMaxResults] = useState<number | "">(20);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!cityName.trim() || !country.trim()) return;

    setBusy(true);
    setError(null);
    setResult(null);

    const body: {
      city_name: string;
      country: string;
      city_slug?: string;
      max_results?: number;
    } = {
      city_name: cityName.trim(),
      country: country.trim(),
    };
    if (citySlug.trim()) body.city_slug = citySlug.trim();
    if (maxResults !== "" && maxResults > 0) body.max_results = maxResults;

    try {
      const res = await fetch("/api/admin/ingest/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as DiscoveryResult;
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Discovery failed");
      }
      setResult(json);
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setCityName("");
    setCountry("");
    setCitySlug("");
    setMaxResults(20);
    if (result?.total_inserted && result.total_inserted > 0) {
      window.location.reload();
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <div className="text-sm font-medium mb-2">✅ Discovery complete</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Discovered</span>
          <span>{result.total_discovered ?? 0}</span>
          <span className="text-muted-foreground">Inserted</span>
          <span className="font-medium">{result.total_inserted ?? 0}</span>
          {result.job_id && (
            <>
              <span className="text-muted-foreground">Job ID</span>
              <span className="truncate text-xs text-muted-foreground">{result.job_id}</span>
            </>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={() => window.location.assign("/admin/research/new-places")}
          >
            View new places
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Run another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleRun} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city-name">
            City <span className="text-destructive">*</span>
          </label>
          <input
            id="city-name"
            type="text"
            required
            placeholder="e.g. Amsterdam"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            disabled={busy}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="country">
            Country <span className="text-destructive">*</span>
          </label>
          <input
            id="country"
            type="text"
            required
            placeholder="e.g. Netherlands"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={busy}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city-slug">
            City slug{" "}
            <span className="text-muted-foreground font-normal">
              (optional — derived from city name if blank)
            </span>
          </label>
          <input
            id="city-slug"
            type="text"
            placeholder="e.g. amsterdam"
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            disabled={busy}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="max-results">
            Max results{" "}
            <span className="text-muted-foreground font-normal">(default 20)</span>
          </label>
          <input
            id="max-results"
            type="number"
            min={1}
            max={50}
            placeholder="20"
            value={maxResults}
            onChange={(e) =>
              setMaxResults(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={busy}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={busy || !cityName.trim() || !country.trim()}>
        {busy ? "Running discovery…" : "Run discovery"}
      </Button>
    </form>
  );
}
