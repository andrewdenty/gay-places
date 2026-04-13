"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COMMON_TIMEZONES } from "@/components/admin/opening-hours-editor";
import { useToast } from "@/components/ui/toast";
import { updateCity } from "@/app/(admin)/admin/cities/actions";

// ─── Styling constants ─────────────────────────────────────────────────────────
const INPUT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-accent";
const SELECT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const TEXTAREA =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CityData {
  id: string;
  slug: string;
  name: string;
  country: string;
  center_lat: number | null;
  center_lng: number | null;
  published: boolean | null;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  timezone?: string | null;
}

interface Props {
  city: CityData;
  countryOptions: { name: string }[];
  /** @deprecated inline save bar now matches admin style; prop is accepted but has no effect. */
  inline?: boolean;
  /** Called after a successful save in inline mode. */
  onSave?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CityEditForm({ city, countryOptions, onSave }: Props) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Controlled fields ──────────────────────────────────────────────────────
  const [name, setName] = useState(city.name ?? "");
  const [country, setCountry] = useState(city.country ?? "");
  const [centerLat, setCenterLat] = useState(String(city.center_lat ?? ""));
  const [centerLng, setCenterLng] = useState(String(city.center_lng ?? ""));
  const [published, setPublished] = useState(city.published ?? false);
  const [timezone, setTimezone] = useState(city.timezone ?? "");
  const [description, setDescription] = useState(city.description ?? "");
  const [seoTitle, setSeoTitle] = useState(city.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(city.seo_description ?? "");

  // ── Dirty state ────────────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false);

  const markDirty = () => setIsDirty(true);

  // ── Unsaved changes guard ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!name.trim()) {
      showToast("Name is required", "error");
      return;
    }

    const formData = new FormData();
    formData.set("id", city.id);
    formData.set("name", name);
    formData.set("country", country);
    formData.set("center_lat", centerLat);
    formData.set("center_lng", centerLng);
    formData.set("published", published ? "true" : "false");
    formData.set("timezone", timezone);
    formData.set("description", description);
    formData.set("seo_title", seoTitle);
    formData.set("seo_description", seoDescription);

    startTransition(async () => {
      try {
        await updateCity(formData);
        showToast("Saved ✓");
        setIsDirty(false);
        onSave?.();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Save failed", "error");
      }
    });
  }, [
    city.id, name, country, centerLat, centerLng, published,
    timezone, description, seoTitle, seoDescription,
    startTransition, showToast, onSave,
  ]);

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

  return (
    <>
      {/* City details card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="text-sm font-semibold">City details</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            value={name}
            onChange={(e) => { setName(e.target.value); markDirty(); }}
            placeholder="Name"
            className={INPUT}
            required
          />
          <select
            name="country"
            value={country}
            onChange={(e) => { setCountry(e.target.value); markDirty(); }}
            className={SELECT}
          >
            <option value="">Select country…</option>
            {countryOptions.map((co) => (
              <option key={co.name} value={co.name}>
                {co.name}
              </option>
            ))}
          </select>
          <input
            name="center_lat"
            value={centerLat}
            onChange={(e) => { setCenterLat(e.target.value); markDirty(); }}
            placeholder="Latitude"
            className={INPUT}
          />
          <input
            name="center_lng"
            value={centerLng}
            onChange={(e) => { setCenterLng(e.target.value); markDirty(); }}
            placeholder="Longitude"
            className={INPUT}
          />

          {/* Timezone */}
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-muted-foreground">
              Timezone{" "}
              <span className="text-[10px] opacity-60">
                — used as the default tz for this city&apos;s venue opening hours
              </span>
            </div>
            <select
              name="timezone"
              value={timezone}
              onChange={(e) => { setTimezone(e.target.value); markDirty(); }}
              className={SELECT}
            >
              <option value="">Select timezone…</option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <div className="mb-1 text-xs text-muted-foreground">
              Description{" "}
              <span className="text-[10px] opacity-60">
                — optional intro shown on the city page
              </span>
            </div>
            <textarea
              name="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              placeholder="Write a short description of this city's gay scene…"
              rows={4}
              className={TEXTAREA}
            />
          </div>

          {/* SEO overrides */}
          <div className="sm:col-span-2 border-t border-border pt-3 mt-1">
            <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              SEO overrides
            </div>
            <div className="grid gap-3">
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  SEO title{" "}
                  <span className="text-[10px] opacity-60">
                    — overrides the default &quot;Gay {city.name} Guide&quot; title tag
                  </span>
                </div>
                <input
                  name="seo_title"
                  value={seoTitle}
                  onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }}
                  placeholder={`Gay ${city.name} Guide`}
                  className={INPUT}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">
                  SEO description{" "}
                  <span className="text-[10px] opacity-60">
                    — overrides the meta description (150–160 chars recommended)
                  </span>
                </div>
                <textarea
                  name="seo_description"
                  value={seoDescription}
                  onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }}
                  placeholder={`Discover the best gay bars, clubs and queer venues in ${city.name}. Your curated guide to LGBTQ+ spaces.`}
                  rows={3}
                  className={TEXTAREA}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom bar ─────────────────────────────────────────────────────
          Published toggle · Save button · dirty indicator · ⌘S hint
      ──────────────────────────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm"
        role="toolbar"
        aria-label="Save controls"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Published toggle */}
          <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => { setPublished(e.target.checked); markDirty(); }}
              className="h-4 w-4 rounded"
              aria-label="Published"
            />
            Published
          </label>

          {/* Right: dirty indicator + save + back */}
          <div className="flex items-center gap-3">
            {isDirty && (
              <span
                className="hidden text-xs text-muted-foreground sm:block"
                aria-live="polite"
              >
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
              aria-label="Save"
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/cities")}
            >
              Back
            </Button>
          </div>
        </div>
      </div>


    </>
  );
}
