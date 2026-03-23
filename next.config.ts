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
    ];
  },
};

export default nextConfig;
