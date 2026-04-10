import Link from "next/link";
import Image from "next/image";
import type { ArticleMeta } from "@/lib/articles/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function GuideCard({ article }: { article: ArticleMeta }) {
  return (
    <Link
      href={`/guides/${article.slug}`}
      className="group flex gap-4 hover:opacity-70 transition-opacity"
    >
      {/* Text */}
      <div className="flex flex-col justify-center gap-[10px] min-w-0 flex-1">
        <div className="label-mono text-[var(--muted-foreground)]">
          {article.author}
          {" · "}
          {formatDate(article.publishedAt)}
        </div>

        <h3
          className="text-[var(--foreground)] line-clamp-2"
          style={{ fontSize: "17px", fontWeight: 600, lineHeight: 1.3 }}
        >
          {article.title}
        </h3>

        {article.excerpt && (
          <div className="hidden sm:block">
            <p className="text-[13px] leading-[1.5] text-[var(--foreground)] line-clamp-2">
              {article.excerpt}
            </p>
          </div>
        )}
      </div>

      {/* Cover image — square thumbnail; larger on desktop */}
      <div className="relative w-[88px] h-[88px] sm:w-[120px] sm:h-[120px] shrink-0 overflow-hidden bg-[#f0f0ed]">
        {article.coverImage && (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 120px, 88px"
          />
        )}
      </div>
    </Link>
  );
}
