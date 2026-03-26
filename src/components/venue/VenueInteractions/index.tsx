"use client";

import { BeenHereButton } from "./BeenHereButton";
import { RecommendButton } from "./RecommendButton";
import { useVenueInteraction } from "./useVenueInteraction";

export interface VenueInteractionCounts {
  beenHereCount: number;
  recommendCount: number;
  classicCount: number;
  trendingCount: number;
  underratedCount: number;
}

interface VenueInteractionsProps {
  venueId: string;
  initialCounts: VenueInteractionCounts;
}

export function VenueInteractions({
  venueId,
  initialCounts,
}: VenueInteractionsProps) {
  const { state, counts, toggleBeenHere, toggleRecommend } =
    useVenueInteraction(venueId, initialCounts);

  return (
    <div className="flex sm:inline-flex gap-2">
      <BeenHereButton
        count={counts.beenHereCount}
        active={state.beenHere}
        onToggle={toggleBeenHere}
      />
      <RecommendButton
        count={counts.recommendCount}
        active={state.recommend}
        onToggle={toggleRecommend}
        tagPanelOpen={false}
      />
    </div>
  );
}
