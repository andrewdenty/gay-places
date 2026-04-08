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
    <div className="pt-8 pb-6 sm:pt-10 sm:pb-8">
      <div className="mb-2">
        <h1 className="h1-editorial">Guides</h1>
        <p className="mt-4 text-[15px] text-[var(--foreground)] leading-[1.4] max-w-[560px]">
          Guides, stories and insider knowledge from the people who know these
          places best.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
          No guides yet. Check back soon.
        </p>
      ) : (
        <div className="flex flex-col border-t-[1.5px] border-[#171717]">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
