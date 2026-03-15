"use client";

import { useState } from "react";
import { TAG_CATEGORIES, type VenueTags } from "@/lib/venue-tags";

type Props = {
  initialTags?: VenueTags;
  /** Name of the hidden input that will carry the JSON value. */
  inputName?: string;
};

export function VenueTagPicker({
  initialTags = {},
  inputName = "venue_tags",
}: Props) {
  const [selected, setSelected] = useState<VenueTags>(initialTags);

  function toggle(category: keyof VenueTags, tag: string) {
    setSelected((prev) => {
      const current = prev[category] ?? [];
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [category]: next };
    });
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={inputName} value={JSON.stringify(selected)} />
      {TAG_CATEGORIES.map(({ key, label, tags }) => (
        <div key={key}>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = (selected[key] ?? []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(key, tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-border text-muted-foreground hover:border-[#171717] hover:text-[#171717]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
