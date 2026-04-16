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

export function EditorNote({ prompt, body, attributionType, editorName }: Props) {
  if (!body || !prompt || !isEditorNotePromptKey(prompt)) return null;

  const { eyebrow } = getEditorNotePrompt(prompt);
  const attribution =
    attributionType === "editor" && editorName
      ? `— ${editorName.toUpperCase()}`
      : "— GAY PLACES";

  return (
    <figure className="border-b border-[var(--border)] py-[48px]">
      <div
        aria-hidden="true"
        className="select-none leading-none text-[var(--muted-foreground)]/40"
        style={{
          fontFamily:
            "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
          fontSize: "96px",
          lineHeight: 0.8,
          marginBottom: "-8px",
        }}
      >
        &ldquo;
      </div>
      <div className="label-mono mt-2 text-[var(--muted-foreground)]">
        {eyebrow}
      </div>
      <blockquote
        className="mt-3 max-w-[40ch] text-[var(--foreground)]"
        style={{
          fontFamily:
            "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
          fontSize: "28px",
          lineHeight: 1.35,
          letterSpacing: "-0.2px",
        }}
      >
        {body}
      </blockquote>
      <figcaption className="label-mono mt-5 text-[var(--muted-foreground)]">
        {attribution}
      </figcaption>
    </figure>
  );
}
