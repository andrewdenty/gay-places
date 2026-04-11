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
    tags: [
      "Mixed Crowd",
      "Mostly Men",
      "Men Only",
      "Leather",
      "Bears",
      "Touristy",
      "Easy to Meet People",
      "Party Crowd",
      "Regulars Spot",
      "Queer Mixed",
      "Gay Men's Crowd",
      "International Crowd",
      "Drag Crowd",
      "Cruisy Crowd",
      "Local Crowd",
      "Young Crowd",
      "Neighborhood Crowd",
      "Fetish",
      "Artsy Crowd",
      "Mature Crowd",
      "Cubs",
      "Solo Friendly",
      "Students",
      "Gay Friendly",
    ],
  },
  {
    key: "best_time",
    label: "Best time",
    tags: [
      "Happy Hour",
      "Early Evening",
      "Late Night",
      "Pre-Club",
      "Weekend Peak",
      "Best After Midnight",
      "After Hours",
      "End of Night",
      "Afternoon",
      "Weekday Social",
      "Sunday Session",
      "Quiet Midweek",
      "Main Event",
      "Brunch",
      "Daytime",
      "Pre-Party Drinks",
      "Dinner Time",
    ],
  },
  {
    key: "whats_on",
    label: "What's on",
    tags: [
      "Drag Shows",
      "DJs",
      "Cabaret",
      "Karaoke",
      "Live Music",
      "Theme Nights",
      "Brunch Events",
      "Go-Go Dancers",
      "Club Nights",
      "Guest DJs",
      "Steam Room",
      "Private Cabins",
      "Community Events",
      "Watch Parties",
      "Cruising Area",
      "Dress Code Nights",
      "Fetish Nights",
      "Underwear Nights",
      "Dark Room",
      "Play Area",
      "Piano Bar",
      "Big Saturdays",
      "Naked Nights",
    ],
  },
  {
    key: "atmosphere",
    label: "Vibe",
    tags: [
      "Small Bar",
      "Booths",
      "Terrace",
      "Dance Floor",
      "Community Hub",
      "Classic Institution",
      "Old-School",
      "Unpretentious",
      "Intimate",
      "No-Frills",
      "High-Energy",
      "Dark",
      "Sexy",
      "Relaxed",
      "Multi-Room",
      "Polished",
      "Spacious",
      "Playful",
      "Camp",
      "Cozy",
      "Iconic",
      "Street Seating",
      "Flirty",
      "Outdoor Seating",
    ],
  },
  {
    key: "drinks_food",
    label: "Drinks & Food",
    tags: [
      "Craft Cocktails",
      "Beer",
      "Gin Bar",
      "Food",
      "Order at Bar",
      "Happy Hour Deals",
      "Good Value",
      "Wine",
      "Non-Alcoholic Options",
      "Coffee",
      "Classic Cocktails",
      "Cheap Drinks",
      "Table Service",
      "Dinner Spot",
      "Full Menu",
    ],
  },
  {
    key: "music",
    label: "Music",
    tags: ["Pop", "Disco", "House", "Techno", "Electronic", "R&B", "Afrobeats", "Eurovision", "Alternative", "Alternative Pop", "Chart Hits", "Latin", "Rock"],
  },
];

/** Flatten all tags across all categories into a single array for search. */
export function flattenVenueTags(venue_tags: VenueTags): string[] {
  return TAG_CATEGORIES.flatMap(({ key }) => venue_tags[key] ?? []);
}
