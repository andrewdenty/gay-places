import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
        <div className="mb-8 sm:mb-10">
          <div className="breadcrumb text-[var(--muted-foreground)] text-center">
            <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </Link>
            <span className="mx-1">/</span>
            <Link href="/guides" className="hover:text-[var(--foreground)] transition-colors">
              Guides
            </Link>
          </div>
        </div>

        {/* Hero header — mobile: image → text, desktop: text → image */}
        <header className="mb-10 sm:mb-14 flex flex-col">
          {/* Cover image — first on mobile (natural order), second on desktop */}
          {meta.coverImage && (
            <div className="relative aspect-square overflow-hidden bg-[#f7f7f5] mb-8 sm:order-2 sm:mt-10 sm:mb-0">
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

          {/* Text block — second on mobile, first on desktop */}
          <div className="flex flex-col items-center text-center sm:order-1">
            {/* Headline */}
            <h1 className="h1-editorial sm:max-w-[560px]">{meta.title}</h1>

            {/* Author + date below headline */}
            <div className="flex items-center gap-3 mt-4">
              <span className="label-mono text-[var(--muted-foreground)]">{meta.author}</span>
              <span className="label-mono text-[var(--muted-foreground)]" aria-hidden="true">—</span>
              <span className="label-mono text-[var(--muted-foreground)]">{formatDate(meta.publishedAt)}</span>
            </div>

            {/* Tags below author/date */}
            {(meta.cities.length > 0 || (meta.venueLinks && meta.venueLinks.length > 0)) && (
              <div className="flex items-center justify-center gap-2 flex-wrap mt-10 mb-2">
                {meta.cities.map((city) => (
                  <Link
                    key={city}
                    href={`/city/${city}`}
                    className="inline-flex items-center rounded-full bg-[#efefeb] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#333333] hover:bg-[#e4e4e1] transition-colors"
                  >
                    {city.replace(/-/g, " ")}
                  </Link>
                ))}
                {meta.venueLinks?.map((venue) => (
                  <Link
                    key={venue.slug}
                    href={venueUrlPath(venue.city, venue.type, venue.slug)}
                    className="inline-flex items-center rounded-full bg-[#efefeb] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#333333] hover:bg-[#e4e4e1] transition-colors"
                  >
                    {venue.slug.replace(/-/g, " ")}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Article body */}
        <ArticleBody source={content} />

        {/* Featured venues */}
        {meta.venueLinks && meta.venueLinks.length > 0 && (
          <ArticleFeaturedVenues venueLinks={meta.venueLinks} />
        )}

        <div className="h-8" />
      </article>
    </>
  );
}
