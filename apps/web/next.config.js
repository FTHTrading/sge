/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig = {
  reactStrictMode: true,
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? "/sge-alignment-os" : "",
  assetPrefix: isGitHubPages ? "/sge-alignment-os/" : undefined,
  transpilePackages: ["@sge/ui", "@sge/types", "@sge/utils", "@sge/core", "@sge/audit", "@sge/db"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/sge-alignment-os" : "",
  },
};

module.exports = nextConfig;
