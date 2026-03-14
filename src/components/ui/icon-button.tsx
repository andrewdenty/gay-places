import { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className = "", children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[#E4E4E1] hover:bg-[#F7F7F5] transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
