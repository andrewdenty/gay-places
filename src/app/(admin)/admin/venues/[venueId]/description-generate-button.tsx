"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({ hasExisting }: { hasExisting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Generating…" : hasExisting ? "Regenerate" : "Generate"}
    </button>
  );
}

export function DescriptionGenerateForm({
  action,
  venueId,
  hasExisting,
}: {
  action: (formData: FormData) => Promise<void>;
  venueId: string;
  hasExisting: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={venueId} />
      <SubmitButton hasExisting={hasExisting} />
    </form>
  );
}
