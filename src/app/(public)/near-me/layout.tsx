import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Gay Places Near Me",
  description:
    "Find gay bars, clubs and queer venues near your current location. Discover the closest LGBTQ+ spaces wherever you are.",
  alternates: { canonical: "/near-me" },
  openGraph: {
    title: "Gay Places Near Me",
    description:
      "Find gay bars, clubs and queer venues near your current location. Discover the closest LGBTQ+ spaces wherever you are.",
  },
};

export default function NearMeLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
