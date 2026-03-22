'use client';
import { useState } from 'react';

interface Props {
  summary: string;
  editorial?: string | null;
}

export function VenueDescription({ summary, editorial }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4">
      <p className="text-[15px] leading-[1.4] text-[var(--foreground)]">
        {summary}
        {editorial && !expanded && (
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
      {editorial && expanded && (
        <p className="mt-3 text-[15px] leading-[1.4] text-[var(--foreground)]">
          {editorial}
        </p>
      )}
    </div>
  );
}
