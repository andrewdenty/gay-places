import type { Metadata } from "next";
import Image from "next/image";
import { RainbowLogo } from "@/components/ui/rainbow-logo";

export const metadata: Metadata = {
  title: "Get the App",
  description:
    "Add Gay Places to your Home Screen for an app-like experience — no App Store required.",
};

const steps = [
  {
    number: 1,
    title: "Open Gay Places in Safari",
    description:
      "Make sure you're using Safari on your iPhone or iPad. The install option isn't available in other browsers.",
    icon: <SafariIcon />,
  },
  {
    number: 2,
    title: 'Tap the Share button',
    description:
      'Tap the Share icon at the bottom of the screen — it looks like a box with an arrow pointing upward.',
    icon: <ShareIcon />,
  },
  {
    number: 3,
    title: '"Add to Home Screen"',
    description:
      'Scroll down in the share sheet and tap "Add to Home Screen". You may need to scroll to find it.',
    icon: <AddIcon />,
  },
  {
    number: 4,
    title: "Tap Add",
    description:
      'Tap "Add" in the top-right corner to confirm. Gay Places will appear on your Home Screen like a native app.',
    icon: <ConfirmIcon />,
  },
];

const benefits = [
  { label: "Full screen", detail: "No browser address bar cluttering the view" },
  { label: "Instant launch", detail: "Opens in a second, right from your Home Screen" },
  { label: "Works offline", detail: "Previously visited pages load even without signal" },
  { label: "Free forever", detail: "No App Store, no subscriptions, no downloads" },
];

export default function InstallPage() {
  return (
    <div className="py-10 pb-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-5">
          <div className="relative">
            <Image
              src="/icons/icon-512.png"
              alt="Gay Places app icon"
              width={96}
              height={96}
              className="rounded-[22%] shadow-md"
            />
          </div>
        </div>
        <h1 className="h2-heading mb-2">Gay Places on your Home Screen</h1>
        <p className="text-[15px] leading-[1.6]" style={{ color: "var(--muted-foreground)" }}>
          Install the app in seconds — no App Store required. It&rsquo;s free and works just like a native app.
        </p>
      </div>

      {/* Benefits */}
      <div
        className="rounded-2xl mb-10 overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {benefits.map((b, i) => (
          <div
            key={b.label}
            className="flex items-center justify-between gap-4 px-4 py-3"
            style={{
              borderBottom: i < benefits.length - 1 ? "1px solid var(--border)" : undefined,
            }}
          >
            <span className="text-[14px] font-medium" style={{ color: "var(--foreground)" }}>
              {b.label}
            </span>
            <span
              className="text-[13px] text-right"
              style={{ color: "var(--muted-foreground)" }}
            >
              {b.detail}
            </span>
          </div>
        ))}
      </div>

      {/* Steps — iOS */}
      <div className="mb-3">
        <span
          className="label-mono"
          style={{ color: "var(--muted-foreground)", letterSpacing: "1.2px" }}
        >
          iPhone &amp; iPad
        </span>
      </div>

      <div className="flex flex-col gap-4 mb-10">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Step icon */}
            <div
              className="shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: 44,
                height: 44,
                backgroundColor: "var(--muted)",
              }}
            >
              {step.icon}
            </div>

            {/* Step text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="text-[10px] font-mono uppercase"
                  style={{ color: "var(--muted-foreground)", letterSpacing: "0.8px" }}
                >
                  Step {step.number}
                </span>
              </div>
              <p className="text-[14px] font-semibold leading-tight mb-0.5">{step.title}</p>
              <p className="text-[13px] leading-snug" style={{ color: "var(--muted-foreground)" }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Android section */}
      <div className="mb-3">
        <span
          className="label-mono"
          style={{ color: "var(--muted-foreground)", letterSpacing: "1.2px" }}
        >
          Android
        </span>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ border: "1px solid var(--border)" }}
      >
        <p className="text-[14px] font-semibold mb-1">Add to Home Screen</p>
        <p className="text-[13px] leading-snug" style={{ color: "var(--muted-foreground)" }}>
          Open Gay Places in Chrome. Tap the menu icon (⋮) in the top-right corner, then tap{" "}
          <strong>&ldquo;Add to Home screen&rdquo;</strong>. Chrome may also show an install
          prompt at the bottom of the screen — tap it to install.
        </p>
      </div>

      {/* Footer note */}
      <div className="mt-10 flex justify-center">
        <RainbowLogo size="sm" />
      </div>
    </div>
  );
}

// Step icons — simple inline SVGs matching iOS visual language

function SafariIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9" stroke="#171717" strokeWidth="1.3" />
      <path d="M11 2v2M11 18v2M2 11h2M18 11h2" stroke="#171717" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14.5 7.5l-4 2.5-1 4 4-2.5 1-4z" stroke="#171717" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
      <rect x="2" y="8" width="16" height="13" rx="2.5" stroke="#171717" strokeWidth="1.3" />
      <path d="M10 1v12" stroke="#171717" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.5 4.5L10 1l3.5 3.5" stroke="#171717" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="18" height="18" rx="3" stroke="#171717" strokeWidth="1.3" />
      <path d="M11 7v8M7 11h8" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ConfirmIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9" stroke="#171717" strokeWidth="1.3" />
      <path d="M7 11.5l3 3 5-5" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
