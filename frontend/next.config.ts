/** @type {import('next').NextConfig} */
const nextConfig = {
  // Các cấu hình khác của bạn...

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Sửa lỗi: Dùng wildcard (**) để cho phép TẤT CẢ các tên miền phụ
        hostname: '**.googleusercontent.com',
      },
    ],
  },
};

// Sửa lỗi: Sử dụng module.exports để đảm bảo tương thích
module.exports = nextConfig;