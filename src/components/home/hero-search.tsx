"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";

export function HeroSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full max-w-[500px] items-center gap-3 h-14 rounded-full border-[1.5px] px-6 text-left transition-colors cursor-text"
        style={{
          backgroundColor: "#F7F7F5",
          borderColor: "#F0F0ED",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#F0F0ED";
          e.currentTarget.style.borderColor = "#E4E4E1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#F7F7F5";
          e.currentTarget.style.borderColor = "#F0F0ED";
        }}
      >
        <Search size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted-foreground)]" />
        <span className="text-[15px] text-[var(--muted-foreground)] leading-[1.4]">
          Search bars, clubs, places and cities…
        </span>
      </button>

      <SearchModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
