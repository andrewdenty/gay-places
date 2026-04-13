"use client";

import { useState } from "react";
import { TAG_CATEGORIES, type VenueTagCategory, type VenueTags } from "@/lib/venue-tags";

type Props = {
  initialTags?: VenueTags;
  /** Name of the hidden input that will carry the JSON value. */
  inputName?: string;
  /**
   * Extra tags per category sourced from other venues — these are available
   * globally once any admin has added them to any venue and saved.
   */
  customTagOptions?: Partial<Record<VenueTagCategory, string[]>>;
  /** Called whenever the selected tags change. */
  onChange?: (tags: VenueTags) => void;
};

export function VenueTagPicker({
  initialTags = {},
  inputName = "venue_tags",
  customTagOptions = {},
  onChange,
}: Props) {
  const [selected, setSelected] = useState<VenueTags>(initialTags);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [newTagInputs, setNewTagInputs] = useState<Partial<Record<VenueTagCategory, string>>>({});

  function toggle(category: VenueTagCategory, tag: string) {
    setSelected((prev) => {
      const current = prev[category] ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      const updated = { ...prev, [category]: next };
      onChange?.(updated);
      return updated;
    });
  }

  function addCustomTag(category: VenueTagCategory, tag: string) {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setSelected((prev) => {
      const current = prev[category] ?? [];
      if (current.includes(trimmed)) return prev;
      const updated = { ...prev, [category]: [...current, trimmed] };
      onChange?.(updated);
      return updated;
    });
    setNewTagInputs((prev) => ({ ...prev, [category]: "" }));
  }

  const totalSelected = Object.values(selected).reduce(
    (sum, tags) => sum + (tags?.length ?? 0),
    0,
  );

  // Merge static tags + global custom tags + any custom tags already on this venue
  const mergedOptions = TAG_CATEGORIES.map(({ key, label, tags }) => {
    const extra = (customTagOptions[key] ?? []).filter((t) => !tags.includes(t));
    const venueCustom = (selected[key] ?? []).filter(
      (t) => !tags.includes(t) && !extra.includes(t),
    );
    return { key, label, tags: [...tags, ...extra, ...venueCustom] };
  });

  return (
    <div>
      <input type="hidden" name={inputName} value={JSON.stringify(selected)} />

      {/* ── Compact summary: selected tags as removable chips ────────── */}
      <div className="flex min-h-[28px] flex-wrap items-center gap-1.5">
        {totalSelected === 0 ? (
          <span className="text-xs italic text-muted-foreground">No tags selected</span>
        ) : (
          mergedOptions.map(({ key }) => {
            const tags = selected[key] ?? [];
            return tags.map((tag) => (
              <button
                key={`${key}:${tag}`}
                type="button"
                title={`Remove "${tag}"`}
                onClick={() => toggle(key, tag)}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs text-white transition-opacity hover:opacity-75"
              >
                {tag}
                <span className="ml-0.5 opacity-50">×</span>
              </button>
            ));
          })
        )}
      </div>

      {/* ── Expand / collapse toggle ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        {expanded ? "Hide tag picker ↑" : "Add / edit tags ↓"}
      </button>

      {/* ── Expanded picker panel ─────────────────────────────────────── */}
      {expanded && (
        <div className="mt-3 space-y-5 rounded-xl border border-border bg-muted/20 p-4">
          {/* Search / filter */}
          <input
            type="text"
            placeholder="Filter tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-accent"
          />

          {mergedOptions.map(({ key, label, tags }) => {
            const q = search.toLowerCase();
            const visibleTags = search
              ? tags.filter((t) => t.toLowerCase().includes(q))
              : tags;
            const inputVal = newTagInputs[key] ?? "";
            const isDuplicate = tags.some(
              (t) => t.toLowerCase() === inputVal.trim().toLowerCase(),
            );

            return (
              <div key={key}>
                {/* Category label */}
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {label}
                </div>

                {/* Tag pills */}
                <div className="flex flex-wrap gap-1.5">
                  {visibleTags.map((tag) => {
                    const active = (selected[key] ?? []).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggle(key, tag)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-border text-muted-foreground hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}

                  {visibleTags.length === 0 && search && (
                    <span className="text-xs italic text-muted-foreground">
                      No match
                    </span>
                  )}
                </div>

                {/* Add custom tag row */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) =>
                      setNewTagInputs((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (inputVal.trim() && !isDuplicate) {
                          addCustomTag(key, inputVal);
                        }
                      }
                    }}
                    placeholder={`New ${label.toLowerCase()} tag…`}
                    className="h-7 flex-1 rounded-lg border border-dashed border-border bg-background px-2.5 text-xs outline-none focus:border-foreground"
                  />
                  {inputVal.trim() && !isDuplicate && (
                    <button
                      type="button"
                      onClick={() => addCustomTag(key, inputVal)}
                      className="h-7 rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:border-foreground hover:text-foreground"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
