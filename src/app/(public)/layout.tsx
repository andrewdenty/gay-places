import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { IOSInstallBanner } from "@/components/pwa/ios-install-banner";
import { ToastProvider } from "@/components/ui/toast";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTopCitiesByVenueCount } from "@/lib/data/public";

export default async function PublicLayout({ children }: PropsWithChildren) {
  let isAdmin = false;
  let userEmail: string | undefined;
  let initialCities: { id: string; slug: string; name: string; country: string; venue_count: number }[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    const [
      {
        data: { user },
      },
      cities,
    ] = await Promise.all([
      supabase.auth.getUser(),
      getTopCitiesByVenueCount(4).catch(() => []),
    ]);
    initialCities = cities;
    if (user) {
      userEmail = user.email;
      const { data } = await supabase.rpc("is_admin");
      isAdmin = data === true;
    }
  } catch {
    // Non-critical: silently fail
  }

  return (
    <ToastProvider>
      <div className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <SiteHeader isAdmin={isAdmin} userEmail={userEmail} initialCities={initialCities} />

        {/* Main content — extra bottom padding on mobile for the bottom nav */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </div>
        </main>

        <SiteFooter />
        <BottomNav />
        <IOSInstallBanner />
      </div>
    </ToastProvider>
  );
}
