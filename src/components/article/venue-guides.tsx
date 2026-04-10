import Link from "next/link";
import Image from "next/image";
import type { ArticleMeta } from "@/lib/articles/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function VenueGuides({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="py-[32px] border-b border-[var(--border)]">
      {/* Section heading — matches VenueSectionRow label style */}
      <span className="h2-editorial">Guide</span>

      {/* Article cards */}
      {articles.map((article, i) => (
        <Link
          key={article.slug}
          href={`/guides/${article.slug}`}
          className="group flex gap-4 hover:opacity-70 transition-opacity"
          style={{ marginTop: i === 0 ? "20px" : "16px" }}
        >
          {/* Text */}
          <div className="flex flex-col justify-center gap-[10px] min-w-0 flex-1">
            {/* Meta — author · date */}
            <div className="label-mono text-[var(--muted-foreground)]">
              {article.author}
              {" · "}
              {formatDate(article.publishedAt)}
            </div>

            {/* Title — Geist sans, 17px/600 */}
            <h3
              className="text-[var(--foreground)] line-clamp-2"
              style={{ fontSize: "17px", fontWeight: 600, lineHeight: 1.3 }}
            >
              {article.title}
            </h3>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="text-[13px] leading-[1.4] text-[var(--foreground)] line-clamp-2">
                {article.excerpt}
              </p>
            )}
          </div>

          {/* Cover image — square thumbnail, right-aligned */}
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
        </Link>
      ))}
    </div>
  );
}
