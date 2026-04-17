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

export function EditorNote({ prompt, body }: Props) {
  if (!body || !prompt || !isEditorNotePromptKey(prompt)) return null;

  const { eyebrow } = getEditorNotePrompt(prompt);

  return (
    <figure className="pt-8 pb-0">
      <div className="label-mono text-[var(--muted-foreground)]">
        {eyebrow}
      </div>
      <blockquote
        className="mt-4 max-w-[40ch] text-[var(--foreground)]"
        style={{
          fontFamily:
            "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
          fontSize: "26px",
          lineHeight: 1.3,
          letterSpacing: "-0.5px",
          fontWeight: 400,
        }}
      >
        {body}
      </blockquote>
    </figure>
  );
}
