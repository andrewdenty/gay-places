"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";

interface DraftData {
  name: string;
  venue_type: string;
  address: string;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  phone: string | null;
  summary_short: string;
  why_unique: string;
  venue_tags: VenueTags;
  opening_hours: unknown;
  discovery_sources: string[];
  fact_sources: string[];
  notes: string;
}

interface Props {
  draftId: string;
  initialDraft: DraftData;
  initialNotes: string;
}

export function EditDraftForm({ draftId, initialDraft, initialNotes }: Props) {
  const [name, setName] = useState(initialDraft.name ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialDraft.google_maps_url ?? "",
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    initialDraft.website_url ?? "",
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialDraft.instagram_url ?? "",
  );
  const [summaryShort, setSummaryShort] = useState(
    initialDraft.summary_short ?? "",
  );
  const [whyUnique, setWhyUnique] = useState(initialDraft.why_unique ?? "");
  const [venueTags, setVenueTags] = useState<VenueTags>(
    initialDraft.venue_tags ?? {},
  );
  const [openingHours, setOpeningHours] = useState(
    JSON.stringify(initialDraft.opening_hours ?? {}, null, 2),
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function toggleTag(category: keyof VenueTags, tag: string) {
    setVenueTags((prev) => {
      const current = prev[category] ?? [];
      const updated = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: updated };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);

    let parsedHours: unknown;
    try {
      parsedHours = JSON.parse(openingHours);
    } catch {
      setError("Opening hours is not valid JSON");
      setBusy(false);
      return;
    }

    const body = {
      name: name.trim(),
      google_maps_url: googleMapsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      summary_short: summaryShort.trim(),
      why_unique: whyUnique.trim(),
      venue_tags: venueTags,
      opening_hours: parsedHours,
      notes,
    };

    try {
      const res = await fetch(`/api/admin/ingest/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Save failed");
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="edit-name">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="edit-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
          className={inputCls}
        />
      </div>

      {/* Google Maps URL */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-maps-url"
        >
          Google Maps URL <span className="text-destructive">*</span>
        </label>
        <input
          id="edit-maps-url"
          type="url"
          required
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
          disabled={busy}
          className={inputCls}
          placeholder="https://maps.google.com/..."
        />
      </div>

      {/* Website URL */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-website"
        >
          Website URL
        </label>
        <input
          id="edit-website"
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          disabled={busy}
          className={inputCls}
        />
      </div>

      {/* Instagram URL */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-instagram"
        >
          Instagram URL
        </label>
        <input
          id="edit-instagram"
          type="url"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          disabled={busy}
          className={inputCls}
        />
      </div>

      {/* Summary */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-summary"
        >
          Summary{" "}
          <span className="text-muted-foreground font-normal text-xs">
            — 1–3 sentences shown on city listings
          </span>
        </label>
        <textarea
          id="edit-summary"
          rows={4}
          value={summaryShort}
          onChange={(e) => setSummaryShort(e.target.value)}
          disabled={busy}
          className={inputCls}
        />
      </div>

      {/* Editorial description */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-why-unique"
        >
          Editorial description{" "}
          <span className="text-muted-foreground font-normal text-xs">
            — in-depth paragraph shown on the venue page
          </span>
        </label>
        <textarea
          id="edit-why-unique"
          rows={4}
          value={whyUnique}
          onChange={(e) => setWhyUnique(e.target.value)}
          disabled={busy}
          className={inputCls}
        />
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm font-medium mb-3">Tags</p>
        <div className="space-y-4">
          {TAG_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {cat.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => {
                  const active = (venueTags[cat.key] ?? []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(cat.key, tag)}
                      disabled={busy}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opening Hours */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-hours"
        >
          Opening hours{" "}
          <span className="text-muted-foreground font-normal text-xs">
            (JSON)
          </span>
        </label>
        <textarea
          id="edit-hours"
          rows={8}
          value={openingHours}
          onChange={(e) => setOpeningHours(e.target.value)}
          disabled={busy}
          className={`${inputCls} font-mono text-xs`}
        />
      </div>

      {/* Admin Notes */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          htmlFor="edit-notes"
        >
          Admin notes
        </label>
        <textarea
          id="edit-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
          className={inputCls}
        />
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved successfully.
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>
    </form>
  );
}
