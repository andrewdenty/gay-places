"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { venueUrlPath } from "@/lib/slugs";

interface Props {
  id: string;
  status: string;
  citySlug?: string;
  onSuccess?: () => void;
}

export function DraftActions({ id, status, citySlug, onSuccess }: Props) {
  const [busy, setBusy] = useState<
    "publish" | "dismiss" | "re-enrich" | "delete" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [publishedVenueId, setPublishedVenueId] = useState<string | null>(null);
  const [publishedCitySlug, setPublishedCitySlug] = useState<string | null>(null);
  const [publishedVenueSlug, setPublishedVenueSlug] = useState<string | null>(null);
  const [publishedVenueType, setPublishedVenueType] = useState<string | null>(null);

  async function act(action: "publish" | "dismiss" | "re-enrich" | "delete") {
    setBusy(action);
    setError(null);

    const methodMap = {
      publish: { path: `/api/admin/ingest/drafts/${id}/publish`, method: "POST" },
      dismiss: { path: `/api/admin/ingest/drafts/${id}/dismiss`, method: "POST" },
      "re-enrich": { path: `/api/admin/ingest/drafts/${id}/re-enrich`, method: "POST" },
      delete: { path: `/api/admin/ingest/drafts/${id}`, method: "DELETE" },
    };

    const { path, method } = methodMap[action];

    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        venue_id?: string;
        city_slug?: string;
        venue_slug?: string;
        venue_type?: string;
      };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? `${action} failed`);
      }
      if (action === "publish" && json.venue_id) {
        setPublishedVenueId(json.venue_id);
        setPublishedCitySlug(json.city_slug ?? citySlug ?? null);
        setPublishedVenueSlug(json.venue_slug ?? null);
        setPublishedVenueType(json.venue_type ?? null);
      } else {
        onSuccess?.();
        window.location.reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    } finally {
      setBusy(null);
    }
  }

  const isPublished = status === "published" || publishedVenueId !== null;
  const isDismissed = status === "dismissed";
  const canPublish = !isPublished && !isDismissed;
  const canDismiss = !isPublished && !isDismissed;

  if (publishedVenueId) {
    const viewPath =
      publishedCitySlug && publishedVenueType && publishedVenueSlug
        ? venueUrlPath(publishedCitySlug, publishedVenueType, publishedVenueSlug)
        : null;
    return (
      <div className="flex flex-col items-end gap-2">
        <span className="text-xs text-green-700 font-medium">Published ✓</span>
        {viewPath && (
          <Link
            href={viewPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View on site ↗
          </Link>
        )}
      </div>
    );
  }

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
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => act("delete")}
          disabled={busy !== null}
          className="text-destructive hover:text-destructive"
        >
          {busy === "delete" ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {error && (
        <div className="text-xs text-destructive text-right">{error}</div>
      )}
    </div>
  );
}
