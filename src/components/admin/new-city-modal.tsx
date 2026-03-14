"use client";

import { useState } from "react";
import { AdminModal } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";
import { createCity } from "@/app/(admin)/admin/cities/actions";

const INPUT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";
const SELECT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm";

export function NewCityModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        New City
      </Button>

      <AdminModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="New City"
      >
        <form
          action={async (formData) => {
            await createCity(formData);
            setOpen(false);
          }}
          className="grid gap-3 p-6 sm:grid-cols-2"
        >
          <input
            name="slug"
            placeholder="Slug (e.g. copenhagen)"
            className={INPUT}
            required
          />
          <input
            name="name"
            placeholder="Name (e.g. Copenhagen)"
            className={INPUT}
            required
          />
          <input
            name="country"
            placeholder="Country (e.g. Denmark)"
            className={INPUT}
            required
          />
          <select name="published" defaultValue="true" className={SELECT}>
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
          <input
            name="center_lat"
            placeholder="Center latitude"
            className={INPUT}
            required
          />
          <input
            name="center_lng"
            placeholder="Center longitude"
            className={INPUT}
            required
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">Create city</Button>
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
