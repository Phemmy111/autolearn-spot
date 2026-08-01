/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,  // Re-enabled for local development
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
