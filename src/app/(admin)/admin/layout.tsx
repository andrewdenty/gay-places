import type { PropsWithChildren } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)]">
      {/* Admin header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Logo + Admin label */}
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/rainbow-logo.svg"
              alt="Gay Places"
              width={24}
              height={24}
            />
            <span className="text-sm font-semibold tracking-tight">
              Gay Places{" "}
              <span className="text-[var(--muted-foreground)] font-normal">
                Admin
              </span>
            </span>
          </Link>

          {/* Right: View Site + Logout */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              View Site ↗
            </Link>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Tab navigation */}
        <AdminTabs />
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}

