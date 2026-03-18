"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface Source {
  id: string;
  name: string;
  baseUrl: string;
}

interface City {
  slug: string;
  name: string;
  country: string;
}

interface DiscoveryResult {
  ok?: boolean;
  error?: string;
  totalDiscovered?: number;
  totalNew?: number;
  totalSkipped?: number;
  totalDuplicates?: number;
  sourceBreakdown?: Record<string, { discovered: number; new: number }>;
  errors?: string[];
}

interface Props {
  availableSources: Source[];
  availableCities: City[];
}

export function RunDiscoveryModal({ availableSources, availableCities }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleRun() {
    setBusy(true);
    setError(null);
    setResult(null);

    const body: { cities?: string[]; sources?: string[] } = {};
    if (selectedCity) body.cities = [selectedCity];
    if (selectedSources.length > 0) body.sources = selectedSources;

    try {
      const res = await fetch("/api/admin/jobs/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as DiscoveryResult;
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Discovery run failed");
      }
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery run failed");
    } finally {
      setBusy(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError(null);
    setSelectedSources([]);
    setSelectedCity("");
    if (result?.totalNew && result.totalNew > 0) {
      window.location.reload();
    }
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Run discovery
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-base font-semibold">Run place discovery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scans LGBTQ+ travel sites for new places. For a single city this
              takes ~30 seconds; for all cities, use the nightly GitHub Actions
              workflow instead.
            </p>

            {!result ? (
              <>
                {/* City selector */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">
                    City{" "}
                    <span className="text-muted-foreground font-normal">
                      (leave blank for all cities)
                    </span>
                  </label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={busy}
                  >
                    <option value="">All cities</option>
                    {availableCities.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} ({c.country})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source selector */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">
                    Sources{" "}
                    <span className="text-muted-foreground font-normal">
                      (leave all unchecked for all sources)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {availableSources.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input"
                          checked={selectedSources.includes(s.id)}
                          onChange={() => toggleSource(s.id)}
                          disabled={busy}
                        />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-xs truncate">
                          {s.baseUrl}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  <Button
                    type="button"
                    onClick={handleRun}
                    disabled={busy}
                    className="flex-1"
                  >
                    {busy ? "Running…" : "Run discovery"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              /* Results */
              <>
                <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
                  <div className="text-sm font-medium mb-2">
                    ✅ Discovery complete
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Discovered</span>
                    <span>{result.totalDiscovered ?? 0}</span>
                    <span className="text-muted-foreground">New candidates</span>
                    <span className="font-medium">{result.totalNew ?? 0}</span>
                    <span className="text-muted-foreground">Already known</span>
                    <span>{result.totalSkipped ?? 0}</span>
                    {(result.totalDuplicates ?? 0) > 0 && (
                      <>
                        <span className="text-muted-foreground">
                          Auto-matched
                        </span>
                        <span>{result.totalDuplicates}</span>
                      </>
                    )}
                  </div>

                  {result.sourceBreakdown &&
                    Object.keys(result.sourceBreakdown).length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          By source
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          {Object.entries(result.sourceBreakdown).map(
                            ([sourceId, stats]) => (
                              <React.Fragment key={sourceId}>
                                <span className="text-muted-foreground capitalize">
                                  {sourceId}
                                </span>
                                <span>
                                  {stats.new} new / {stats.discovered} found
                                </span>
                              </React.Fragment>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <div className="text-xs font-medium text-destructive mb-1">
                        Errors ({result.errors.length})
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {result.errors.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Button type="button" onClick={handleClose} className="w-full">
                    {(result.totalNew ?? 0) > 0 ? "Close & refresh" : "Close"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
