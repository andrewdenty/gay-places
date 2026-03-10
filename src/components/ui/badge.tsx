import type { PropsWithChildren } from "react";

export function Badge({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground ${className}`}
    >
      {children}
    </span>
  );
}

