"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

const KEY_VISITS = "gp_install_visits";
const KEY_DISMISSED = "gp_install_dismissed_at";
const KEY_NEVER = "gp_install_never";
const DELAY_MS = 60_000; // 1 minute before showing
const COOLDOWN_DAYS = 3; // days before re-showing after dismiss

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as Record<string, unknown>)["MSStream"]
  );
}

function isStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari, not when already installed
    if (!isIOS() || isStandalone()) return;

    // Permanently suppressed
    if (localStorage.getItem(KEY_NEVER)) return;

    // Increment visit count
    const visits = parseInt(localStorage.getItem(KEY_VISITS) ?? "0") + 1;
    localStorage.setItem(KEY_VISITS, String(visits));

    // Check dismiss cooldown
    const dismissedAt = localStorage.getItem(KEY_DISMISSED);
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return;
    }

    // Show on first visit (after delay) and on any subsequent visit
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(KEY_DISMISSED, String(Date.now()));
  };

  const dismissForever = () => {
    setVisible(false);
    localStorage.setItem(KEY_NEVER, "true");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed left-0 right-0 z-30 flex justify-center px-4 md:hidden"
      style={{
        // Sit above the bottom nav (≈64px) plus safe area
        bottom: "calc(4.75rem + env(safe-area-inset-bottom))",
        animation: "slideUpFade 300ms ease-out both",
      }}
    >
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl"
        style={{ backgroundColor: "#171717" }}
        role="dialog"
        aria-label="Add Gay Places to your Home Screen"
      >
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <Image
              src="/icons/icon-180.png"
              alt="Gay Places icon"
              width={44}
              height={44}
              className="rounded-[22%] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-[14px] font-semibold leading-tight"
                style={{ color: "#fff" }}
              >
                Add to Home Screen
              </p>
              <p
                className="text-[12px] mt-1 leading-snug"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Tap <ShareIcon /> then &ldquo;Add to Home Screen&rdquo; for the
                best experience
              </p>
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="shrink-0 -mt-0.5 -mr-1 p-1"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/install"
              onClick={dismiss}
              className="flex-1 rounded-full py-2 text-center text-[13px] font-semibold bg-white text-[#171717] active:opacity-80 transition-opacity"
            >
              Show me how
            </Link>
            <button
              onClick={dismissForever}
              className="text-[12px] py-2 px-1 shrink-0"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Don&apos;t show again
            </button>
          </div>
        </div>

        {/* Arrow indicator pointing down toward the Safari toolbar */}
        <div
          className="flex items-center justify-center gap-2 py-2 px-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <rect x="5" y="1" width="6" height="9" rx="1.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
            <path d="M8 10v4M5.5 12l2.5 2.5 2.5-2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            className="text-[11px]"
            style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-geist-mono)" }}
          >
            Tap the share button in Safari
          </span>
        </div>
      </div>
    </div>
  );
}

// Inline SVG matching the iOS Share icon shape
function ShareIcon() {
  return (
    <svg
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      display="inline-block"
      style={{ verticalAlign: "text-bottom", marginLeft: 2, marginRight: 2 }}
      aria-hidden="true"
    >
      <rect x="1.5" y="5" width="9" height="7" rx="1.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" />
      <path d="M6 1v7M3.5 3.5L6 1l2.5 2.5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
