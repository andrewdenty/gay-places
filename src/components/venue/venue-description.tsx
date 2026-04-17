'use client';
import { useState } from 'react';

interface Props {
  summary: string;
  editorial?: string | null;
  /**
   * When true the full description is shown upfront with no "Read more" toggle.
   * Used when there are no photos and no editor-note quote.
   */
  defaultExpanded?: boolean;
}

export function VenueDescription({ summary, editorial, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // When the editorial begins with the summary sentence (new enrichment flow),
  // showing both would duplicate the opening sentence. In that case, show only
  // the editorial when expanded instead of summary + editorial.
  const editorialStartsWithSummary =
    !!editorial && editorial.startsWith(summary);

  return (
    <div className="mt-8">
      {!expanded && (
        <p className="text-[15px] leading-[1.55] text-[var(--foreground)]">
          {summary}
          {editorial && !defaultExpanded && (
            <>
              {' '}
              <button
                onClick={() => setExpanded(true)}
                className="underline text-[var(--foreground)] cursor-pointer bg-transparent border-none p-0 font-[inherit] text-[15px] leading-[1.55]"
              >
                Read more
              </button>
            </>
          )}
        </p>
      )}
      {editorial && expanded && (
        <>
          {!editorialStartsWithSummary && (
            <p className="text-[15px] leading-[1.55] text-[var(--foreground)]">
              {summary}
            </p>
          )}
          <p className={`text-[15px] leading-[1.55] text-[var(--foreground)]${!editorialStartsWithSummary ? ' mt-3' : ''}`}>
            {editorial}
          </p>
        </>
      )}
    </div>
  );
}
