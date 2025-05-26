/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-markdown'],
  images: {
    domains: ['secure.meetupstatic.com'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
