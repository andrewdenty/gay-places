"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EnrichResult {
  ok?: boolean;
  error?: string;
  job_id?: string;
  enriched?: number;
  failed?: number;
  errors?: string[];
}

export function RunEnrichment() {
  const [citySlug, setCitySlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    const body: { city_slug?: string } = {};
    if (citySlug.trim()) body.city_slug = citySlug.trim();

    try {
      const res = await fetch("/api/admin/ingest/enrich", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as EnrichResult;
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Enrichment failed");
      }
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setCitySlug("");
    if (result?.enriched && result.enriched > 0) {
      window.location.reload();
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <div className="text-sm font-medium mb-2">
          {(result.failed ?? 0) > 0
            ? "⚠️ Enrichment completed with errors"
            : "✅ Enrichment complete"}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Enriched</span>
          <span className="font-medium">{result.enriched ?? 0}</span>
          {(result.failed ?? 0) > 0 && (
            <>
              <span className="text-muted-foreground">Failed</span>
              <span className="text-destructive">{result.failed}</span>
            </>
          )}
          {result.job_id && (
            <>
              <span className="text-muted-foreground">Job ID</span>
              <span className="truncate text-xs text-muted-foreground">
                {result.job_id}
              </span>
            </>
          )}
        </div>
        {result.errors && result.errors.length > 0 && (
          <div className="mt-3 space-y-1">
            {result.errors.map((err, i) => (
              <div key={i} className="text-xs text-destructive">
                {err}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={() => window.location.assign("/admin/publish")}
          >
            View drafts
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Run again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleRun} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="enrich-city-slug"
        >
          City slug{" "}
          <span className="text-muted-foreground font-normal">
            (optional — leave blank to enrich all approved candidates)
          </span>
        </label>
        <input
          id="enrich-city-slug"
          type="text"
          placeholder="e.g. amsterdam"
          value={citySlug}
          onChange={(e) => setCitySlug(e.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? "Running enrichment…" : "Run enrichment"}
      </Button>
    </form>
  );
}
