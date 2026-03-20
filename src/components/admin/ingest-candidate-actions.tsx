"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function IngestCandidateActions({ id }: { id: string }) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "approve" | "reject") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/ingest/candidates/${id}/${kind}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
        },
      );
      const json = (await res.json()) as { ok?: true; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Action failed");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => act("approve")}
          disabled={busy !== null}
        >
          {busy === "approve" ? "Approving…" : "Approve"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => act("reject")}
          disabled={busy !== null}
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
      {error ? (
        <div className="text-xs text-destructive">{error}</div>
      ) : null}
    </div>
  );
}
