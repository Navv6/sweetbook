import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api-sandbox.sweetbook.com",
        pathname: "/templates_thumb/**",
      },
    ],
  },
};

export default nextConfig;
