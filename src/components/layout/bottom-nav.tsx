"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Navigation, Search } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";

export function BottomNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Also listen for search open requests dispatched from other components
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener("site:open-search", handler);
    return () => window.removeEventListener("site:open-search", handler);
  }, []);

  type Tab = {
    label: string;
    href: string | null;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; "aria-hidden"?: boolean | "true" | "false" }>;
    isActive: boolean;
    onClick?: () => void;
  };

  const tabs: Tab[] = [
    {
      label: "Explore",
      href: "/",
      icon: Compass,
      isActive: pathname === "/",
    },
    {
      label: "Near Me",
      href: "/near-me",
      icon: Navigation,
      isActive: pathname === "/near-me",
    },
    {
      label: "Search",
      href: null,
      icon: Search,
      isActive: searchOpen,
      onClick: () => setSearchOpen(true),
    },
  ];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden border-t border-[var(--border)]"
        style={{
          backgroundColor: "rgba(252, 252, 251, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isActive;
          const color = isActive ? "#171717" : "#6E6E6D";
          const content = (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2 : 1.5}
                color={color}
                aria-hidden="true"
              />
              <span
                className="text-[11px] leading-none mt-1"
                style={{ color, fontFamily: "var(--font-geist-sans)" }}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.href) {
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center pt-3 pb-1 gap-0 transition-opacity active:opacity-60"
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tab.label}
              onClick={tab.onClick}
              className="flex flex-1 flex-col items-center justify-center pt-3 pb-1 gap-0 transition-opacity active:opacity-60"
              aria-label={tab.label}
              aria-expanded={searchOpen}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
