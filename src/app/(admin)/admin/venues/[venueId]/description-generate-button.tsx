"use client";

import { useRouter } from "next/navigation";
import { useEnrichmentAction } from "@/hooks/use-enrichment-action";
import { SpinnerIcon, CheckIcon } from "@/components/ui/icons";

/** Shape returned by the unified_description API action. */
type UnifiedDescriptionProposal = {
  description_editorial: string;
  description_base: string;
};

// ---------------------------------------------------------------------------
// Unified description generate form (calls unified_description action,
// populates both description_editorial and description_base at once)
// ---------------------------------------------------------------------------

interface UnifiedProps {
  venueId: string;
  hasExisting: boolean;
  currentEditorial: string;
  currentBase: string;
  onApplied?: (editorial: string, base: string) => void;
}

export function UnifiedDescriptionGenerateForm({
  venueId,
  hasExisting,
  currentEditorial,
  currentBase,
  onApplied,
}: UnifiedProps) {
  const router = useRouter();

  const { status, proposal, start, apply, dismiss } =
    useEnrichmentAction<UnifiedDescriptionProposal>({
      fetchProposal: async () => {
        const res = await fetch(`/api/admin/venues/${venueId}/enrich`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "unified_description" }),
        });
        const json = (await res.json()) as { ok?: boolean; proposal?: UnifiedDescriptionProposal; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Generation failed");
        if (!json.proposal) throw new Error("No proposal returned from server");
        return json.proposal;
      },
      applyProposal: async (p) => {
        const res = await fetch(`/api/admin/venues/${venueId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fields: {
              description_editorial: p.description_editorial,
              description_base: p.description_base,
              description: p.description_base,
              description_generation_status: "ai_draft",
              description_last_generated_at: new Date().toISOString(),
            },
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Apply failed");
        onApplied?.(p.description_editorial, p.description_base);
      },
      onSuccess: () => router.refresh(),
      successMessage: "Description applied",
    });

  const isLoading = status === "loading";
  const isApplying = status === "applying";
  const busy = isLoading || isApplying;

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <SpinnerIcon className="h-3 w-3 animate-spin" />
            Generating…
          </>
        ) : (
          hasExisting ? "Regenerate" : "Generate"
        )}
      </button>

      {(status === "preview" || status === "applying") && proposal && (
        <UnifiedPreviewModal
          currentEditorial={currentEditorial}
          currentBase={currentBase}
          proposal={proposal}
          onApply={apply}
          onDismiss={dismiss}
          isApplying={isApplying}
        />
      )}
    </>
  );
}

function UnifiedPreviewModal({
  currentEditorial,
  currentBase,
  proposal,
  onApply,
  onDismiss,
  isApplying,
}: {
  currentEditorial: string;
  currentBase: string;
  proposal: UnifiedDescriptionProposal;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onDismiss}
      />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-[var(--card)] shadow-xl" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">Preview: Description</h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border overflow-y-auto">
          {/* Current */}
          <div className="px-6 py-4 space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Current</div>
            {currentEditorial ? (
              <p className="text-sm leading-relaxed text-foreground">{currentEditorial}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">No existing description</p>
            )}
            {currentBase && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Listing card</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{currentBase}</p>
              </div>
            )}
          </div>

          {/* Generated */}
          <div className="bg-emerald-50/30 px-6 py-4 space-y-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
              <CheckIcon className="h-3 w-3" />
              Generated
            </div>
            <p className="text-sm leading-relaxed text-foreground">{proposal.description_editorial}</p>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 mb-1">Listing card</p>
              <p className="text-xs leading-relaxed text-foreground">{proposal.description_base}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isApplying}
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={isApplying}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                Applying…
              </>
            ) : (
              "Apply to both fields"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

