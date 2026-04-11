"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RainbowLogo } from "@/components/ui/rainbow-logo";
import { CityAutocomplete } from "./city-autocomplete";
import { submitVenueSuggestion } from "@/app/(public)/suggest/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type VenueType = "bar" | "club" | "restaurant" | "cafe" | "sauna" | "other";

type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

type FormState = {
  name: string;
  cityName: string;
  cityId: string | null;
  citySlug: string | null;
  venueType: VenueType | null;
  instagram: string;
  website: string;
};

type Step = "name" | "city" | "type" | "links" | "success";

const VENUE_TYPES: { value: VenueType; label: string; emoji: string }[] = [
  { value: "bar", label: "Bar", emoji: "🍸" },
  { value: "club", label: "Club", emoji: "🪩" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "cafe", label: "Café", emoji: "☕" },
  { value: "sauna", label: "Sauna", emoji: "🔥" },
  { value: "other", label: "Other", emoji: "✨" },
];

const STEP_ORDER: Step[] = ["name", "city", "type", "links", "success"];

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
      className="mt-2 text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
      style={{
        fontFamily: 'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
      }}
    >
      {children}
    </h1>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SuggestFlow() {
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
  const totalSteps = 4; // excluding success

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
      if (e.key === "Escape" && step !== "name" && step !== "success") {
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
      await submitVenueSuggestion({
        name: form.name,
        cityName: form.cityName,
        cityId: form.cityId,
        citySlug: form.citySlug,
        venueType: form.venueType ?? "other",
        instagramUrl: form.instagram ? normaliseInstagram(form.instagram) : null,
        websiteUrl: form.website.trim() || null,
      });
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared header: back + step indicator ──
  const showHeader = step !== "success";

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {showHeader && (
          <div className="mb-8 flex items-center gap-4">
            {/* Back button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={goBack}
              className={stepIndex === 0 ? "pointer-events-none opacity-0" : ""}
              aria-label="Go back"
            >
              ← Back
            </Button>

            {/* Step indicator — left aligned, Geist Mono 12px */}
            <span
              className="text-[var(--muted-foreground)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }}
            >
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <div>
            <StepHeading>What&rsquo;s this place called?</StepHeading>
            <div className="mt-8">
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
              <Button onClick={advance} disabled={!form.name.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: City */}
        {step === "city" && (
          <div>
            <StepHeading>Where is it?</StepHeading>
            <div className="mt-8">
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
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Type any city — even if it&rsquo;s not on the map yet.
              </p>
            </div>
            <div className="mt-4">
              <Button onClick={advance} disabled={!form.cityName.trim()}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Venue type */}
        {step === "type" && (
          <div>
            <StepHeading>What kind of place is it?</StepHeading>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {VENUE_TYPES.map(({ value, label, emoji }) => (
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

        {/* Step: Links */}
        {step === "links" && (
          <div>
            <StepHeading>Any links to help us find it?</StepHeading>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Totally optional — skip if you&rsquo;re not sure.
            </p>
            <div className="mt-8 grid gap-4">
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

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                Skip this
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center">
            {/* Spinning rainbow logo */}
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-[var(--muted)]">
              <div style={{ animation: "spin 3s linear infinite" }}>
                <RainbowLogo size="lg" />
              </div>
            </div>

            <h1
              className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
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
              {" is on its way to the map. We'll review it and add it soon."}
            </p>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Button onClick={reset}>
                Add another place
              </Button>
              <span className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                Want credit for your suggestions?
                <Link
                  href="/sign-in?next=/account"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--muted)] px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--muted)_85%,transparent)]"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
