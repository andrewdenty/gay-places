"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DescriptionGenerateForm({
  action,
  venueId,
  hasExisting,
}: {
  action: (formData: FormData) => Promise<void>;
  venueId: string;
  hasExisting: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={venueId} />
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Generating…" : hasExisting ? "Regenerate" : "Generate"}
      </button>
    </form>
  );
}
