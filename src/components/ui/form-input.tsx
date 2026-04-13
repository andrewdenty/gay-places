import type { InputHTMLAttributes } from "react";

/**
 * Standard text input for forms.
 * Encapsulates the shared field style used across suggest, claim, and edit flows.
 * Pass `className` to add or override individual utilities (e.g. `focus:ring-0`).
 */
export function FormInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-14 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 text-base outline-none focus:border-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)] ${className}`.trimEnd()}
      {...props}
    />
  );
}
