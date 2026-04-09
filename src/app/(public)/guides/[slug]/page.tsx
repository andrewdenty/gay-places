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

        {/* Hero header — mobile: image → text, desktop: text → image */}
        <header className="mb-10 sm:mb-14 flex flex-col">
          {/* Cover image — first on mobile (natural order), second on desktop */}
          {meta.coverImage && (
            <div className="relative aspect-[3/2] sm:aspect-[2/1] overflow-hidden bg-[#f7f7f5] mb-8 sm:order-2 sm:mt-10 sm:mb-0">
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
          <div className="flex flex-col sm:order-1">
            {/* Section kicker */}
            <div className="label-mono text-[var(--muted-foreground)] mb-3">Guides</div>

            {/* Headline */}
            <h1 className="h1-editorial">{meta.title}</h1>

            {/* Standfirst / deck */}
            {meta.excerpt && (
              <p className="mt-4 text-[17px] text-[var(--muted-foreground)] leading-[1.6] max-w-[560px]">
                {meta.excerpt}
              </p>
            )}

            {/* Byline */}
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <span className="label-mono text-[var(--muted-foreground)]">{meta.author}</span>
              <span className="label-mono text-[var(--muted-foreground)]" aria-hidden="true">—</span>
              <span className="label-mono text-[var(--muted-foreground)]">{formatDate(meta.publishedAt)}</span>
            </div>

            {/* City + venue pill tags */}
            {(meta.cities.length > 0 || (meta.venueLinks && meta.venueLinks.length > 0)) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
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

        {/* Divider — hairline, reserves heavy black rules for featured venues */}
        <hr className="my-8 border-0 border-t border-[var(--border)]" />

        {/* Article body */}
        <ArticleBody source={content} />

        {/* Featured venues */}
        {meta.venueLinks && meta.venueLinks.length > 0 && (
          <ArticleFeaturedVenues venueLinks={meta.venueLinks} />
        )}

        {/* Footer divider — omitted when featured venues are shown; their last card's border-b already divides */}
        {(!meta.venueLinks || meta.venueLinks.length === 0) && (
          <hr className="mt-12 border-0 border-t-[1.5px] border-[#171717]" />
        )}

        {/* Back to guides */}
        <Link
          href="/guides"
          className="mt-8 inline-flex items-center gap-2 text-[15px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          All guides
        </Link>
      </article>
    </>
  );
}
