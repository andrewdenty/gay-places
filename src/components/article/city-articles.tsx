import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ArticleMeta } from "@/lib/articles/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function CityArticles({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 mb-2">
      {/* Section header — mirrors Featured Cities layout */}
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

      {/* Guide rows — mirrors Featured Cities card layout */}
      <div>
        {articles.slice(0, 3).map((article) => (
          <Link
            key={article.slug}
            href={`/guides/${article.slug}`}
            className="group flex items-center justify-between border-b-[1.5px] border-[var(--foreground)] py-6 overflow-hidden"
          >
            {/* Text */}
            <div className="flex flex-col gap-2 flex-1 min-w-0 mr-4">
              <span className="text-[17px] font-semibold text-[var(--foreground)] leading-[1.4] group-hover:opacity-70 transition-opacity">
                {article.title}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--muted-foreground)] leading-[1.4]">
                <span>{formatDate(article.publishedAt)}</span>
                {article.cities.length > 0 && (
                  <>
                    <span className="text-[10px]">•</span>
                    <span className="capitalize">
                      {article.cities[0].replace(/-/g, " ")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Cover image */}
            <div className="shrink-0 size-20 sm:size-28 overflow-hidden bg-[var(--muted)]">
              {article.coverImage && (
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  width={112}
                  height={112}
                  className="size-full object-cover"
                  sizes="(max-width: 640px) 80px, 112px"
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
