import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-markdown"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.cppserbia.org" },
      { protocol: "https", hostname: "secure.meetupstatic.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // wallpaper.png is 6144x3456 (~21 MP); keep transforms rare.
    minimumCacheTTL: 2678400, // 31 days
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
