import type { PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-xl border border-border bg-card text-card-foreground ${className}`}
    >
      {children}
    </div>
  );
}

