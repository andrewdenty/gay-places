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
    "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

  const sizes: Record<Size, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-sm",
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-accent text-accent-foreground hover:opacity-90 active:opacity-85",
    secondary:
      "bg-muted text-foreground hover:bg-[color-mix(in_srgb,var(--muted)_85%,transparent)]",
    ghost:
      "bg-transparent text-foreground hover:bg-[color-mix(in_srgb,var(--muted)_70%,transparent)]",
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

