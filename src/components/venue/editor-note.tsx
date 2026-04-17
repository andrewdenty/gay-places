import {
  getEditorNotePrompt,
  isEditorNotePromptKey,
  type EditorNoteAttributionType,
} from "@/lib/editor-note";

type Props = {
  prompt: string | null | undefined;
  body: string | null | undefined;
  /** Accepted for backward compatibility; attribution is no longer displayed. */
  attributionType?: EditorNoteAttributionType | string | null;
  /** Accepted for backward compatibility; attribution is no longer displayed. */
  editorName?: string | null;
};

export function EditorNote({ prompt, body }: Props) {
  if (!body || !prompt || !isEditorNotePromptKey(prompt)) return null;

  const { eyebrow } = getEditorNotePrompt(prompt);

  return (
    <figure className="mt-8">
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
