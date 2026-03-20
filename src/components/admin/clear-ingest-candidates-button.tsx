"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ClearIngestCandidatesButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClear() {
    const confirmed = window.confirm(
      "Are you sure you want to clear ALL pending candidates?\n\n" +
        "This will permanently delete all pending ingest candidates. " +
        "Approved and rejected candidates will be preserved.\n\n" +
        "This action cannot be undone.",
    );

    if (!confirmed) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/ingest/candidates/clear-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const json = (await res.json()) as {
        ok?: boolean;
        deleted?: number;
        error?: string;
      };

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Clear failed");
      }

      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clear failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClear}
        disabled={busy}
      >
        {busy ? "Clearing…" : "Clear all candidates"}
      </Button>
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
