import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Add to Home Screen",
  description: "Add Gay Places to your Home Screen for quick access from your iPhone or iPad.",
};

export default function InstallPage() {
  return (
    <div className="py-12 max-w-sm mx-auto">
      {/* Icon + heading */}
      <div className="flex flex-col items-center text-center mb-10 gap-4">
        <Image
          src="/icons/icon-512.png"
          alt="Gay Places"
          width={80}
          height={80}
          className="rounded-[22%]"
        />
        <div>
          <h1 className="h2-heading mb-1">Add to Home Screen</h1>
          <p className="text-[15px] leading-[1.6]" style={{ color: "var(--muted-foreground)" }}>
            Access Gay Places from your Home Screen like a native app.
          </p>
        </div>
      </div>

      {/* iOS steps */}
      <div className="mb-2">
        <span className="label-mono" style={{ color: "var(--muted-foreground)" }}>iPhone &amp; iPad</span>
      </div>
      <ol className="flex flex-col divide-y" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        {[
          { step: "Open this page in Safari" },
          { step: <>Tap the <ShareIcon /> share button at the bottom of the screen</> },
          { step: <>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></> },
          { step: <>Tap <strong>&ldquo;Add&rdquo;</strong> in the top right to confirm</> },
        ].map(({ step }, i) => (
          <li key={i} className="flex items-start gap-3 py-3 text-[14px] leading-snug" style={{ color: "var(--foreground)", borderColor: "var(--border)" }}>
            <span
              className="shrink-0 text-[11px] font-mono mt-0.5 tabular-nums"
              style={{ color: "var(--muted-foreground)", minWidth: 16 }}
            >
              {i + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {/* Android */}
      <div className="mt-8 mb-2">
        <span className="label-mono" style={{ color: "var(--muted-foreground)" }}>Android</span>
      </div>
      <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        In Chrome, tap the menu icon (⋮) then <strong style={{ color: "var(--foreground)" }}>&ldquo;Add to Home screen&rdquo;</strong>.
      </p>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="13"
      height="14"
      viewBox="0 0 13 14"
      fill="none"
      style={{ display: "inline-block", verticalAlign: "text-bottom", marginInline: 1 }}
      aria-hidden="true"
    >
      <rect x="1.5" y="5.5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 1v8M4 3.5 6.5 1 9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
