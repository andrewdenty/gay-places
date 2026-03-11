import Image from "next/image";
import type { PropsWithChildren } from "react";
import { SiteHeader } from "@/components/layout/site-header";

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

      {/* Footer */}
      <footer className="bg-[#171717] px-4 py-10">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="flex items-center justify-between">
            <Image
              src="/logo-footer.svg"
              alt="Gay Places"
              width={87}
              height={72}
              style={{ height: 60, width: "auto" }}
            />
            <Image
              src="/rainbow-logo.svg"
              alt=""
              width={88}
              height={88}
              style={{ height: 88, width: 88 }}
            />
          </div>
          <div className="mt-6 label-xs text-white/40">
            © 2026 Gay Places
          </div>
        </div>
      </footer>
    </div>
  );
}
