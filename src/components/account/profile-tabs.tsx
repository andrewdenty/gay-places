"use client";

import { type ReactNode, useState } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface ProfileTabsProps {
  tabs: Tab[];
  panels: ReactNode[];
}

export function ProfileTabs({ tabs, panels }: ProfileTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      {/* Tab bar — flush with the container border */}
      <div className="flex border-b border-[var(--border)]">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActiveIndex(i)}
            className={[
              "pb-3 mr-6 last:mr-0 -mb-px",
              "text-sm font-medium border-b-2 transition-colors duration-150",
              "focus-visible:outline-none",
              i === activeIndex
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 text-xs font-normal tabular-nums text-[var(--muted-foreground)]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="mt-6">
        {panels.map((panel, i) => (
          <div key={tabs[i]?.id ?? i} className={i === activeIndex ? "" : "hidden"}>
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
}
