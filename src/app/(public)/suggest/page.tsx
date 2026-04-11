import type { Metadata } from "next";
import { SuggestFlow } from "@/components/suggest/suggest-flow";

export const metadata: Metadata = {
  title: "Spot a place",
  description:
    "Know a great gay bar, club, or sauna that's missing from the map? Add it in seconds.",
};

export default function SuggestPage() {
  return <SuggestFlow />;
}
