import Link from "next/link";
import Image from "next/image";
import type { ArticleMeta } from "@/lib/articles/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function ArticleCard({
  article,
  compact = false,
}: {
  article: ArticleMeta;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href={`/guides/${article.slug}`}
        className="group flex flex-col gap-1 py-4 border-b-[1.5px] border-[#171717] hover:opacity-70 transition-opacity"
      >
        <div className="label-mono text-[var(--muted-foreground)]">
          {formatDate(article.publishedAt)}
          {article.cities.length > 0 && (
            <> · {article.cities[0].replace(/-/g, " ")}</>
          )}
        </div>
        <h3 className="text-[15px] text-[var(--foreground)] leading-[1.4]">
          {article.title}
        </h3>
      </Link>
    );
  }

  // Grid card label: "MONTH YEAR • CITY" or "MONTH YEAR • AUTHOR"
  const metaLabel =
    article.cities.length > 0
      ? `${formatDate(article.publishedAt)} · ${article.cities[0].replace(/-/g, " ")}`
      : `${formatDate(article.publishedAt)} · ${article.author}`;

  return (
    <Link href={`/guides/${article.slug}`} className="group">
      {/* Cover image */}
      <div className="relative aspect-square overflow-hidden bg-[#f0f0ed] mb-4">
        {article.coverImage && (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 360px"
          />
        )}
      </div>

      {/* Meta label */}
      <div className="label-mono text-[var(--muted-foreground)] mb-2">
        {metaLabel}
      </div>

      {/* Title */}
      <h3 className="h2-editorial-sm text-[var(--foreground)] leading-[1.2]">
        {article.title}
      </h3>
    </Link>
  );
}
