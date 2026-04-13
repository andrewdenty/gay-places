"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FullPageModal } from "@/components/ui/full-page-modal";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "form" | "success";

type FormState = {
  name: string;
  email: string;
  role: string;
};

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

// ─── Main component ───────────────────────────────────────────────────────────

export function ClaimFlow({
  venueId,
  venueName,
}: {
  venueId: string;
  venueName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({ name: "", email: "", role: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Escape closes the modal (go back)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          venueId,
          name: form.name,
          email: form.email,
          role: form.role,
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

  return (
    <FullPageModal onClose={() => router.back()}>
      <div className="w-full">

        {/* ── Step: Form ── */}
        {step === "form" && (
          <div>
            <StepHeading>Claim this place</StepHeading>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              If you run or represent{" "}
              <span className="font-medium text-[var(--foreground)]">{venueName}</span>
              , leave your details and we&rsquo;ll be in touch.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Name <span aria-hidden="true" className="text-[var(--muted-foreground)]">*</span>
                </label>
                <FormInput
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Email <span aria-hidden="true" className="text-[var(--muted-foreground)]">*</span>
                </label>
                <FormInput
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Your role{" "}
                  <span className="text-[var(--muted-foreground)] font-normal">
                    (optional)
                  </span>
                </label>
                <FormInput
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Owner, manager, PR contact…"
                  autoComplete="organization-title"
                />
              </div>

              {error && (
                <p className="text-sm text-[var(--red)]">{error}</p>
              )}

              <div className="mt-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit claim"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div>
            <StepHeading>Request received.</StepHeading>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Thanks. We&rsquo;ve received your request and will be in touch.
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
