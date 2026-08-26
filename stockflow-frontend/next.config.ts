import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["typeorm", "pg", "reflect-metadata"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*", 
      },
    ];
  },
};

export default nextConfig;