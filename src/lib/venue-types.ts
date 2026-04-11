/**
 * Single source of truth for venue types across the entire application.
 *
 * `label` is used in form <option> elements.
 * `filterLabel` is the plural form used in filter pills.
 */
export const VENUE_TYPES = [
  { value: "bar",         label: "Bar",          filterLabel: "Bars" },
  { value: "club",        label: "Club",          filterLabel: "Clubs" },
  { value: "restaurant",  label: "Restaurant",    filterLabel: "Restaurants" },
  { value: "cafe",        label: "Café",          filterLabel: "Cafés" },
  { value: "sauna",       label: "Sauna",         filterLabel: "Saunas" },
  { value: "event_space", label: "Event space",   filterLabel: "Event spaces" },
  { value: "cruising",    label: "Cruising",      filterLabel: "Cruising" },
  { value: "hotel",       label: "Hotel",         filterLabel: "Hotels" },
  { value: "shop",        label: "Shop",          filterLabel: "Shops" },
  { value: "other",       label: "Other",         filterLabel: "Other" },
] as const;

export type VenueTypeValue = (typeof VENUE_TYPES)[number]["value"];

/** Set for O(1) membership checks — use in validators and normalisers. */
export const VENUE_TYPE_SET = new Set<string>(VENUE_TYPES.map((vt) => vt.value));
