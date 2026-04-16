import {
  getEditorNotePrompt,
  isEditorNotePromptKey,
  type EditorNoteAttributionType,
} from "@/lib/editor-note";

type Props = {
  prompt: string | null | undefined;
  body: string | null | undefined;
  attributionType?: EditorNoteAttributionType | null;
  /**
   * When attributionType === "editor" and an editor record exists, the name
   * here renders in place of "GAY PLACES". v1 never populates this — the
   * admin UI only writes "editorial" — but the render path is live so the
   * future editor-attribution flow slots in without a rewrite.
   */
  editorName?: string | null;
};

/**
 * Magazine-style editorial pull-quote rendered above the tags section.
 *
 * Layout: a centered editorial column that sets the quote apart from the
 * left-aligned body copy above and the right-aligned tag rows below, with
 * the same `border-b` used by `VenueSectionRow` so it joins the page's
 * rule system rather than floating outside it.
 */
export function EditorNote({ prompt, body, attributionType, editorName }: Props) {
  if (!body || !prompt || !isEditorNotePromptKey(prompt)) return null;

  const { eyebrow } = getEditorNotePrompt(prompt);
  const attribution =
    attributionType === "editor" && editorName
      ? `— ${editorName.toUpperCase()}`
      : "— GAY PLACES";

  return (
    <figure className="border-b border-[var(--border)] py-[72px] sm:py-[88px]">
      <div className="mx-auto flex max-w-[48ch] flex-col items-center text-center">
        {/* Eyebrow — mono cap, same micro-typography family as breadcrumbs */}
        <div className="label-mono text-[var(--muted-foreground)]">
          {eyebrow}
        </div>

        {/* Decorative opening quote — hanging typographic accent, not a brick.
            Sits just above the body with negative margin so it reads as
            punctuation belonging to the quote rather than a separate object. */}
        <span
          aria-hidden="true"
          className="mt-5 select-none text-[var(--muted-foreground)]"
          style={{
            fontFamily:
              "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
            fontSize: "64px",
            lineHeight: 0.8,
            letterSpacing: "-0.02em",
            opacity: 0.35,
            marginBottom: "-12px",
          }}
        >
          &ldquo;
        </span>

        {/* Body — 30px Instrument Serif echoes h2-editorial ("Crowd", "Vibe")
            section labels so the quote feels part of the page's type system. */}
        <blockquote
          className="text-[var(--foreground)]"
          style={{
            fontFamily:
              "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
            fontSize: "30px",
            lineHeight: 1.3,
            letterSpacing: "-0.5px",
            fontWeight: 400,
          }}
        >
          {body}
        </blockquote>

        <figcaption className="label-mono mt-8 text-[var(--muted-foreground)]">
          {attribution}
        </figcaption>
      </div>
    </figure>
  );
}
