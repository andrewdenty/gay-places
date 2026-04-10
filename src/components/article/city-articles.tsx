import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleMeta } from "@/lib/articles/types";
import { GuideCard } from "./guide-card";

export function CityArticles({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 mb-2">
      {/* Section header */}
      <div className="flex items-end justify-between pb-2 border-b-[1.5px] border-[var(--foreground)]">
        <h2
          className="text-[var(--foreground)]"
          style={{
            fontFamily: "var(--font-instrument-serif), Georgia, serif",
            fontSize: "30px",
            lineHeight: 1.2,
            letterSpacing: "-0.6px",
            fontWeight: 400,
          }}
        >
          From the Guides
        </h2>
        <Link
          href="/guides"
          className="flex items-center gap-1 text-[13px] text-[var(--foreground)] leading-[1.4] pb-0.5 hover:opacity-70 transition-opacity"
        >
          All guides
          <ArrowRight size={13} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Guide rows */}
      <div>
        {articles.slice(0, 3).map((article) => (
          <div
            key={article.slug}
            className="py-6 border-b-[1.5px] border-[var(--foreground)]"
          >
            <GuideCard article={article} />
          </div>
        ))}
      </div>
    </section>
  );
}
