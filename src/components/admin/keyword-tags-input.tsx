"use client";

import { useRef, useState } from "react";

interface Props {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

export function KeywordTagsInput({ keywords, onChange }: Props) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addKeyword(raw: string) {
    const term = raw.trim();
    if (!term) return;
    if (keywords.some((k) => k.toLowerCase() === term.toLowerCase())) return;
    onChange([...keywords, term]);
    setInputValue("");
  }

  function removeKeyword(index: number) {
    onChange(keywords.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && keywords.length > 0) {
      removeKeyword(keywords.length - 1);
    }
  }

  return (
    <div
      className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 flex flex-wrap gap-1.5 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {keywords.map((kw, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs text-foreground"
        >
          {kw}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeKeyword(i); }}
            className="text-muted-foreground hover:text-foreground leading-none"
            aria-label={`Remove ${kw}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addKeyword(inputValue)}
        placeholder={keywords.length === 0 ? "Type a keyword and press Enter…" : ""}
        className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
