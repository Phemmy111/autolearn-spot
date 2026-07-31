/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking to catch build issues
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', '@clerk/clerk-react'],
  },
  // Disable build caching to ensure fresh builds
  webpack: (config) => {
    config.cache = false
    return config
  },
}

export default nextConfig
