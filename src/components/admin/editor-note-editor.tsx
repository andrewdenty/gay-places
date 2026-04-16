"use client";

import {
  EDITOR_NOTE_BODY_MAX,
  EDITOR_NOTE_BODY_MIN,
  EDITOR_NOTE_PROMPTS,
  isEditorNotePromptKey,
  type EditorNotePromptKey,
} from "@/lib/editor-note";
import { EditorNote } from "@/components/venue/editor-note";
import { Button } from "@/components/ui/button";

type Props = {
  prompt: EditorNotePromptKey | null;
  body: string;
  onPromptChange: (prompt: EditorNotePromptKey | null) => void;
  onBodyChange: (body: string) => void;
  /** Clears prompt + body (and, on save, all related fields). */
  onClear: () => void;
  /** Inline validation error shown on save attempts. */
  error?: string | null;
};

const SELECT =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
const TEXTAREA =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent";

export function EditorNoteEditor({
  prompt,
  body,
  onPromptChange,
  onBodyChange,
  onClear,
  error,
}: Props) {
  const length = body.length;
  const counterOutOfRange =
    prompt !== null &&
    (length < EDITOR_NOTE_BODY_MIN || length > EDITOR_NOTE_BODY_MAX);

  return (
    <div className="sm:col-span-2 space-y-4">
      {/* Prompt selector */}
      <div>
        <label
          htmlFor="editor_note_prompt"
          className="mb-1 block text-xs text-muted-foreground"
        >
          Prompt
        </label>
        <select
          id="editor_note_prompt"
          value={prompt ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "") {
              onClear();
              return;
            }
            if (isEditorNotePromptKey(value)) onPromptChange(value);
          }}
          className={SELECT}
        >
          <option value="">None — no editor&apos;s note</option>
          {EDITOR_NOTE_PROMPTS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.adminLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Body textarea with counter */}
      {prompt && (
        <div>
          <div className="mb-1 flex items-end justify-between gap-2">
            <label
              htmlFor="editor_note_body"
              className="text-xs text-muted-foreground"
            >
              Note body{" "}
              <span className="text-muted-foreground/60">
                — {EDITOR_NOTE_BODY_MIN}–{EDITOR_NOTE_BODY_MAX} characters
              </span>
            </label>
            <span
              className={`text-[11px] tabular-nums ${
                counterOutOfRange
                  ? "text-[var(--closed)]"
                  : "text-muted-foreground"
              }`}
              aria-live="polite"
            >
              {length} / {EDITOR_NOTE_BODY_MAX}
            </span>
          </div>
          <textarea
            id="editor_note_body"
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            rows={4}
            className={TEXTAREA}
            placeholder="A specific, punchy line about why this venue is worth visiting."
          />
          {error && (
            <p className="mt-1 text-[11px] text-[var(--closed)]" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Live preview */}
      {prompt && body && (
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Preview
          </div>
          <div className="rounded-xl border border-border bg-background px-6">
            <EditorNote
              prompt={prompt}
              body={body}
              attributionType="editorial"
            />
          </div>
        </div>
      )}

      {/* Clear button */}
      {prompt && (
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={onClear}>
            Clear note
          </Button>
        </div>
      )}
    </div>
  );
}
