import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Если репозиторий не в корне GitHub, раскомментируйте и укажите имя репозитория:
  // basePath: '/derdiedas',
  // assetPrefix: '/derdiedas',
};

export default nextConfig;
