import type { PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </div>
  );
}

