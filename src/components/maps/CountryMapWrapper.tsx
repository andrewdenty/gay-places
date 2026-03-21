"use client";

import dynamic from "next/dynamic";
import type { VenueCoord } from "@/lib/data/public";

const CountryMap = dynamic(
  () => import("@/components/maps/CountryMap").then((m) => m.CountryMap),
  { ssr: false }
);

type Props = {
  venues: VenueCoord[];
  center: [number, number];
};

export function CountryMapWrapper({ venues, center }: Props) {
  return <CountryMap venues={venues} center={center} />;
}
