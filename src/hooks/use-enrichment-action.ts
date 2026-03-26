"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";

export type EnrichmentStatus = "idle" | "loading" | "preview" | "applying" | "error";

interface UseEnrichmentActionOptions<TProposal> {
  /** Function that fetches the enrichment proposal from the server. */
  fetchProposal: () => Promise<TProposal>;
  /** Function that applies the proposal (writes to DB). */
  applyProposal: (proposal: TProposal) => Promise<void>;
  /** Called after a successful apply (e.g. router.refresh()). */
  onSuccess?: () => void;
  /** Toast message shown on success. */
  successMessage?: string;
}

export interface UseEnrichmentActionReturn<TProposal> {
  status: EnrichmentStatus;
  proposal: TProposal | null;
  error: string | null;
  /** Trigger the fetch phase. */
  start: () => void;
  /** Apply the current proposal. */
  apply: () => void;
  /** Dismiss the preview without applying. */
  dismiss: () => void;
}

/**
 * Generic hook for the enrichment flow:
 *   idle → loading → preview → applying → success (toast + reset to idle)
 *                                       → error (toast + reset to idle)
 *
 * Used by all enrichment and description-generate buttons.
 */
export function useEnrichmentAction<TProposal>({
  fetchProposal,
  applyProposal,
  onSuccess,
  successMessage = "Applied successfully",
}: UseEnrichmentActionOptions<TProposal>): UseEnrichmentActionReturn<TProposal> {
  const { showToast } = useToast();
  const [status, setStatus] = useState<EnrichmentStatus>("idle");
  const [proposal, setProposal] = useState<TProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    setError(null);
    setStatus("loading");
    fetchProposal()
      .then((p) => {
        setProposal(p);
        setStatus("preview");
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setError(msg);
        setStatus("error");
        showToast(msg, "error");
      });
  }, [fetchProposal, showToast]);

  const apply = useCallback(() => {
    if (!proposal) return;
    setStatus("applying");
    applyProposal(proposal)
      .then(() => {
        showToast(successMessage, "success");
        setProposal(null);
        setStatus("idle");
        onSuccess?.();
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Apply failed";
        setError(msg);
        setStatus("error");
        showToast(msg, "error");
      });
  }, [proposal, applyProposal, onSuccess, successMessage, showToast]);

  const dismiss = useCallback(() => {
    setProposal(null);
    setError(null);
    setStatus("idle");
  }, []);

  return { status, proposal, error, start, apply, dismiss };
}
