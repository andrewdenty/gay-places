"use client";

import { useState } from "react";
import { AdminModal } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createCountry } from "@/app/(admin)/admin/countries/actions";

const INPUT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";

export function NewCountryModal() {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        New Country
      </Button>

      <AdminModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="New Country"
      >
        <form
          action={async (formData) => {
            await createCountry(formData);
            setOpen(false);
            showToast("Country created successfully");
          }}
          className="grid gap-3 p-6 sm:grid-cols-2"
        >
          <input
            name="slug"
            placeholder="Slug (e.g. denmark)"
            className={INPUT}
            required
          />
          <input
            name="name"
            placeholder="Name (e.g. Denmark)"
            className={INPUT}
            required
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">Create country</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
