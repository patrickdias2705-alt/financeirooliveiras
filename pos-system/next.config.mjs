/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    remotePatterns: [],
  },
  eslint: {
    // Avisar mas não falhar o build em produção
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Avisar mas não falhar o build em produção
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
