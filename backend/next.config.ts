/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;