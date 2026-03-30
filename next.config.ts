import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oxdlypfblekvcsfarghv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      // Redirect non-www to www so Google picks the correct canonical.
      {
        source: "/:path*",
        has: [{ type: "host", value: "gayplaces.co" }],
        destination: "https://www.gayplaces.co/:path*",
        permanent: true,
      },

      // Legacy venue URLs with a missing city slug — indexed by Google from an old
      // sitemap that omitted the city. After double-slash normalization
      // (/city//venue/slug → /city/venue/slug) the city segment is "venue" or the
      // venue type, neither of which is a valid city slug. Route through the venue
      // lookup page which resolves the canonical URL via DB.
      {
        source: "/city/venue/:slug",
        destination: "/v/:slug",
        permanent: true,
      },
      {
        source: "/city/:type(bar|club|restaurant|cafe|sauna|event-space|place)/:slug",
        destination: "/v/:slug",
        permanent: true,
      },

      // /about and /submit were crawled by Google but never existed as routes.
      {
        source: "/about",
        destination: "/",
        permanent: true,
      },
      {
        source: "/submit",
        destination: "/suggest",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
