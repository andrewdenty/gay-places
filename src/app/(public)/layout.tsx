import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />

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
