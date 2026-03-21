import type { PropsWithChildren } from "react";

type Tone = "leather" | "dance" | "cocktail" | "cafe" | "drag" | "neutral";

const dotColors: Record<Tone, string> = {
  leather: "#1D1D1D",
  dance: "#E63946",
  cocktail: "#F4A261",
  cafe: "#2A9D8F",
  drag: "#9B5DE5",
  neutral: "#B0B0B0",
};

export function Tag({
  children,
  tone = "neutral",
}: PropsWithChildren<{ tone?: Tone }>) {
  const dot = dotColors[tone] ?? dotColors.neutral;

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#efefeb] px-3 py-1">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dot }}
      />
      <span className="label-small text-[11px] uppercase tracking-[0.16em] leading-none text-[#333333]">
        {children}
      </span>
    </span>
  );
}

