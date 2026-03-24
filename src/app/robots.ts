import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.gayplaces.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/sign-in", "/suggest"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
