import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article/article-card";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Guides — Gay Places",
  description:
    "Guides, stories and insider knowledge from the people who know these places best.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Guides — Gay Places",
    description:
      "Guides, stories and insider knowledge from the people who know these places best.",
  },
};

export default function GuidesPage() {
  const articles = getAllArticles();

  return (
    <div className="pt-12 sm:pt-16 pb-6 sm:pb-8">
      {/* Hero — centred, generous whitespace */}
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="h1-editorial mb-5">Guides</h1>
        <p className="text-[15px] text-[var(--muted-foreground)] leading-[1.6] max-w-[380px] mx-auto">
          Stories and insider knowledge from the people who know these places best.
        </p>
      </div>

      {/* Thin rule separating hero from grid */}
      <hr className="border-0 border-t border-[var(--border)] mb-12 sm:mb-16" />

      {articles.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
          No guides yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
