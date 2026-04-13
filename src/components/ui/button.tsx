import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
>) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors disabled:pointer-events-none";

  const sizes: Record<Size, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-sm",
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-accent text-accent-foreground hover:opacity-90 active:opacity-85 disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-fg)]",
    secondary:
      "border border-[var(--border)] bg-transparent text-foreground hover:bg-[var(--muted)] disabled:opacity-50",
    ghost:
      "bg-transparent text-foreground hover:bg-[color-mix(in_srgb,var(--muted)_70%,transparent)] disabled:opacity-50",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

