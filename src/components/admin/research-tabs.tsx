"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Plan", href: "/admin/research/plan" },
  { label: "New Places", href: "/admin/research/new-places" },
  { label: "Publish", href: "/admin/research/publish" },
];

export function ResearchTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex gap-1 border-b border-[var(--border)]">
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              shrink-0 border-b-2 px-3 py-2 text-sm transition-colors whitespace-nowrap -mb-px
              ${
                active
                  ? "border-[var(--foreground)] text-[var(--foreground)] font-medium"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
