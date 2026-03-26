"use client";

import { useRouter } from "next/navigation";
import { useEnrichmentAction } from "@/hooks/use-enrichment-action";
import { SpinnerIcon, SparklesIcon } from "@/components/ui/icons";
import { OpeningHoursEditor } from "@/components/admin/opening-hours-editor";
import type {
  PlaceDetailsProposal,
  TagsProposal,
  OpeningHoursProposal,
} from "@/lib/ai/venue-enrichment";

// ---------------------------------------------------------------------------
// Shared helpers

function EnrichButton({
  onClick,
  isLoading,
  children,
}: {
  onClick: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isLoading ? (
        <SpinnerIcon className="h-3 w-3 animate-spin" />
      ) : (
        <SparklesIcon className="h-3 w-3" />
      )}
      {isLoading ? "Running…" : children}
    </button>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-[var(--card)] shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

function ModalFooterButtons({
  onDiscard,
  onApply,
  isApplying,
  applyLabel = "Apply",
}: {
  onDiscard: () => void;
  onApply: () => void;
  isApplying: boolean;
  applyLabel?: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onDiscard}
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
          applyLabel
        )}
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Place Details Enrichment

export function PlaceDetailsEnrichButton({ venueId }: { venueId: string }) {
  const router = useRouter();

  const { status, proposal, start, apply, dismiss } =
    useEnrichmentAction<PlaceDetailsProposal>({
      fetchProposal: async () => {
        const res = await fetch(`/api/admin/venues/${venueId}/enrich`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "place_details" }),
        });
        const json = (await res.json()) as { ok?: boolean; proposal?: PlaceDetailsProposal; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Enrichment failed");
        if (!json.proposal) throw new Error("No proposal returned from server");
        return json.proposal;
      },
      applyProposal: async (p) => {
        const fields: Record<string, unknown> = {};
        if (p.address !== undefined) fields.address = p.address;
        if (p.lat !== undefined) fields.lat = p.lat;
        if (p.lng !== undefined) fields.lng = p.lng;
        if (p.website_url !== undefined) fields.website_url = p.website_url;
        if (p.google_maps_url !== undefined) fields.google_maps_url = p.google_maps_url;

        if (Object.keys(fields).length === 0) return; // nothing to apply

        const res = await fetch(`/api/admin/venues/${venueId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fields }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Apply failed");
      },
      onSuccess: () => router.refresh(),
      successMessage: "Place details updated",
    });

  return (
    <>
      <EnrichButton onClick={start} isLoading={status === "loading"}>
        Enrich place details
      </EnrichButton>

      {(status === "preview" || status === "applying") && proposal && (
        <PlaceDetailsPreviewModal
          proposal={proposal}
          onApply={apply}
          onDismiss={dismiss}
          isApplying={status === "applying"}
        />
      )}
    </>
  );
}

function PlaceDetailsPreviewModal({
  proposal,
  onApply,
  onDismiss,
  isApplying,
}: {
  proposal: PlaceDetailsProposal;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
}) {
  const hasChanges = proposal.changedFields.length > 0;

  return (
    <ModalShell
      title="Enrich place details"
      onClose={onDismiss}
      footer={
        <ModalFooterButtons
          onDiscard={onDismiss}
          onApply={onApply}
          isApplying={isApplying}
          applyLabel={hasChanges ? "Apply changes" : "OK"}
        />
      }
    >
      {proposal.placeName && (
        <p className="mb-3 text-sm text-muted-foreground">
          Found in Google Places as{" "}
          <span className="font-medium text-foreground">{proposal.placeName}</span>
        </p>
      )}

      <p className="mb-4 text-sm">{proposal.summary}</p>

      {hasChanges && (
        <div className="divide-y divide-border rounded-xl border border-border">
          {proposal.address !== undefined && (
            <PreviewRow label="Address" value={proposal.address} />
          )}
          {(proposal.lat !== undefined || proposal.lng !== undefined) && (
            <PreviewRow
              label="Coordinates"
              value={`${proposal.lat ?? "–"}, ${proposal.lng ?? "–"}`}
            />
          )}
          {proposal.website_url !== undefined && (
            <PreviewRow label="Website" value={proposal.website_url} />
          )}
          {proposal.google_maps_url !== undefined && (
            <PreviewRow label="Google Maps URL" value={proposal.google_maps_url} />
          )}
        </div>
      )}
    </ModalShell>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 px-4 py-2.5 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all font-medium text-foreground">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tags Enrichment

export function TagsEnrichButton({ venueId }: { venueId: string }) {
  const router = useRouter();

  const { status, proposal, start, apply, dismiss } =
    useEnrichmentAction<TagsProposal>({
      fetchProposal: async () => {
        const res = await fetch(`/api/admin/venues/${venueId}/enrich`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "tags" }),
        });
        const json = (await res.json()) as { ok?: boolean; proposal?: TagsProposal; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Enrichment failed");
        if (!json.proposal) throw new Error("No proposal returned from server");
        return json.proposal;
      },
      applyProposal: async (p) => {
        if (p.new_tag_labels.length === 0) return;
        const res = await fetch(`/api/admin/venues/${venueId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fields: { venue_tags: p.merged_tags } }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Apply failed");
      },
      onSuccess: () => router.refresh(),
      successMessage: "Tags updated",
    });

  return (
    <>
      <EnrichButton onClick={start} isLoading={status === "loading"}>
        Auto-add tags
      </EnrichButton>

      {(status === "preview" || status === "applying") && proposal && (
        <TagsPreviewModal
          proposal={proposal}
          onApply={apply}
          onDismiss={dismiss}
          isApplying={status === "applying"}
        />
      )}
    </>
  );
}

function TagsPreviewModal({
  proposal,
  onApply,
  onDismiss,
  isApplying,
}: {
  proposal: TagsProposal;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
}) {
  const hasNew = proposal.new_tag_labels.length > 0;

  return (
    <ModalShell
      title="Auto-add tags"
      onClose={onDismiss}
      footer={
        <ModalFooterButtons
          onDiscard={onDismiss}
          onApply={hasNew ? onApply : onDismiss}
          isApplying={isApplying}
          applyLabel={hasNew ? `Add ${proposal.new_tag_labels.length} tag${proposal.new_tag_labels.length === 1 ? "" : "s"}` : "OK"}
        />
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">{proposal.summary}</p>

      {hasNew && (
        <div className="flex flex-wrap gap-1.5">
          {proposal.new_tag_labels.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
            >
              + {tag}
            </span>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Opening Hours Enrichment

export function OpeningHoursEnrichButton({ venueId }: { venueId: string }) {
  const router = useRouter();

  const { status, proposal, start, apply, dismiss } =
    useEnrichmentAction<OpeningHoursProposal>({
      fetchProposal: async () => {
        const res = await fetch(`/api/admin/venues/${venueId}/enrich`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "opening_hours" }),
        });
        const json = (await res.json()) as { ok?: boolean; proposal?: OpeningHoursProposal; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Enrichment failed");
        if (!json.proposal) throw new Error("No proposal returned from server");
        return json.proposal;
      },
      applyProposal: async (p) => {
        const res = await fetch(`/api/admin/venues/${venueId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ fields: { opening_hours: p.opening_hours } }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || json.error) throw new Error(json.error ?? "Apply failed");
      },
      onSuccess: () => router.refresh(),
      successMessage: "Opening hours updated from Google Places",
    });

  return (
    <>
      <EnrichButton onClick={start} isLoading={status === "loading"}>
        Enrich hours
      </EnrichButton>

      {(status === "preview" || status === "applying") && proposal && (
        <HoursPreviewModal
          proposal={proposal}
          onApply={apply}
          onDismiss={dismiss}
          isApplying={status === "applying"}
        />
      )}
    </>
  );
}

function HoursPreviewModal({
  proposal,
  onApply,
  onDismiss,
  isApplying,
}: {
  proposal: OpeningHoursProposal;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
}) {
  return (
    <ModalShell
      title="Enrich opening hours"
      onClose={onDismiss}
      footer={
        <ModalFooterButtons
          onDiscard={onDismiss}
          onApply={onApply}
          isApplying={isApplying}
          applyLabel="Apply hours"
        />
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">{proposal.summary}</p>
      <OpeningHoursEditor initialValue={proposal.opening_hours} readOnly />
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Combined enrichment action bar (for the venue edit page header area)

export function VenueEnrichBar({ venueId }: { venueId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Enrich:</span>
      <PlaceDetailsEnrichButton venueId={venueId} />
      <TagsEnrichButton venueId={venueId} />
    </div>
  );
}
