import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getArticleBySlug, getAllArticleSlugs } from "@/lib/articles";
import { ArticleBody } from "@/components/article/article-body";
import { ArticleFeaturedVenues } from "@/components/article/article-featured-venues";
import { venueUrlPath } from "@/lib/slugs";

export const revalidate = 86400;

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

export async function generateStaticParams() {
  return getAllArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const { meta } = article;
  const title = meta.seoTitle || meta.title;
  const description = meta.seoDescription || meta.excerpt;

  return {
    title: `${title} — Gay Places`,
    description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: meta.publishedAt,
      ...(meta.updatedAt ? { modifiedTime: meta.updatedAt } : {}),
      ...(meta.coverImage
        ? { images: [{ url: meta.coverImage, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const { meta, content } = article;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: `${BASE_URL}/guides`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: meta.title,
        item: `${BASE_URL}/guides/${slug}`,
      },
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.seoDescription || meta.excerpt,
    author: { "@type": "Person", name: meta.author },
    datePublished: meta.publishedAt,
    ...(meta.updatedAt ? { dateModified: meta.updatedAt } : {}),
    publisher: {
      "@type": "Organization",
      name: "Gay Places",
      url: BASE_URL,
    },
    ...(meta.coverImage ? { image: meta.coverImage } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/guides/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd),
        }}
      />

      <article className="pt-8 pb-6 sm:pt-10 sm:pb-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="breadcrumb text-[var(--muted-foreground)]">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </Link>
            <span className="mx-1">/</span>
            <Link href="/guides" className="hover:text-[var(--foreground)] transition-colors">
              Guides
            </Link>
          </div>
        </div>

        {/* Cover image */}
        {meta.coverImage && (
          <div className="relative aspect-[2/1] overflow-hidden bg-[#f7f7f5] mb-8">
            <Image
              src={meta.coverImage}
              alt={meta.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 720px"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="h1-editorial">{meta.title}</h1>

        {/* Meta line */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="tag-mono text-[var(--muted-foreground)]">
            By {meta.author}
          </span>
          <span className="tag-mono text-[var(--muted-foreground)]">·</span>
          <span className="tag-mono text-[var(--muted-foreground)]">
            {formatDate(meta.publishedAt)}
          </span>
          {meta.cities.length > 0 && (
            <>
              <span className="tag-mono text-[var(--muted-foreground)]">·</span>
              {meta.cities.map((city) => (
                <Link
                  key={city}
                  href={`/city/${city}`}
                  className="inline-flex items-center rounded-full bg-[#efefeb] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#333333] hover:bg-[#e4e4e1] transition-colors"
                >
                  {city.replace(/-/g, " ")}
                </Link>
              ))}
            </>
          )}
          {meta.venueLinks && meta.venueLinks.length > 0 && (
            <>
              <span className="tag-mono text-[var(--muted-foreground)]">·</span>
              {meta.venueLinks.map((venue) => (
                <Link
                  key={venue.slug}
                  href={venueUrlPath(venue.city, venue.type, venue.slug)}
                  className="inline-flex items-center rounded-full bg-[#efefeb] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#333333] hover:bg-[#e4e4e1] transition-colors"
                >
                  {venue.slug.replace(/-/g, " ")}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Divider */}
        <hr className="my-8 border-0 border-t-[1.5px] border-[#171717]" />

        {/* Article body */}
        <ArticleBody source={content} />

        {/* Featured venues */}
        {meta.venueLinks && meta.venueLinks.length > 0 && (
          <ArticleFeaturedVenues venueLinks={meta.venueLinks} />
        )}

        {/* Footer divider */}
        <hr className="mt-12 mb-8 border-0 border-t-[1.5px] border-[#171717]" />

        {/* Back to guides */}
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 text-[15px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          All guides
        </Link>
      </article>
    </>
  );
}
