"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Lazy-load the smart add button — never shipped to non-admin visitors
const SmartAddButton = dynamic(
  () => import("@/components/admin/smart-add-button").then((m) => m.SmartAddButton),
  { ssr: false, loading: () => <AddPlaceLink /> },
);

function AddPlaceLink() {
  return (
    <Link
      href="/suggest"
      className="rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[var(--hover-bg)] shrink-0"
      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
    >
      Add a place
    </Link>
  );
}

export function CityAddPlaceButton({ citySlug }: { citySlug: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supabase.rpc("is_admin");
        if (data === true) setIsAdmin(true);
      } catch {
        // Silently ignore
      }
    })();
  }, []);

  if (!isAdmin) return <AddPlaceLink />;

  return (
    <SmartAddButton
      defaultCitySlug={citySlug}
      size="sm"
      renderTrigger={({ onClick }) => (
        <button
          type="button"
          onClick={onClick}
          className="rounded-[60px] border px-3 py-2 text-[13px] leading-[1.4] transition-colors hover:bg-[var(--hover-bg)] shrink-0"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Add a place
        </button>
      )}
    />
  );
}
