"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  { value: "club", label: "Club", emoji: "🎉" },
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "cafe", label: "Café", emoji: "☕" },
  { value: "sauna", label: "Sauna", emoji: "🧖" },
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

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-4 bg-[var(--foreground)]"
              : i === current
              ? "w-4 bg-[var(--foreground)]"
              : "w-1.5 bg-[var(--border)]"
          }`}
        />
      ))}
    </div>
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
  const [direction, setDirection] = useState<"forward" | "back">("forward");

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
    setDirection("forward");
    const next = STEP_ORDER[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    setDirection("back");
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
    setDirection("forward");
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
      setDirection("forward");
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Back + step indicator header */}
        {step !== "success" && (
          <div className="mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className={`flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition-opacity hover:text-[var(--foreground)] ${
                stepIndex === 0 ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
              aria-label="Go back"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M10 12L6 8l4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>
            <StepIndicator current={stepIndex} total={totalSteps} />
          </div>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <div key="name">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Step 1 of 4
            </p>
            <h1
              className="mt-2 text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
              }}
            >
              What&rsquo;s this place called?
            </h1>
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
              <Button
                onClick={advance}
                disabled={!form.name.trim()}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: City */}
        {step === "city" && (
          <div key="city">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Step 2 of 4
            </p>
            <h1
              className="mt-2 text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
              }}
            >
              Where is it?
            </h1>
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
              <Button
                onClick={advance}
                disabled={!form.cityName.trim()}
                className="w-full sm:w-auto"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Venue type */}
        {step === "type" && (
          <div key="type">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Step 3 of 4
            </p>
            <h1
              className="mt-2 text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
              }}
            >
              What kind of place is it?
            </h1>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {VENUE_TYPES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, venueType: value }));
                    // Auto-advance after a tiny delay so the selection is visible
                    setTimeout(() => advance(), 160);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-medium transition-all duration-150 hover:border-[var(--foreground)] hover:bg-[var(--muted)] active:scale-95 ${
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
          <div key="links">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Step 4 of 4
            </p>
            <h1
              className="mt-2 text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
              }}
            >
              Any links to help us find it?
            </h1>
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
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="sm:w-auto"
              >
                {submitting ? "Submitting…" : "Submit"}
              </Button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="text-sm text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)] transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                Skip this
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div key="success" className="text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)] text-4xl">
              🎉
            </div>
            <h1
              className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl"
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
              }}
            >
              You&rsquo;re a legend.
            </h1>
            <p className="mt-3 text-base text-[var(--muted-foreground)]">
              <strong className="text-[var(--foreground)]">{form.name}</strong>
              {" in "}
              <strong className="text-[var(--foreground)]">{form.cityName}</strong>
              {" is on its way to the map."}
            </p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              We&rsquo;ll review it and add it soon.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Button onClick={reset} className="w-full sm:w-auto">
                Know somewhere else? →
              </Button>
              <Link
                href="/sign-in?next=/account"
                className="text-sm text-[var(--muted-foreground)] underline underline-offset-2 hover:text-[var(--foreground)] transition-colors"
              >
                Sign in to get credited and track your spots
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
