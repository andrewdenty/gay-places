"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  status: string;
  onSuccess?: () => void;
}

export function DraftActions({ id, status, onSuccess }: Props) {
  const [busy, setBusy] = useState<
    "publish" | "dismiss" | "re-enrich" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "publish" | "dismiss" | "re-enrich") {
    setBusy(action);
    setError(null);
    const path =
      action === "publish"
        ? `/api/admin/ingest/drafts/${id}/publish`
        : action === "dismiss"
          ? `/api/admin/ingest/drafts/${id}/dismiss`
          : `/api/admin/ingest/drafts/${id}/re-enrich`;

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? `${action} failed`);
      }
      onSuccess?.();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    } finally {
      setBusy(null);
    }
  }

  const isPublished = status === "published";
  const isDismissed = status === "dismissed";
  const canPublish = !isPublished && !isDismissed;
  const canDismiss = !isPublished && !isDismissed;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {canPublish && (
          <Button
            type="button"
            size="sm"
            onClick={() => act("publish")}
            disabled={busy !== null}
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => act("re-enrich")}
          disabled={busy !== null || isPublished}
        >
          {busy === "re-enrich" ? "Re-enriching…" : "Re-enrich"}
        </Button>
        {canDismiss && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => act("dismiss")}
            disabled={busy !== null}
          >
            {busy === "dismiss" ? "Dismissing…" : "Dismiss"}
          </Button>
        )}
      </div>
      {error && (
        <div className="text-xs text-destructive text-right">{error}</div>
      )}
    </div>
  );
}
