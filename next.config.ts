import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "metascraper",
    "metascraper-title",
    "metascraper-date",
  ],
};

export default nextConfig;
