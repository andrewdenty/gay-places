/**
 * Normalize a string for search comparison.
 * Lowercases and canonicalizes common Unicode apostrophe/quote variants
 * so that e.g. "Men's" (curly) matches "men's" (straight).
 */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u02BC]/g, "'");
}
