"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Locate } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { IconButton } from "@/components/ui/icon-button";

export function HeroSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="flex items-center gap-2 max-w-[500px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex flex-1 min-w-0 items-center gap-3 h-14 rounded-full border-[1.5px] px-6 text-left transition-colors cursor-text"
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
            Search gay places...
          </span>
        </button>

        <IconButton label="Find places near me" onClick={() => router.push("/near-me")}>
          <Locate size={20} strokeWidth={1.5} />
        </IconButton>
      </div>

      <SearchModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
