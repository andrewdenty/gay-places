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
      {
        source: "/blog",
        destination: "/guides",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/guides/:slug",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Legacy venue URLs missing the city slug — internally rewrite to the
      // venue-lookup page which resolves the canonical URL via DB and issues
      // a single 301 redirect. Using rewrites (not redirects) avoids a 2-hop
      // redirect chain that Google penalises.
      {
        source: "/city/venue/:slug",
        destination: "/v/:slug",
      },
      {
        source: "/city/:type(bar|club|restaurant|cafe|sauna|event-space|place)/:slug",
        destination: "/v/:slug",
      },
    ];
  },
};

export default nextConfig;
