"use client";

import { useTransition } from "react";
import { deleteVenueById } from "./actions";

export function DeleteVenueButton({ venueId }: { venueId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !window.confirm(
        "Delete this venue permanently? All photos will also be removed. This cannot be undone.",
      )
    )
      return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await deleteVenueById(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={venueId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-full bg-red-50 px-5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete venue"}
      </button>
    </form>
  );
}
