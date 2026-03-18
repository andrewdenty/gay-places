"use client";

import { useRef, useState } from "react";
import { AdminModal } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createCity } from "@/app/(admin)/admin/cities/actions";

const INPUT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";
const SELECT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm";

type CountryOption = { name: string };

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function NewCityModal({ countries }: { countries: CountryOption[] }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const { showToast } = useToast();
  const slugRef = useRef<HTMLInputElement>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManual) {
      const generated = toSlug(e.target.value);
      setSlug(generated);
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugManual(e.target.value.length > 0);
  }

  function handleClose() {
    setOpen(false);
    setSlug("");
    setSlugManual(false);
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        New City
      </Button>

      <AdminModal
        isOpen={open}
        onClose={handleClose}
        title="New City"
      >
        <form
          action={async (formData) => {
            await createCity(formData);
            handleClose();
            showToast("City created successfully");
          }}
          className="grid gap-3 p-6 sm:grid-cols-2"
        >
          <input
            name="name"
            placeholder="Name (e.g. Copenhagen)"
            className={INPUT}
            required
            onChange={handleNameChange}
          />
          <input
            ref={slugRef}
            name="slug"
            placeholder="Slug (e.g. copenhagen)"
            className={INPUT}
            required
            value={slug}
            onChange={handleSlugChange}
          />
          <select name="country" required className={SELECT}>
            <option value="">Select country…</option>
            {countries.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="published" defaultValue="true" className={SELECT}>
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
          <input
            name="center_lat"
            placeholder="Center latitude (auto-geocoded if blank)"
            className={INPUT}
          />
          <input
            name="center_lng"
            placeholder="Center longitude (auto-geocoded if blank)"
            className={INPUT}
          />
          <textarea
            name="description"
            placeholder="City description (optional)"
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)] sm:col-span-2"
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">Create city</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
