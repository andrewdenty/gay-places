"use client";

import { useState } from "react";
import { Share, Check } from "lucide-react";

interface ShareButtonProps {
  venueName: string;
  cityName: string;
  url: string;
}

export function ShareButton({ venueName, cityName, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = {
      title: venueName,
      text: `${venueName} in ${cityName}`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as DOMException).name !== "AbortError") {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center h-[34px] w-[34px] sm:h-[34px] sm:w-[34px] rounded-full border border-[var(--border)] shadow-[var(--shadow)] transition-colors duration-150 hover:bg-[var(--muted)] active:bg-[var(--border)]"
      aria-label={copied ? "Link copied" : `Share ${venueName}`}
      title={copied ? "Link copied!" : "Share"}
    >
      {copied ? (
        <Check size={15} strokeWidth={1.75} className="text-[var(--foreground)]" />
      ) : (
        <Share size={15} strokeWidth={1.75} className="text-[var(--foreground)]" />
      )}
    </button>
  );
}
