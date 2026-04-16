/**
 * Editor's Note prompts — shared between the public venue page and the admin
 * edit form. Each venue can have at most one note, answering one of these
 * rotating prompts.
 */

export const EDITOR_NOTE_PROMPTS = [
  {
    key: "go_here_for",
    eyebrow: "GO HERE FOR",
    adminLabel:
      "Go here for... — situational, best for venues with a clear use case (early drinks, karaoke, cruising, dancing)",
  },
  {
    key: "special_when",
    eyebrow: "YOU'LL KNOW IT'S SPECIAL WHEN",
    adminLabel:
      "You'll know it's special when... — sensory and moment-based, best for venues with a specific atmospheric detail",
  },
  {
    key: "wont_find_elsewhere",
    eyebrow: "WHAT YOU WON'T FIND ELSEWHERE",
    adminLabel:
      "What you won't find elsewhere — comparative, best for genuinely singular places",
  },
  {
    key: "time_it_right",
    eyebrow: "TIME IT RIGHT",
    adminLabel:
      "Time it right — temporal, best for venues that change dramatically by day, night, or season",
  },
  {
    key: "locals_take",
    eyebrow: "THE LOCALS' TAKE",
    adminLabel:
      "The locals' take — social framing, best for venues defined by who goes and when",
  },
] as const;

export type EditorNotePromptKey = (typeof EDITOR_NOTE_PROMPTS)[number]["key"];

export type EditorNoteAttributionType = "editorial" | "editor" | "community";

export const EDITOR_NOTE_BODY_MIN = 40;
export const EDITOR_NOTE_BODY_MAX = 200;

export function isEditorNotePromptKey(value: unknown): value is EditorNotePromptKey {
  return (
    typeof value === "string" &&
    EDITOR_NOTE_PROMPTS.some((p) => p.key === value)
  );
}

export function getEditorNotePrompt(key: EditorNotePromptKey) {
  return EDITOR_NOTE_PROMPTS.find((p) => p.key === key)!;
}
