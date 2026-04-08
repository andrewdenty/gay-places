import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ArticleMeta } from "./types";

const ARTICLES_DIR = path.join(process.cwd(), "content/articles");

function parseArticle(filename: string): ArticleMeta | null {
  const filePath = path.join(ARTICLES_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);

  return {
    title: data.title ?? "",
    slug: filename.replace(/\.mdx$/, ""),
    excerpt: data.excerpt ?? "",
    author: data.author ?? "",
    publishedAt: data.publishedAt?.toString() ?? "",
    updatedAt: data.updatedAt?.toString(),
    coverImage: data.coverImage,
    cities: data.cities ?? [],
    countries: data.countries ?? [],
    venues: data.venues ?? [],
    venueLinks: data.venueLinks,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    published: data.published ?? false,
  };
}

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parseArticle)
    .filter((a): a is ArticleMeta => a !== null && a.published)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function getArticleBySlug(
  slug: string,
): { meta: ArticleMeta; content: string } | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const meta: ArticleMeta = {
    title: data.title ?? "",
    slug,
    excerpt: data.excerpt ?? "",
    author: data.author ?? "",
    publishedAt: data.publishedAt?.toString() ?? "",
    updatedAt: data.updatedAt?.toString(),
    coverImage: data.coverImage,
    cities: data.cities ?? [],
    countries: data.countries ?? [],
    venues: data.venues ?? [],
    venueLinks: data.venueLinks,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    published: data.published ?? false,
  };

  if (!meta.published) return null;

  return { meta, content };
}

export function getArticlesByCitySlug(citySlug: string): ArticleMeta[] {
  return getAllArticles().filter((a) => a.cities.includes(citySlug));
}

export function getAllArticleSlugs(): string[] {
  return getAllArticles().map((a) => a.slug);
}
