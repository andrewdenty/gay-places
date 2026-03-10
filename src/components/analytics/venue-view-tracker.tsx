"use client";

import { useEffect } from "react";

export function VenueViewTracker({ venueId }: { venueId: string }) {
  useEffect(() => {
    fetch("/api/analytics/venue-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venue_id: venueId }),
    }).catch(() => {});
  }, [venueId]);

  return null;
}

