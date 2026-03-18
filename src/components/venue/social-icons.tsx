import { Instagram, Facebook } from "lucide-react";

export function InstagramIcon({ size = 24 }: { size?: number }) {
  return <Instagram size={size} strokeWidth={1.5} aria-hidden="true" />;
}

export function FacebookIcon({ size = 24 }: { size?: number }) {
  return <Facebook size={size} strokeWidth={1.5} aria-hidden="true" />;
}
