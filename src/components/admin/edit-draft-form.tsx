"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";
import { OpeningHoursEditor, type OpeningHours } from "@/components/admin/opening-hours-editor";
import { LatLngPicker } from "@/components/admin/lat-lng-picker";
import { useToast } from "@/components/ui/toast";
import { venueUrlPath } from "@/lib/slugs";
import { AdminPhotoUpload } from "@/app/(admin)/admin/venues/[venueId]/admin-photo-upload";

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
  /** New unified format: single prose paragraph */
  description?: string;
  /** Legacy: kept for backwards-compat with older drafts */
  summary_short?: string;
  /** Legacy: kept for backwards-compat with older drafts */
  why_unique?: string;
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
  status: string;
  citySlug?: string | null;
  /** ID of the previous draft for quick navigation. */
  prevDraftId?: string | null;
  /** ID of the next draft for quick navigation. */
  nextDraftId?: string | null;
  prevDraftName?: string | null;
  nextDraftName?: string | null;
  uploadPhotoAction?: (formData: FormData) => Promise<void>;
}

export function EditDraftForm({
  draftId,
  initialDraft,
  initialNotes,
  status,
  citySlug,
  prevDraftId,
  nextDraftId,
  prevDraftName,
  nextDraftName,
  uploadPhotoAction,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishedVenueId, setPublishedVenueId] = useState<string | null>(null);
  const [publishedCitySlug, setPublishedCitySlug] = useState<string | null>(null);
  const [publishedVenueSlug, setPublishedVenueSlug] = useState<string | null>(null);
  const [publishedVenueType, setPublishedVenueType] = useState<string | null>(null);

  const [name, setName] = useState(initialDraft.name ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialDraft.google_maps_url ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialDraft.website_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initialDraft.instagram_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(initialDraft.facebook_url ?? "");
  const [lat, setLat] = useState(String(initialDraft.lat ?? ""));
  const [lng, setLng] = useState(String(initialDraft.lng ?? ""));
  // Unified description: initialise from new field, fall back to legacy summary_short
  const [description, setDescription] = useState(
    initialDraft.description ?? initialDraft.summary_short ?? ""
  );
  const [venueTags, setVenueTags] = useState<VenueTags>(initialDraft.venue_tags ?? {});
  const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null);
  const [notes, setNotes] = useState(initialNotes ?? "");

  // Legacy error/success replaced by toast — kept for API error display
  const [error, setError] = useState<string | null>(null);

  // ── Dirty state ────────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);

  const initialRef = useRef({
    name: initialDraft.name ?? "",
    googleMapsUrl: initialDraft.google_maps_url ?? "",
    websiteUrl: initialDraft.website_url ?? "",
    instagramUrl: initialDraft.instagram_url ?? "",
    facebookUrl: initialDraft.facebook_url ?? "",
    lat: String(initialDraft.lat ?? ""),
    lng: String(initialDraft.lng ?? ""),
    description: initialDraft.description ?? initialDraft.summary_short ?? "",
    notes: initialNotes ?? "",
  });

  useEffect(() => {
    const init = initialRef.current;
    const dirty =
      name !== init.name ||
      googleMapsUrl !== init.googleMapsUrl ||
      websiteUrl !== init.websiteUrl ||
      instagramUrl !== init.instagramUrl ||
      facebookUrl !== init.facebookUrl ||
      lat !== init.lat ||
      lng !== init.lng ||
      description !== init.description ||
      notes !== init.notes ||
      openingHours !== null;
    setIsDirty(dirty);
  }, [name, googleMapsUrl, websiteUrl, instagramUrl, facebookUrl, lat, lng, description, notes, openingHours]);

  // ── Unsaved changes guard ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const navigate = useCallback(
    (href: string) => {
      if (isDirty && !confirm("You have unsaved changes. Leave without saving?")) return;
      router.push(href);
    },
    [isDirty, router]
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }
    setError(null);

    const body = {
      name: name.trim(),
      google_maps_url: googleMapsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      description: description.trim(),
      venue_tags: venueTags,
      opening_hours: openingHours ?? initialDraft.opening_hours,
      notes,
    };

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/ingest/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Save failed");

        showToast("Saved ✓");
        setIsDirty(false);
        // Update initial snapshot
        initialRef.current = {
          name: name.trim(),
          googleMapsUrl: googleMapsUrl.trim(),
          websiteUrl: websiteUrl.trim(),
          instagramUrl: instagramUrl.trim(),
          facebookUrl: facebookUrl.trim(),
          lat,
          lng,
          description: description.trim(),
          notes,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Save failed";
        setError(msg);
        showToast(msg, "error");
      }
    });
  }, [
    draftId, name, googleMapsUrl, websiteUrl, instagramUrl, facebookUrl, lat, lng,
    description, venueTags, openingHours, notes,
    initialDraft.opening_hours, startTransition, showToast,
  ]);

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishBusy(true);
    try {
      const res = await fetch(`/api/admin/ingest/drafts/${draftId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; venue_id?: string; city_slug?: string; venue_slug?: string; venue_type?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Publish failed");
      setPublishedVenueId(json.venue_id ?? null);
      setPublishedCitySlug(json.city_slug ?? citySlug ?? null);
      setPublishedVenueSlug(json.venue_slug ?? null);
      setPublishedVenueType(json.venue_type ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Publish failed";
      showToast(msg, "error");
    } finally {
      setPublishBusy(false);
    }
  }, [draftId, citySlug, showToast]);

  function toggleTag(category: keyof VenueTags, tag: string) {
    setVenueTags((prev) => {
      const current = prev[category] ?? [];
      const updated = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: updated };
    });
    setIsDirty(true);
  }

  // ── ⌘S / Ctrl+S keyboard shortcut ─────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const inputCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <>
      {/* ── Prev / Next navigation ──────────────────────────────────────────── */}
      {(prevDraftId || nextDraftId) && (
        <div className="mb-4 flex items-center gap-2">
          {prevDraftId ? (
            <button
              type="button"
              onClick={() => navigate(`/admin/research/publish/${prevDraftId}`)}
              title={prevDraftName ? `Previous: ${prevDraftName}` : "Previous draft"}
              className="flex h-7 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              aria-label={prevDraftName ? `Previous draft: ${prevDraftName}` : "Previous draft"}
            >
              ← {prevDraftName ? prevDraftName : "Previous"}
            </button>
          ) : null}
          {nextDraftId ? (
            <button
              type="button"
              onClick={() => navigate(`/admin/research/publish/${nextDraftId}`)}
              title={nextDraftName ? `Next: ${nextDraftName}` : "Next draft"}
              className="flex h-7 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              aria-label={nextDraftName ? `Next draft: ${nextDraftName}` : "Next draft"}
            >
              {nextDraftName ? nextDraftName : "Next"} →
            </button>
          ) : null}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
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
            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            disabled={isPending}
            className={inputCls}
          />
        </div>

        {/* Google Maps URL + lat/lng extraction */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Location
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <LatLngPicker
              mapsUrl={googleMapsUrl}
              onMapsUrlChange={(v) => { setGoogleMapsUrl(v); setIsDirty(true); }}
              lat={lat}
              lng={lng}
              onLatChange={(v) => { setLat(v); setIsDirty(true); }}
              onLngChange={(v) => { setLng(v); setIsDirty(true); }}
              disabled={isPending}
              inputClassName={inputCls}
            />
          </div>
        </div>

        {/* Website URL */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-website">
            Website URL
          </label>
          <input
            id="edit-website"
            type="url"
            value={websiteUrl}
            onChange={(e) => { setWebsiteUrl(e.target.value); setIsDirty(true); }}
            disabled={isPending}
            className={inputCls}
          />
        </div>

        {/* Instagram URL */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-instagram">
            Instagram URL
          </label>
          <input
            id="edit-instagram"
            type="url"
            value={instagramUrl}
            onChange={(e) => { setInstagramUrl(e.target.value); setIsDirty(true); }}
            disabled={isPending}
            className={inputCls}
          />
        </div>

        {/* Facebook URL */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-facebook">
            Facebook URL
          </label>
          <input
            id="edit-facebook"
            type="url"
            value={facebookUrl}
            onChange={(e) => { setFacebookUrl(e.target.value); setIsDirty(true); }}
            disabled={isPending}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-description">
            Description{" "}
            <span className="text-muted-foreground font-normal text-xs">
              — 3–4 sentences shown on the venue page (sentence 1 appears on city listings)
            </span>
          </label>
          <textarea
            id="edit-description"
            rows={5}
            value={description}
            onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
            disabled={isPending}
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
                        disabled={isPending}
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
          <label className="block text-sm font-medium mb-2" htmlFor="edit-hours">
            Opening hours
          </label>
          <OpeningHoursEditor
            initialValue={initialDraft.opening_hours}
            onChange={(h) => {
              setOpeningHours(h);
              setIsDirty(true);
            }}
            inputName=""
          />
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="edit-notes">
            Admin notes
          </label>
          <textarea
            id="edit-notes"
            rows={2}
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
            disabled={isPending}
            className={inputCls}
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Bottom padding to prevent content hiding behind sticky bar */}
        <div className="h-16" aria-hidden="true" />
      </form>

      {/* ── Post-publish photo upload ─────────────────────────────────────────── */}
      {publishedVenueId && uploadPhotoAction && (
        <div className="mt-6 rounded-lg border border-border p-4">
          <p className="text-sm font-medium mb-3">Photos</p>
          <AdminPhotoUpload venueId={publishedVenueId} uploadAction={uploadPhotoAction} />
        </div>
      )}

      {/* ── Sticky bottom bar ──────────────────────────────────────────────────
          Always-visible Save button + dirty indicator + keyboard shortcut hint.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm"
        role="toolbar"
        aria-label="Save controls"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="hidden text-xs text-muted-foreground sm:block" aria-live="polite">
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] text-muted-foreground/50 sm:block">
              ⌘S
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              aria-label="Save changes"
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
            {publishedVenueId ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-700 font-medium">Published ✓</span>
                {publishedCitySlug && publishedVenueType && publishedVenueSlug && (
                  <a
                    href={venueUrlPath(publishedCitySlug, publishedVenueType, publishedVenueSlug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View ↗
                  </a>
                )}
              </div>
            ) : status !== "published" && status !== "dismissed" ? (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishBusy || isPending}
                aria-label="Publish draft"
              >
                {publishBusy ? "Publishing…" : "Publish"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/admin/research/publish")}
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

