'use client';

import React, { useEffect, useMemo } from 'react';

// Extend the Window type to include the tiktok property
declare global {
  interface Window {
    tiktok?: {
      load: () => void;
    };
  }
}

// --- Props cho component ---
interface CustomTikTokEmbedProps {
  url: string;
  width?: string | number;
  height?: string | number;
}

const TIKTOK_SCRIPT_ID = 'tiktok-embed-script';
const TIKTOK_SCRIPT_SRC = 'https://www.tiktok.com/embed.js';

export default function CustomTikTokEmbed({
  url,
  width = '100%',
  height = '100%',
}: CustomTikTokEmbedProps) {
  const videoId = useMemo(() => {
    try {
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && /^\d+$/.test(lastPart)) {
        return lastPart;
      }
      return null;
    } catch (error) {
      console.error("Invalid TikTok URL provided:", url);
      return null;
    }
  }, [url]);

  useEffect(() => {
    // Hàm để xử lý việc nhúng sau khi script đã sẵn sàng
    const processEmbed = () => {
      if (window.tiktok) {
        window.tiktok.load();
      }
    };

    // Kiểm tra xem script đã tồn tại trên trang chưa
    const existingScript = document.getElementById(TIKTOK_SCRIPT_ID);

    if (existingScript) {
      // Nếu script đã có, chỉ cần chạy hàm xử lý
      processEmbed();
    } else {
      // Nếu chưa có, tạo script mới
      const script = document.createElement('script');
      script.id = TIKTOK_SCRIPT_ID;
      script.src = TIKTOK_SCRIPT_SRC;
      script.async = true;

      // QUAN TRỌNG: Gán hàm callback cho sự kiện onload
      // Hàm này sẽ chỉ được gọi SAU KHI script đã được tải và thực thi xong.
      script.onload = () => {
        processEmbed();
      };

      // Thêm một trình xử lý lỗi để debug nếu cần
      script.onerror = () => {
        console.error("Failed to load the TikTok embed script.");
      };
      
      // Thêm script vào body của tài liệu
      document.body.appendChild(script);
    }
    
  }, [url]); // Chạy lại effect này mỗi khi URL video thay đổi

  if (!videoId) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center bg-red-100 text-red-700 rounded-lg">
        <p>URL TikTok không hợp lệ.</p>
      </div>
    );
  }

  return (
    <div style={{ width, height }}>
      <blockquote
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Nội dung placeholder này sẽ được thay thế bởi TikTok */}
      </blockquote>
    </div>
  );
}