import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PublicLayout({ children }: PropsWithChildren) {
  let isAdmin = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.rpc("is_admin");
      isAdmin = data === true;
    }
  } catch {
    // Non-critical: silently fail
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader isAdmin={isAdmin} />

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
