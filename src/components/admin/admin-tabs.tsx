"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dashboard", href: "/admin" },
  { label: "Places", href: "/admin/venues" },
  { label: "Cities", href: "/admin/cities" },
  { label: "Countries", href: "/admin/countries" },
  { label: "Submissions", href: "/admin/submissions" },
  { label: "Research", href: "/admin/research" },
  { label: "Ingest", href: "/admin/ingest" },
  { label: "Candidates", href: "/admin/candidates" },
  { label: "Publish", href: "/admin/publish" },
  { label: "Analytics", href: "/admin/analytics" },
];

export function AdminTabs() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)]">
      <nav
        className="mx-auto flex w-full max-w-[720px] overflow-x-auto px-4 sm:px-6 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap
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
