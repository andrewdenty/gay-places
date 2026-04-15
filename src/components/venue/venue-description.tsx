'use client';
import { useState } from 'react';

interface Props {
  summary: string;
  editorial?: string | null;
}

export function VenueDescription({ summary, editorial }: Props) {
  const [expanded, setExpanded] = useState(false);

  // When the editorial begins with the summary sentence (new enrichment flow),
  // showing both would duplicate the opening sentence. In that case, show only
  // the editorial when expanded instead of summary + editorial.
  const editorialStartsWithSummary =
    !!editorial && editorial.startsWith(summary);

  return (
    <div className="mt-4">
      {!expanded && (
        <p className="text-[15px] leading-[1.4] text-[var(--foreground)]">
          {summary}
          {editorial && (
            <>
              {' '}
              <button
                onClick={() => setExpanded(true)}
                className="underline text-[var(--foreground)] cursor-pointer bg-transparent border-none p-0 font-[inherit] text-[15px] leading-[1.4]"
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
            <p className="text-[15px] leading-[1.4] text-[var(--foreground)]">
              {summary}
            </p>
          )}
          <p className={`text-[15px] leading-[1.4] text-[var(--foreground)]${!editorialStartsWithSummary ? ' mt-3' : ''}`}>
            {editorial}
          </p>
        </>
      )}
    </div>
  );
}
