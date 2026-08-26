import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["typeorm", "pg", "reflect-metadata"],
};

export default nextConfig;
