import Link from "next/link";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function UserNav() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        Sign in
      </Link>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        Sign in
      </Link>
    );
  }

  return (
    <form action="/auth/sign-out" method="post">
      <button
        type="submit"
        className="rounded-full px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        Sign out
      </button>
    </form>
  );
}

