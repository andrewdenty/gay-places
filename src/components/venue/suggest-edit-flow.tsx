"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  Pencil,
  DoorClosed,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { FullPageModal } from "@/components/ui/full-page-modal";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditType =
  | "incorrect_details"
  | "wrong_hours"
  | "wrong_links"
  | "wrong_address"
  | "place_closed"
  | "other";

type Step = "type_select" | "note_and_email" | "success";

// Edit types where the note step is completely optional
const OPTIONAL_NOTE_TYPES = new Set<EditType>([
  "place_closed",
  "wrong_hours",
  "wrong_address",
]);

const EDIT_TYPES: { value: EditType; label: string; icon: LucideIcon }[] = [
  { value: "incorrect_details", label: "Incorrect details or description", icon: Pencil },
  { value: "wrong_hours",       label: "Hours are wrong",                  icon: Clock },
  { value: "wrong_links",       label: "Website or Instagram is wrong",    icon: Globe },
  { value: "wrong_address",     label: "Address or map is wrong",          icon: MapPin },
  { value: "place_closed",      label: "Place is closed",                  icon: DoorClosed },
  { value: "other",             label: "Something else",                   icon: MessageSquare },
];

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

export function SuggestEditFlow({
  venueId,
  venueName,
}: {
  venueId: string;
  venueName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type_select");
  const [editType, setEditType] = useState<EditType | null>(null);
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Focus note textarea when entering step 2
  useEffect(() => {
    if (step === "note_and_email") {
      const t = setTimeout(() => noteRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Escape: go back a step or close the modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (step === "note_and_email") {
          setStep("type_select");
        } else {
          router.back();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, step]);

  function selectType(type: EditType) {
    setEditType(type);
    setNote("");
    setStep("note_and_email");
  }

  function goBack() {
    if (step === "note_and_email") {
      setStep("type_select");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editType) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/suggest-edit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venueId,
          editType,
          note: note.trim(),
          email: email.trim() || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Something went wrong. Please try again.");
      }
      setStep("success");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isOptional = editType ? OPTIONAL_NOTE_TYPES.has(editType) : false;
  const canSubmit = isOptional || note.trim().length > 0;

  const stepIndex = step === "type_select" ? 0 : 1;
  const showProgress = step !== "success";
  const progressDots = showProgress ? (
    <ProgressDots current={stepIndex} total={2} />
  ) : null;

  const noteLabel =
    editType === "place_closed"
      ? "Anything that would help us confirm?"
      : "What should we change?";

  const notePlaceholder =
    editType === "place_closed"
      ? "e.g. I visited last week and it was boarded up."
      : editType === "wrong_hours"
        ? "e.g. They close at midnight on Fridays, not 2am."
        : editType === "wrong_address"
          ? "e.g. The correct address is 14 Oak Street."
          : "Describe what's incorrect or out of date…";

  return (
    <FullPageModal
      onClose={() => router.back()}
      onBack={goBack}
      showBack={step === "note_and_email"}
      centerSlot={progressDots}
    >
      <div className="w-full">

        {/* ── Step: type_select ── */}
        {step === "type_select" && (
          <div>
            <StepHeading>What needs updating?</StepHeading>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Select the type of correction for{" "}
              <span className="font-medium text-[var(--foreground)]">{venueName}</span>.
            </p>
            <div className="mt-6 grid gap-2">
              {EDIT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectType(value)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-4 text-left text-sm font-normal text-[var(--foreground)] transition-colors hover:border-[var(--foreground)] hover:bg-[var(--hover-bg)] active:bg-[var(--muted)]"
                >
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className="shrink-0 text-[var(--muted-foreground)]"
                  />
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.5}
                    className="shrink-0 text-[var(--muted-foreground)]"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step: note_and_email ── */}
        {step === "note_and_email" && (
          <div>
            <StepHeading>{noteLabel}</StepHeading>
            {isOptional && (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Any extra detail helps, but this is optional.
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4">
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={notePlaceholder}
                rows={4}
                className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-base outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)]"
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email{" "}
                  <span className="font-normal text-[var(--muted-foreground)]">
                    (optional)
                  </span>
                </label>
                <FormInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  Only if you&rsquo;d like us to follow up.
                </p>
              </div>

              {error && (
                <p className="text-sm text-[var(--red)]">{error}</p>
              )}

              <div className="mt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={submitting || !canSubmit}
                >
                  {submitting ? "Sending…" : "Send suggestion"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div>
            <StepHeading>Thanks for the tip.</StepHeading>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              We&rsquo;ve added your suggestion to our review queue. We&rsquo;ll
              take a look and update the listing if needed.
            </p>
            <div className="mt-6">
              <Button className="w-full sm:w-auto" onClick={() => router.back()}>
                Done
              </Button>
            </div>
          </div>
        )}

      </div>
    </FullPageModal>
  );
}
