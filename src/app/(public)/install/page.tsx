import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Add to Home Screen",
  description: "Gay Places isn't in the App Store. Add it to your Home Screen instead.",
};

export default function InstallPage() {
  return (
    <div className="py-10 sm:py-14">

      {/* Hero */}
      <div className="mb-10">
        <div className="label-mono text-[var(--muted-foreground)] mb-2">On your phone</div>
        <h1 className="h1-editorial mb-4">
          We don&rsquo;t have<br />an app. Yet.
        </h1>
        <p className="text-[15px] text-[var(--foreground)] leading-[1.6] max-w-[480px]">
          One day, maybe. Until then, you can add Gay Places to your Home
          Screen — it&rsquo;ll sit right there with your real apps, and
          honestly, that&rsquo;s close enough.
        </p>
      </div>

      {/* iOS Home Screen preview */}
      <HomeScreenPreview />

      {/* Steps — same section-row pattern as venue pages */}
      <div className="border-t border-[var(--border)]">

        <div className="flex items-start justify-between gap-8 py-8 border-b border-[var(--border)]">
          <span className="h2-editorial shrink-0">iPhone</span>
          <ol className="flex flex-col gap-3 text-right">
            {[
              "Open this page in Safari",
              <>Tap the <ShareIcon /> share button at the bottom</>,
              <>&ldquo;Add to Home Screen&rdquo;</>,
              <>&ldquo;Add&rdquo; — you&rsquo;re done</>,
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-baseline gap-3 justify-end text-[14px] leading-snug"
                style={{ color: "var(--muted-foreground)" }}
              >
                <span>{step}</span>
                <span
                  className="font-mono text-[11px] tabular-nums shrink-0"
                  style={{ color: "var(--border)" }}
                >
                  {i + 1}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-start justify-between gap-8 py-8">
          <span className="h2-editorial shrink-0">Android</span>
          <p
            className="text-[14px] leading-snug text-right max-w-[240px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Tap the menu (⋮) in Chrome, then &ldquo;Add to Home screen&rdquo;
          </p>
        </div>

      </div>
    </div>
  );
}

// Simulated iOS home screen with our icon featured in context
function HomeScreenPreview() {
  // Placeholder icon slots — varied grays to look like real apps
  const slots: Array<{ isOurs?: boolean; shade?: string }> = [
    { shade: "#c8cdd5" },
    { shade: "#b8c4ce" },
    { isOurs: true },
    { shade: "#cac5d0" },
    { shade: "#bfc9c4" },
    { shade: "#c5bfc8" },
    { shade: "#c2c9d1" },
    { shade: "#b9c5bb" },
  ];

  return (
    <div
      className="relative rounded-3xl overflow-hidden mb-10 select-none"
      style={{
        background: "linear-gradient(150deg, #d4dde8 0%, #c8d4e0 40%, #cdd4dd 100%)",
      }}
      aria-label="Preview of Gay Places icon on an iOS Home Screen"
      role="img"
    >
      {/* Simulated status bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1">
        <span
          style={{
            fontFamily: "-apple-system, system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "#1c1c1e",
            letterSpacing: -0.2,
          }}
        >
          9:41
        </span>
        <div className="flex items-center gap-1.5">
          {/* Signal */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
            <rect x="0" y="4" width="3" height="8" rx="1" fill="#1c1c1e" />
            <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="#1c1c1e" />
            <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#1c1c1e" />
          </svg>
          {/* WiFi */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
            <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#1c1c1e" />
            <path d="M4.5 6.5C5.6 5.4 6.7 4.8 8 4.8s2.4.6 3.5 1.7" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M1.5 3.5C3.4 1.6 5.6.5 8 .5s4.6 1.1 6.5 3" stroke="#1c1c1e" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          </svg>
          {/* Battery */}
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
            <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke="#1c1c1e" strokeOpacity="0.35" />
            <rect x="2" y="2" width="16" height="8" rx="1.5" fill="#1c1c1e" />
            <path d="M22.5 4v4a1.5 1.5 0 0 0 0-4z" fill="#1c1c1e" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      {/* App grid */}
      <div className="grid grid-cols-4 gap-4 px-6 py-6">
        {slots.map((slot, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            {slot.isOurs ? (
              <>
                <Image
                  src="/icons/icon-512.png"
                  alt="Gay Places"
                  width={64}
                  height={64}
                  className="w-full aspect-square rounded-[22%]"
                  style={{
                    boxShadow:
                      "0 4px 16px rgba(0,0,0,0.2), 0 1px 4px rgba(0,0,0,0.12)",
                  }}
                  draggable={false}
                />
                <span
                  style={{
                    fontFamily: "-apple-system, system-ui, sans-serif",
                    fontSize: 10,
                    color: "#1c1c1e",
                    textShadow: "0 1px 2px rgba(255,255,255,0.4)",
                    lineHeight: 1.2,
                  }}
                >
                  Gay Places
                </span>
              </>
            ) : (
              <>
                <div
                  className="w-full aspect-square rounded-[22%]"
                  style={{ backgroundColor: slot.shade }}
                />
                <span style={{ fontSize: 10, color: "transparent", lineHeight: 1.2 }}>·</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Dock divider */}
      <div
        className="mx-6 mb-4 rounded-2xl py-3 px-4"
        style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
      >
        <div className="grid grid-cols-4 gap-4">
          {[{ shade: "#9baab8" }, { shade: "#8fa0af" }, { shade: "#98a8b6" }, { shade: "#94a4b2" }].map(
            (s, i) => (
              <div
                key={i}
                className="aspect-square rounded-[22%]"
                style={{ backgroundColor: s.shade }}
              />
            )
          )}
        </div>
      </div>
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
