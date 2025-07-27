// --- TiktokGrid.tsx ---
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TikTokCard from './TiktokCard'; // <-- NHẬP COMPONENT MỚI

// --- Định nghĩa kiểu dữ liệu ---
interface TikTokData {
    url_tiktok: string;
    description: string | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
    niche?: string | null;
    content_angle?: string | null;
    hook_type?: string | null;
    cta_type?: string | null;
    trust_tactic?: string | null;
    product_type?: string | null;
}

interface TikTokGridProps {
    videos: TikTokData[];
    userNames: Record<string, string>;
}

export default function TikTokGrid({ videos: initialVideos, userNames }: TikTokGridProps) {
    const router = useRouter();
    const [videos, setVideos] = useState(initialVideos);
    const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

    useEffect(() => {
        const storedLikes = localStorage.getItem('likedVideos');
        if (storedLikes) {
            setLikedVideos(new Set(JSON.parse(storedLikes)));
        }
    }, []);

    useEffect(() => {
        setVideos(initialVideos);
    }, [initialVideos]);

    const handleAnalyzeClick = async (video: TikTokData) => {
        // Tăng số lượt click cục bộ để giao diện phản hồi ngay lập tức
        const updatedVideos = videos.map(v =>
            v.url_tiktok === video.url_tiktok ? { ...v, click: (v.click || 0) + 1 } : v
        );
        setVideos(updatedVideos);

        // Điều hướng đến trang phân tích
        const params = new URLSearchParams();
        params.set('url', video.url_tiktok);
        if (video.description) {
            params.set('description', video.description);
        }
        router.push(`/research?${params.toString()}`);
    };

    const handleLikeClick = (video: TikTokData) => {
        const newLikedSet = new Set(likedVideos);
        const isLiked = newLikedSet.has(video.url_tiktok);
        const action = isLiked ? 'unlike' : 'like';

        if (isLiked) {
            newLikedSet.delete(video.url_tiktok);
        } else {
            newLikedSet.add(video.url_tiktok);
        }
        setLikedVideos(newLikedSet);

        // Cập nhật số lượt tym cục bộ
        const updatedVideos = videos.map(v => {
            if (v.url_tiktok === video.url_tiktok) {
                return { ...v, tym: (v.tym || 0) + (isLiked ? -1 : 1) };
            }
            return v;
        });
        setVideos(updatedVideos);

        // Lưu vào localStorage và gửi yêu cầu lên server
        localStorage.setItem('likedVideos', JSON.stringify(Array.from(newLikedSet)));
        fetch(`/api/videos/${encodeURIComponent(video.url_tiktok)}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        }).catch(err => console.error("Failed to update like count:", err));
    };

    if (videos.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 col-span-full">
                <p>No videos match your search criteria.</p>
            </div>
        );
    }
return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 justify-items-center">
            {videos.map(video => {
                const isLiked = likedVideos.has(video.url_tiktok);
                const userName = video.userId ? (userNames[video.userId] || '...') : 'Unknown';

                return (
                    // --- THÊM WRAPPER Ở ĐÂY ---
                    // Key được chuyển ra ngoài wrapper
                    <div key={video.url_tiktok} className="relative w-full h-full">
                        <TikTokCard
                            video={video}
                            userName={userName}
                            isLiked={isLiked}
                            onAnalyzeClick={handleAnalyzeClick}
                            onLikeClick={handleLikeClick}
                        />
                    </div>
                );
            })}
        </div>
    );
}