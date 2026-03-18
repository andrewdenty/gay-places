"use client";

import { useState } from "react";
import { AdminModal } from "@/components/admin/admin-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createVenue } from "@/app/(admin)/admin/venues/actions";

type City = { id: string; name: string; slug: string };

const INPUT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]";
const SELECT =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm";

export function NewVenueModal({ cities }: { cities: City[] }) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        New Place
      </Button>

      <AdminModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="New Place"
      >
        <form
          action={async (formData) => {
            await createVenue(formData);
            setOpen(false);
            showToast("Place created successfully");
          }}
          className="grid gap-3 p-6 sm:grid-cols-2"
        >
          <select name="city_id" className={SELECT} required>
            <option value="">Select city…</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="published" defaultValue="true" className={SELECT}>
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
          <input name="name" placeholder="Name" className={INPUT} required />
          <input
            name="address"
            placeholder="Address"
            className={INPUT}
            required
          />
          <input
            name="lat"
            placeholder="Latitude"
            className={INPUT}
            required
          />
          <input
            name="lng"
            placeholder="Longitude"
            className={INPUT}
            required
          />
          <select name="venue_type" defaultValue="bar" className={SELECT}>
            <option value="bar">Bar</option>
            <option value="club">Club</option>
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Café</option>
            <option value="sauna">Sauna</option>
            <option value="event_space">Event space</option>
            <option value="other">Other</option>
          </select>
          <input
            name="website_url"
            placeholder="Website URL"
            className={INPUT}
          />
          <input
            name="google_maps_url"
            placeholder="Google Maps URL"
            className={INPUT}
          />
          <textarea
            name="description"
            placeholder="Short description"
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)] sm:col-span-2"
          />
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit">Create place</Button>
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
