/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  optimizePackageImports: ['@clerk/nextjs', '@clerk/clerk-react'],
}

export default nextConfig
