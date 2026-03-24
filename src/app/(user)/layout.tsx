import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function UserLayout({ children }: PropsWithChildren) {
  return children;
}

