"use client";

import dynamic from "next/dynamic";

const VenueMap = dynamic(
  () => import("./VenueMap").then((m) => m.VenueMap),
  { ssr: false }
);

type Props = {
  lat: number;
  lng: number;
  name: string;
  googleMapsUrl?: string | null;
};

export function VenueMapWrapper(props: Props) {
  return <VenueMap {...props} />;
}
