import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  images:{
        remotePatterns: [
      {
        protocol: 'https',
        // SỬA LỖI: Dùng wildcard (**) để cho phép TẤT CẢ các tên miền phụ
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  }
};

export default nextConfig;
