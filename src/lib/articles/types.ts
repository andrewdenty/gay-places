export type ArticleMeta = {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  coverImage?: string;
  cities: string[];
  countries: string[];
  venues: string[];
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
};
