"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { NearMeFieldButton } from "@/components/ui/near-me-field-button";

export function HeroSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="max-w-[500px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex w-full items-center rounded-full border text-left transition-colors cursor-text"
          style={{
            backgroundColor: "#F7F7F5",
            borderColor: "#F0F0ED",
            height: "56px",
            paddingLeft: "16px",
            paddingRight: "8px",
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
          <span className="flex-1 min-w-0 ml-3 text-[15px] text-[var(--muted-foreground)] leading-[1.4]">
            Search gay places...
          </span>
          <NearMeFieldButton onClick={() => router.push("/near-me")} />
        </button>
      </div>

      <SearchModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
