"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { NearMeFieldButton } from "@/components/ui/near-me-field-button";

type HeroSearchProps = {
  className?: string;
};

export function HeroSearch({ className }: HeroSearchProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className={`max-w-[500px] ${className ?? ""}`}>
        {/* div instead of button because NearMeFieldButton is a <button> inside — nesting buttons is invalid HTML */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(true); }}
          className="group flex w-full items-center rounded-full border text-left transition-colors cursor-text"
          style={{
            backgroundColor: "var(--hover-bg)",
            borderColor: "var(--muted)",
            height: "56px",
            paddingLeft: "16px",
            paddingRight: "8px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--hover-bg)";
            e.currentTarget.style.borderColor = "var(--muted)";
          }}
        >
          <Search size={20} strokeWidth={1.5} className="shrink-0 text-[var(--muted-foreground)]" />
          <span className="flex-1 min-w-0 ml-3 text-[15px] text-[var(--muted-foreground)] leading-[1.4]">
            Search gay places...
          </span>
          <NearMeFieldButton onClick={() => router.push("/near-me")} />
        </div>
      </div>

      <SearchModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
