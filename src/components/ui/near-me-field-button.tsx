"use client";

import { Locate } from "lucide-react";

interface NearMeFieldButtonProps {
  onClick: () => void;
}

export function NearMeFieldButton({ onClick }: NearMeFieldButtonProps) {
  return (
    <button
      type="button"
      aria-label="Near me"
      title="Near me"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="shrink-0 flex items-center justify-center rounded-full transition-colors h-10 w-10 sm:w-auto sm:pl-3 sm:pr-2"
      style={{
        backgroundColor: "#F7F7F5",
        color: "#6E6E6D",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#FFFFFF";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#F7F7F5";
      }}
    >
      <Locate size={18} strokeWidth={1.5} className="shrink-0" />
      <span className="hidden sm:inline ml-1.5 text-[13px] leading-[1] whitespace-nowrap">
        Near me
      </span>
    </button>
  );
}
