"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Renders an "Admin" link for the venue contribute section only when the
 * current user is an admin. The check is done client-side so the server
 * render of the venue page (which targets ISR with revalidate) does not
 * include user-specific auth logic.
 */
export function AdminVenueLink({ venueId }: { venueId: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supabase.rpc("is_admin");
        if (data === true) setIsAdmin(true);
      } catch {
        // Silently ignore: the admin link simply won't appear if the check fails.
      }
    })();
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href={`/admin/venues/${venueId}`} className="btn-sm btn-sm-secondary">
      Admin
    </Link>
  );
}
