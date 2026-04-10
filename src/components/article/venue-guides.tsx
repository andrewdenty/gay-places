import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { ArticleMeta } from "@/lib/articles/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function VenueGuides({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <section>
      {/* Section header — matches CityArticles editorial treatment */}
      <div className="flex items-center justify-between py-[32px] border-b-[1.5px] border-[#171717]">
        <span className="label-mono text-[var(--foreground)]">
          Guides featuring this place
        </span>
        <Link
          href="/guides"
          className="flex items-center gap-1 text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          All guides
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>

      {/* Guide cards */}
      {articles.map((article) => (
        <Link
          key={article.slug}
          href={`/guides/${article.slug}`}
          className="group flex gap-4 py-5 border-b-[1.5px] border-[#171717] hover:opacity-70 transition-opacity"
        >
          {/* Cover image — square thumbnail */}
          <div className="relative w-[88px] h-[88px] shrink-0 overflow-hidden bg-[#f0f0ed]">
            {article.coverImage && (
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover"
                sizes="88px"
              />
            )}
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center gap-[6px] min-w-0 flex-1">
            {/* Meta — author · date */}
            <div className="label-mono text-[var(--muted-foreground)]">
              {article.author}
              {" · "}
              {formatDate(article.publishedAt)}
            </div>

            {/* Title — editorial serif */}
            <h3
              style={{
                fontFamily:
                  'var(--font-instrument-serif), Georgia, "Times New Roman", serif',
                fontSize: "18px",
                lineHeight: 1.3,
                letterSpacing: "-0.36px",
                fontWeight: 400,
              }}
              className="text-[var(--foreground)] line-clamp-2"
            >
              {article.title}
            </h3>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-[13px] leading-[1.4] text-[var(--muted-foreground)] line-clamp-2">
                {article.excerpt}
              </p>
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
