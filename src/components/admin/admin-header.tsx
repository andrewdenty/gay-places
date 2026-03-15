"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NavDrawer } from "@/components/layout/nav-drawer";
import { IconButton } from "@/components/ui/icon-button";

export function AdminHeader({ userEmail }: { userEmail: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Logo + Admin label */}
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/rainbow-logo.svg"
              alt="Gay Places"
              width={24}
              height={24}
            />
            <span className="text-sm font-semibold tracking-tight">admin</span>
          </Link>

          {/* Right: View Site + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              View Site
            </Link>
            <IconButton label="Menu" onClick={() => setMenuOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="0" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="0" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="0" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </IconButton>
          </div>
        </div>
      </header>

      <NavDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        isAdmin={true}
        userEmail={userEmail}
      />
    </>
  );
}
