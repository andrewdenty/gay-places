"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function EmailSignInForm() {
  const params = useSearchParams();
  const router = useRouter();

  const next = useMemo(() => {
    const n = params.get("next");
    return n && n.startsWith("/") ? n : "/";
  }, [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Navigate on success — keep loading=true so the button stays disabled
    // during the navigation transition.
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input
        type="email"
        id="email-signin-email"
        aria-label="Email address"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <input
        type="password"
        id="email-signin-password"
        aria-label="Password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button type="submit" variant="secondary" disabled={loading}>
        {loading ? "Signing in…" : "Sign in with email"}
      </Button>
    </form>
  );
}
