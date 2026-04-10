import type { ArticleMeta } from "@/lib/articles/types";
import { GuideCard } from "./guide-card";

export function VenueGuides({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="py-[32px] border-b border-[var(--border)]">
      {/* Section heading — matches VenueSectionRow label style */}
      <span className="h2-editorial">Guide</span>

      {/* Article cards */}
      {articles.slice(0, 5).map((article, i) => (
        <div key={article.slug} style={{ marginTop: i === 0 ? "20px" : "16px" }}>
          <GuideCard article={article} />
        </div>
      ))}
    </div>
  );
}
