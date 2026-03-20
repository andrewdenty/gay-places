"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

const subTabs = [
  { label: "Plan", href: "/admin/research/plan" },
  { label: "Discover", href: "/admin/research/discover" },
  { label: "Publish", href: "/admin/research/publish" },
];

function ResearchSubNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Only show sub-nav when on a sub-page (not the overview)
  const isSubPage = subTabs.some((t) => isActive(t.href));

  return (
    <div className="border-b border-[var(--border)] bg-[var(--muted)]/30">
      <nav
        className="mx-auto flex w-full max-w-[720px] overflow-x-auto px-4 sm:px-6 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <Link
          href="/admin/research"
          className={`
            shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap
            ${
              !isSubPage
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }
          `}
        >
          Overview
        </Link>
        {subTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap
                ${
                  active
                    ? "border-[var(--foreground)] text-[var(--foreground)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }
              `}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function ResearchLayout({ children }: PropsWithChildren) {
  return (
    <div className="-mt-8">
      <ResearchSubNav />
      <div className="py-8">{children}</div>
    </div>
  );
}
