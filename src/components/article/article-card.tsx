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
  return (
    <Link
      href={`/guides/${article.slug}`}
      className="group flex flex-col gap-4 py-[40px] border-b-[1.5px] border-[#171717] transition-opacity hover:opacity-80"
    >
      {article.coverImage && !compact && (
        <div className="relative aspect-[3/2] overflow-hidden bg-[#f7f7f5]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 720px"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="h2-editorial text-[var(--foreground)]">
          {article.title}
        </h3>
        <p className="text-[14px] text-[var(--muted-foreground)] leading-[1.5] line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag-mono text-[var(--muted-foreground)]">
            By {article.author}
          </span>
          <span className="tag-mono text-[var(--muted-foreground)]">·</span>
          <span className="tag-mono text-[var(--muted-foreground)]">
            {formatDate(article.publishedAt)}
          </span>
          {article.cities.length > 0 && (
            <>
              <span className="tag-mono text-[var(--muted-foreground)]">·</span>
              {article.cities.map((city) => (
                <span
                  key={city}
                  className="inline-flex items-center rounded-full bg-[#efefeb] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#333333]"
                >
                  {city.replace(/-/g, " ")}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
