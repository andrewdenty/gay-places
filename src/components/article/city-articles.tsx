import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleMeta } from "@/lib/articles/types";
import { ArticleCard } from "./article-card";

export function CityArticles({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-10 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="label-mono text-[var(--foreground)]">
          From the Blog
        </span>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-[13px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          All articles
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
      <div className="flex flex-col">
        {articles.slice(0, 3).map((article) => (
          <ArticleCard key={article.slug} article={article} compact />
        ))}
      </div>
    </section>
  );
}
