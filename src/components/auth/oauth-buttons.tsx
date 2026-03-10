"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function OAuthButtons() {
  const params = useSearchParams();
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  const next = useMemo(() => {
    const n = params.get("next");
    return n && n.startsWith("/") ? n : "/";
  }, [params]);

  async function signIn(provider: "google" | "apple") {
    setLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        onClick={() => signIn("google")}
        disabled={loading !== null}
      >
        {loading === "google" ? "Opening Google…" : "Continue with Google"}
      </Button>
      <Button
        type="button"
        onClick={() => signIn("apple")}
        variant="secondary"
        disabled={loading !== null}
      >
        {loading === "apple" ? "Opening Apple…" : "Continue with Apple"}
      </Button>
    </div>
  );
}

