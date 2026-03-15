export type VenueTagCategory =
  | "crowd"
  | "best_time"
  | "whats_on"
  | "atmosphere"
  | "drinks_food"
  | "music";

export type VenueTags = Partial<Record<VenueTagCategory, string[]>>;

export const TAG_CATEGORIES: {
  key: VenueTagCategory;
  label: string;
  tags: string[];
}[] = [
  {
    key: "crowd",
    label: "Crowd",
    tags: ["Mixed Crowd", "Mostly Men", "Leather", "Bears", "Touristy"],
  },
  {
    key: "best_time",
    label: "Best time",
    tags: ["Happy Hour", "Early Evening", "Late Night", "Pre-Club"],
  },
  {
    key: "whats_on",
    label: "What's on",
    tags: ["Drag Shows", "DJs", "Cabaret", "Karaoke"],
  },
  {
    key: "atmosphere",
    label: "Vibe",
    tags: ["Small Bar", "Booths", "Terrace", "Dance Floor"],
  },
  {
    key: "drinks_food",
    label: "Drinks & Food",
    tags: ["Craft Cocktails", "Beer", "Gin Bar", "Food"],
  },
  {
    key: "music",
    label: "Music",
    tags: ["Pop", "Disco", "House", "Techno"],
  },
];

/** Flatten all tags across all categories into a single array for search. */
export function flattenVenueTags(venue_tags: VenueTags): string[] {
  return TAG_CATEGORIES.flatMap(({ key }) => venue_tags[key] ?? []);
}
