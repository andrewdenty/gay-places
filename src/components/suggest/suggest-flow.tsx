"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FullPageModal } from "@/components/ui/full-page-modal";
import { Button } from "@/components/ui/button";
import { CityAutocomplete } from "./city-autocomplete";
import type { VenueTypeValue } from "@/lib/venue-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  cityName: string;
  cityId: string | null;
  citySlug: string | null;
  venueType: VenueTypeValue | null;
  instagram: string;
  website: string;
};

type Step = "name" | "city" | "type" | "links" | "success";

const SUGGEST_VENUE_OPTIONS: { value: VenueTypeValue; label: string; emoji: string }[] = [
  { value: "bar",         label: "Bar",         emoji: "🍸" },
  { value: "club",        label: "Club",        emoji: "🪩" },
  { value: "restaurant",  label: "Restaurant",  emoji: "🍽️" },
  { value: "cafe",        label: "Café",        emoji: "☕" },
  { value: "sauna",       label: "Sauna",       emoji: "🔥" },
  { value: "event_space", label: "Event space", emoji: "🎪" },
  { value: "cruising",    label: "Cruising",    emoji: "😈" },
  { value: "hotel",       label: "Hotel",       emoji: "🏨" },
  { value: "shop",        label: "Shop",        emoji: "🛍️" },
  { value: "other",       label: "Other",       emoji: "✨" },
];

const STEP_ORDER: Step[] = ["name", "city", "type", "links", "success"];
const TOTAL_STEPS = 4; // excludes success

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseInstagram(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\/?/, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return stripped ? `https://www.instagram.com/${stripped}/` : "";
}

// ─── Step heading ─────────────────────────────────────────────────────────────

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
      style={{
        fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
      }}
    >
      {children}
    </h1>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block rounded-full transition-all duration-300 ${
            i <= current
              ? "h-1.5 w-4 bg-[var(--foreground)]"
              : "h-1.5 w-1.5 bg-[var(--border)]"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SuggestFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [form, setForm] = useState<FormState>({
    name: "",
    cityName: "",
    cityId: null,
    citySlug: null,
    venueType: null,
    instagram: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const instagramRef = useRef<HTMLInputElement>(null);

  const stepIndex = STEP_ORDER.indexOf(step);
  const showHeader = step !== "success";

  // Focus the active input when step changes
  useEffect(() => {
    const t = setTimeout(() => {
      if (step === "name") nameRef.current?.focus();
      if (step === "city") cityRef.current?.focus();
      if (step === "links") instagramRef.current?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [step]);

  // Keyboard: Escape goes back
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && stepIndex > 0 && step !== "success") {
        goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function advance() {
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1];
    if (prev && prev !== "success") setStep(prev);
  }

  function reset() {
    setForm({
      name: "",
      cityName: "",
      cityId: null,
      citySlug: null,
      venueType: null,
      instagram: "",
      website: "",
    });
    setError(null);
    setStep("name");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          cityName: form.cityName,
          cityId: form.cityId,
          citySlug: form.citySlug,
          venueType: form.venueType ?? "other",
          instagramUrl: form.instagram ? normaliseInstagram(form.instagram) : null,
          websiteUrl: form.website.trim() || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Something went wrong. Please try again.");
      }
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Progress dots — shown in the center slot of FullPageModal header ──
  const progressDots = showHeader ? (
    <ProgressDots current={stepIndex} total={TOTAL_STEPS} />
  ) : null;

  return (
    <FullPageModal
      onClose={() => router.back()}
      onBack={goBack}
      showBack={showHeader && stepIndex > 0}
      centerSlot={progressDots}
    >
      <div className="w-full">

        {/* ── Step: Name ── */}
        {step === "name" && (
          <div>
            <StepHeading>What&rsquo;s this place called?</StepHeading>
            {/* mt-4: 8px closer to input than the previous mt-6 */}
            <div className="mt-4">
              <input
                ref={nameRef}
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && form.name.trim()) advance();
                }}
                placeholder="e.g. Eagle Bar"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-base outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)]"
              />
            </div>
            <div className="mt-4">
              <Button className="w-full sm:w-auto" onClick={advance} disabled={!form.name.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: City ── */}
        {step === "city" && (
          <div>
            <StepHeading>Where is it?</StepHeading>
            <div className="mt-4">
              <CityAutocomplete
                value={form.cityName}
                onChange={(cityName, city) =>
                  setForm((f) => ({
                    ...f,
                    cityName,
                    cityId: city?.id ?? null,
                    citySlug: city?.slug ?? null,
                  }))
                }
                onSubmit={() => {
                  if (form.cityName.trim()) advance();
                }}
                inputRef={cityRef}
              />
              <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
                Type any city, even if it&rsquo;s not listed yet.
              </p>
            </div>
            <div className="mt-4">
              <Button className="w-full sm:w-auto" onClick={advance} disabled={!form.cityName.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Venue type ── */}
        {step === "type" && (
          <div>
            <StepHeading>What kind of place is it?</StepHeading>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUGGEST_VENUE_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, venueType: value }));
                    setTimeout(() => advance(), 160);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-all duration-150 hover:border-[var(--foreground)] hover:bg-[var(--muted)] active:scale-95 ${
                    form.venueType === value
                      ? "border-[var(--foreground)] bg-[var(--muted)]"
                      : "border-[var(--border)] bg-[var(--card)]"
                  }`}
                >
                  <span className="text-2xl" role="img" aria-label={label}>
                    {emoji}
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: Links ── */}
        {step === "links" && (
          <div>
            <StepHeading>Any links to help us find it?</StepHeading>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Instagram
                </label>
                <input
                  ref={instagramRef}
                  type="text"
                  value={form.instagram}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, instagram: e.target.value }))
                  }
                  placeholder="@handle or instagram.com/…"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-base outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Website
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, website: e.target.value }))
                  }
                  placeholder="https://…"
                  autoComplete="off"
                  className="h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-base outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)]"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-[var(--red)]">{error}</p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Save and add place"}
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={handleSubmit}
                disabled={submitting}
              >
                Skip this
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="text-center">
            {/* Spinning rainbow logo */}
            <div className="mb-6" style={{ animation: "spin 3s linear infinite", display: "inline-block" }}>
              <Image src="/rainbow-logo.svg" alt="" width={72} height={72} />
            </div>

            <h1
              className="text-4xl font-normal leading-tight tracking-tight sm:text-5xl"
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
              }}
            >
              Nice find.
            </h1>

            <p className="mt-3 text-sm text-[var(--foreground)]">
              <span className="font-semibold">{form.name}</span>
              {" in "}
              <span className="font-semibold">{form.cityName}</span>
              {" is on its way to the map."}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              We&rsquo;ll review it and add it soon.
            </p>

            <div className="mt-8 flex flex-col items-center">
              <Button className="w-full sm:w-auto" onClick={reset}>Add another place</Button>
              {/* 24px more space (mt-12 = 48px total) between button and "want credit" */}
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-[13px] text-[var(--foreground)]">
                  Want credit for your suggestions?
                </p>
                <Link
                  href="/sign-in?next=/account"
                  className="inline-flex w-full sm:w-auto h-11 items-center justify-center whitespace-nowrap rounded-full border border-[var(--border)] bg-transparent px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </FullPageModal>
  );
}
