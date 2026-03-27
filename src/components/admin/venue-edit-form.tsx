"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VenueTagPicker } from "@/components/venue/venue-tag-picker";
import { OpeningHoursEditor } from "@/components/admin/opening-hours-editor";
import type { OpeningHours } from "@/components/admin/opening-hours-editor";
import { LatLngPicker } from "@/components/admin/lat-lng-picker";
import { DescriptionGenerateForm } from "@/app/(admin)/admin/venues/[venueId]/description-generate-button";
import { VenueEnrichBar, TagsEnrichButton, OpeningHoursEnrichButton } from "@/components/admin/venue-enrich-panel";
import { useToast } from "@/components/ui/toast";
import { updateVenueDetails } from "@/app/(admin)/admin/venues/[venueId]/actions";
import type { VenueTagCategory, VenueTags } from "@/lib/venue-tags";

// ─── Styling constants ────────────────────────────────────────────────────────
const INPUT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-accent";
const SELECT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const TEXTAREA =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent sm:col-span-2";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-full border-t border-border pt-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VenueData {
  id: string;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  venue_type: string | null;
  venue_tags: unknown;
  website_url: string | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  description: string | null;
  description_base: string | null;
  description_editorial: string | null;
  description_generation_status: string | null;
  description_last_generated_at: string | null;
  published: boolean | null;
  closed: boolean | null;
  city_id: string | null;
  slug: string | null;
  opening_hours: unknown;
}

export interface CityData {
  id: string;
  name: string;
  slug: string;
  timezone?: string | null;
}

interface Props {
  venue: VenueData;
  cities: CityData[];
  customTagOptions: Partial<Record<VenueTagCategory, string[]>>;
  cityTimezone: string | null;
  /** venueId of the previous venue in the same city (for prev/next nav). */
  prevVenueId?: string | null;
  /** venueId of the next venue in the same city (for prev/next nav). */
  nextVenueId?: string | null;
  /** Human-readable label for the previous venue. */
  prevVenueName?: string | null;
  /** Human-readable label for the next venue. */
  nextVenueName?: string | null;
  /** URL path for the public "view on site" link. */
  viewOnSitePath?: string | null;
  /**
   * When true, hides the standalone admin nav header (← Places, prev/next) so
   * the form can be embedded inline on the public venue page.
   */
  inline?: boolean;
  /** Called after a successful save in inline mode (e.g. to refresh view). */
  onSave?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VenueEditForm({
  venue,
  cities,
  customTagOptions,
  cityTimezone,
  prevVenueId,
  nextVenueId,
  prevVenueName,
  nextVenueName,
  viewOnSitePath,
  inline = false,
  onSave,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // ── Controlled form fields ─────────────────────────────────────────────────
  const [cityId, setCityId] = useState(venue.city_id ?? "");
  const [venueType, setVenueType] = useState(venue.venue_type ?? "other");
  const [name, setName] = useState(venue.name ?? "");
  const [address, setAddress] = useState(venue.address ?? "");
  const [lat, setLat] = useState(String(venue.lat ?? ""));
  const [lng, setLng] = useState(String(venue.lng ?? ""));
  const [websiteUrl, setWebsiteUrl] = useState(venue.website_url ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(venue.google_maps_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(venue.instagram_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(venue.facebook_url ?? "");
  const [descriptionBase, setDescriptionBase] = useState(
    venue.description_base ?? venue.description ?? ""
  );
  const [descriptionEditorial, setDescriptionEditorial] = useState(
    venue.description_editorial ?? ""
  );
  const [published, setPublished] = useState(venue.published ?? false);
  const [closed, setClosed] = useState(venue.closed ?? false);

  // ── Opening hours + tags (use onChange callbacks) ─────────────────────────
  const [openingHours, setOpeningHours] = useState<OpeningHours | null>(null);
  const [venueTags, setVenueTags] = useState<VenueTags>(
    (venue.venue_tags as VenueTags) ?? {}
  );

  // ── Dirty state ────────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);

  // ── Unsaved changes guard (browser close / reload) ────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show a generic message; setting returnValue enables the dialog.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Navigate with optional dirty check
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

    const formData = new FormData();
    formData.set("id", venue.id);
    formData.set("city_id", cityId);
    formData.set("venue_type", venueType);
    formData.set("name", name);
    formData.set("address", address);
    formData.set("lat", lat);
    formData.set("lng", lng);
    formData.set("website_url", websiteUrl);
    formData.set("google_maps_url", googleMapsUrl);
    formData.set("instagram_url", instagramUrl);
    formData.set("facebook_url", facebookUrl);
    formData.set("description_base", descriptionBase);
    formData.set("description_editorial", descriptionEditorial);
    if (published) formData.set("published", "on");
    if (closed) formData.set("closed", "on");
    formData.set("venue_tags", JSON.stringify(venueTags));
    if (openingHours !== null) {
      formData.set("opening_hours", JSON.stringify(openingHours));
    } else if (venue.opening_hours) {
      formData.set("opening_hours", JSON.stringify(venue.opening_hours));
    }

    startTransition(async () => {
      try {
        await updateVenueDetails(formData);
        showToast("Saved ✓");
        setIsDirty(false);
        onSave?.();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Save failed", "error");
      }
    });
  }, [
    venue.id, venue.opening_hours,
    cityId, venueType, name, address, lat, lng,
    websiteUrl, googleMapsUrl, instagramUrl, facebookUrl,
    descriptionBase, descriptionEditorial, published, closed,
    venueTags, openingHours,
    startTransition, showToast, onSave,
  ]);

  // ── Keyboard shortcut (⌘S / Ctrl+S) ──────────────────────────────────────
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

  // ── Derived display values ─────────────────────────────────────────────────
  const city = cities.find((c) => c.id === cityId);

  return (
    <>
      {/* ── Page header with prev/next nav ──────────────────────────────────── */}
      {!inline && (
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/venues")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Places
            </button>
            {/* Prev / Next venue navigation */}
            {(prevVenueId || nextVenueId) && (
              <span className="flex items-center gap-1">
                {prevVenueId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/venues/${prevVenueId}`)}
                    title={prevVenueName ? `Previous: ${prevVenueName}` : "Previous venue"}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    aria-label={prevVenueName ? `Previous venue: ${prevVenueName}` : "Previous venue"}
                  >
                    ←
                  </button>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground/30">
                    ←
                  </span>
                )}
                {nextVenueId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/venues/${nextVenueId}`)}
                    title={nextVenueName ? `Next: ${nextVenueName}` : "Next venue"}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    aria-label={nextVenueName ? `Next venue: ${nextVenueName}` : "Next venue"}
                  >
                    →
                  </button>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground/30">
                    →
                  </span>
                )}
              </span>
            )}
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {venue.name}
          </h1>
          {city && (
            <p className="mt-0.5 text-sm text-muted-foreground">{city.name}</p>
          )}
        </div>
        {viewOnSitePath && (
          <Link
            href={viewOnSitePath}
            target="_blank"
            className="mt-1 shrink-0 text-sm text-muted-foreground hover:text-foreground"
          >
            View on site ↗
          </Link>
        )}
      </div>
      )}

      {/* ── Enrichment actions bar ──────────────────────────────────────────── */}
      <div className="mt-4">
        <VenueEnrichBar
          venueId={venue.id}
          onPlaceDetailsApplied={(fields) => {
            if (fields.address !== undefined) setAddress(fields.address);
            if (fields.lat !== undefined) setLat(String(fields.lat));
            if (fields.lng !== undefined) setLng(String(fields.lng));
            if (fields.website_url !== undefined) setWebsiteUrl(fields.website_url);
            if (fields.google_maps_url !== undefined) setGoogleMapsUrl(fields.google_maps_url);
            if (fields.instagram_url !== undefined) setInstagramUrl(fields.instagram_url);
            if (fields.facebook_url !== undefined) setFacebookUrl(fields.facebook_url);
          }}
          onTagsApplied={(mergedTags) => setVenueTags(mergedTags)}
        />
      </div>

      {/* ── Place details form ──────────────────────────────────────────────── */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="text-sm font-semibold">Place details</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* ── Basics ──────────────────────────────────────────── */}
          <select
            name="city_id"
            value={cityId}
            onChange={(e) => { setCityId(e.target.value); setIsDirty(true); }}
            className={SELECT}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="venue_type"
            value={venueType}
            onChange={(e) => { setVenueType(e.target.value); setIsDirty(true); }}
            className={SELECT}
          >
            <option value="bar">Bar</option>
            <option value="club">Club</option>
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Café</option>
            <option value="sauna">Sauna</option>
            <option value="event_space">Event space</option>
            <option value="other">Other</option>
          </select>

          <input
            name="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
            placeholder="Name"
            className={INPUT}
            required
          />
          <input
            name="address"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setIsDirty(true); }}
            placeholder="Address"
            className={INPUT}
          />

          {/* ── Location + Google Maps URL (with extract) ────────── */}
          <SectionLabel>Location</SectionLabel>
          <LatLngPicker
            mapsUrl={googleMapsUrl}
            onMapsUrlChange={(v) => { setGoogleMapsUrl(v); setIsDirty(true); }}
            lat={lat}
            lng={lng}
            onLatChange={(v) => { setLat(v); setIsDirty(true); }}
            onLngChange={(v) => { setLng(v); setIsDirty(true); }}
            inputClassName={INPUT}
          />

          {/* ── Other links ──────────────────────────────────────── */}
          <SectionLabel>Other links</SectionLabel>
          <input
            name="website_url"
            value={websiteUrl}
            onChange={(e) => { setWebsiteUrl(e.target.value); setIsDirty(true); }}
            placeholder="Website URL"
            className={INPUT}
          />
          <input
            name="instagram_url"
            value={instagramUrl}
            onChange={(e) => { setInstagramUrl(e.target.value); setIsDirty(true); }}
            placeholder="Instagram URL"
            className={INPUT}
          />
          <input
            name="facebook_url"
            value={facebookUrl}
            onChange={(e) => { setFacebookUrl(e.target.value); setIsDirty(true); }}
            placeholder="Facebook URL"
            className={INPUT}
          />

          {/* ── Tags ─────────────────────────────────────────────── */}
          <SectionLabel>Tags</SectionLabel>
          <div className="sm:col-span-2">
            <VenueTagPicker
              key={JSON.stringify(venue.venue_tags ?? {})}
              initialTags={(venue.venue_tags as VenueTags) ?? {}}
              customTagOptions={customTagOptions}
              onChange={(tags) => {
                setVenueTags(tags);
                setIsDirty(true);
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <TagsEnrichButton venueId={venue.id} onApplied={(mergedTags) => setVenueTags(mergedTags)} />
          </div>

          {/* ── Description ──────────────────────────────────────── */}
          <SectionLabel>Description</SectionLabel>

          {/* Summary */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Summary{" "}
                <span className="text-muted-foreground/60">— 1–3 sentences shown on city listings</span>
              </span>
              <div className="flex items-center gap-2">
                {venue.description_generation_status && (
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {venue.description_generation_status}
                  </span>
                )}
                <DescriptionGenerateForm
                  venueId={venue.id}
                  descriptionType="base_description"
                  currentText={descriptionBase}
                  hasExisting={!!descriptionBase}
                  onTextApplied={(text) => setDescriptionBase(text)}
                />
              </div>
            </div>
            <textarea
              name="description_base"
              value={descriptionBase}
              onChange={(e) => { setDescriptionBase(e.target.value); setIsDirty(true); }}
              placeholder="Not yet generated — click Generate to create one."
              rows={2}
              className={TEXTAREA}
            />
            {venue.description_last_generated_at && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Last generated{" "}
                {new Date(venue.description_last_generated_at).toLocaleString(
                  undefined,
                  { dateStyle: "medium", timeStyle: "short" }
                )}
              </p>
            )}
          </div>

          {/* Editorial description */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Editorial description{" "}
                <span className="text-muted-foreground/60">
                  — in-depth paragraph shown on the venue page
                </span>
              </span>
              <DescriptionGenerateForm
                venueId={venue.id}
                descriptionType="editorial_description"
                currentText={descriptionEditorial}
                hasExisting={!!descriptionEditorial}
                onTextApplied={(text) => setDescriptionEditorial(text)}
              />
            </div>
            <textarea
              name="description_editorial"
              value={descriptionEditorial}
              onChange={(e) => { setDescriptionEditorial(e.target.value); setIsDirty(true); }}
              placeholder="Write an editorial paragraph about this venue…"
              rows={4}
              className={TEXTAREA}
            />
          </div>

          {/* ── Opening hours ─────────────────────────────────────── */}
          <SectionLabel>Opening hours</SectionLabel>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Click a day&apos;s status to cycle: Open → Closed → No info
              </p>
              <OpeningHoursEnrichButton venueId={venue.id} />
            </div>
            <OpeningHoursEditor
              key={JSON.stringify(venue.opening_hours ?? {})}
              initialValue={venue.opening_hours}
              defaultTimezone={cityTimezone ?? "UTC"}
              onChange={(h) => {
                setOpeningHours(h);
                setIsDirty(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar ──────────────────────────────────────────────────
          Contains: Published toggle, Permanently Closed toggle, Save button,
          dirty indicator, and keyboard shortcut hint.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        className={inline
          ? "sticky bottom-0 z-30 mt-4 rounded-2xl border border-border bg-background/95 backdrop-blur-sm"
          : "fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm"
        }
        role="toolbar"
        aria-label="Save controls"
      >
        <div className={inline
          ? "flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
          : "mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
        }>
          {/* Status toggles */}
          <div className="flex items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => {
                  setPublished(e.target.checked);
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded"
                aria-label="Published"
              />
              Published
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                checked={closed}
                onChange={(e) => {
                  setClosed(e.target.checked);
                  setIsDirty(true);
                }}
                className="h-4 w-4 rounded"
                aria-label="Permanently closed"
              />
              Closed
            </label>
          </div>

          {/* Right: dirty indicator + save button */}
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="hidden text-xs text-muted-foreground sm:block" aria-live="polite">
                Unsaved changes
              </span>
            )}
            <span className="hidden text-[10px] text-muted-foreground/50 sm:block">
              ⌘S
            </span>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              aria-label="Save changes"
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>


    </>
  );
}
