import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  label: string;
  bordered?: boolean;
  className?: string;
}>;

export function VenueSectionRow({
  label,
  bordered = true,
  className = "",
  children,
}: Props) {
  return (
    <div
      className={`flex items-center justify-between gap-6 py-[32px] ${
        bordered ? "border-b border-[var(--border)]" : ""
      } ${className}`}
    >
      <span className="h2-editorial shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
