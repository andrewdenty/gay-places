"use client";

import { useEffect, useRef, useState } from "react";
import { FormInput } from "@/components/ui/form-input";

type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

interface Props {
  value: string;
  onChange: (value: string, city?: City) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function CityAutocomplete({ value, onChange, onSubmit, inputRef }: Props) {
  const [cities, setCities] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load cities once
  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((data: City[]) => setCities(data))
      .catch(() => {});
  }, []);

  const filtered =
    value.trim().length >= 1
      ? cities
          .filter(
            (c) =>
              c.name.toLowerCase().includes(value.toLowerCase()) ||
              c.country.toLowerCase().includes(value.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const showDropdown = open && filtered.length > 0;

  function select(city: City) {
    onChange(city.name, city);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && filtered[highlighted]) {
        select(filtered[highlighted]);
      } else {
        onSubmit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <FormInput
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Berlin, London, New York…"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="focus:ring-0"
      />

      {showDropdown && (
        <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
          {filtered.map((city, i) => (
            <li key={city.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(city);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                  i === highlighted
                    ? "bg-[var(--muted)]"
                    : "hover:bg-[var(--muted)]"
                }`}
              >
                <span className="font-medium">{city.name}</span>
                <span className="ml-2 text-[var(--muted-foreground)]">{city.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
