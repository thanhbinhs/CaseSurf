'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TikTokCard from './TiktokCard';
import { TikTokData } from '@/types/tiktok';
import { useInView } from 'react-intersection-observer'; // Thư viện để lazy loading

interface TikTokGridProps {
    videos: TikTokData[];
    userNames: Record<string, string>;
}

// Component Card Wrapper với chức năng Lazy Loading
const LazyTikTokCard = ({ video, userNames, onAnalyzeClick, onLikeClick, isLikedInitially }: any) => {
    const { ref, inView } = useInView({
        triggerOnce: true, // Chỉ tải một lần duy nhất
        rootMargin: '200px 0px', // Tải trước khi người dùng cuộn tới 200px
    });

    return (
        <div ref={ref} className="relative w-full min-h-[600px]">
            {inView ? (
                <TikTokCard
                    video={video}
                    userName={video.userId ? (userNames[video.userId] || '...') : 'Unknown'}
                    isLiked={isLikedInitially}
                    onAnalyzeClick={onAnalyzeClick}
                    onLikeClick={onLikeClick}
                />
            ) : (
                // Skeleton Loader: Giao diện giả lập trong khi chờ tải
                <div className="bg-white rounded-xl shadow-lg w-full animate-pulse">
                    <div className="bg-slate-200 h-[420px] w-full"></div>
                    <div className="p-4">
                        <div className="h-10 mb-3 bg-slate-200 rounded-md"></div>
                        <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-4"></div>
                        <div className="h-12 bg-slate-200 rounded-lg"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function TikTokGrid({ videos: initialVideos, userNames }: TikTokGridProps) {
    const router = useRouter();
    const [videos, setVideos] = useState(initialVideos);
    const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

    // Tải trước script của TikTok
    useEffect(() => {
        const scriptId = 'tiktok-embed-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://www.tiktok.com/embed.js";
            script.async = true;
            document.head.appendChild(script);
        }
    }, []);

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
        const updatedVideos = videos.map(v =>
            v.url_tiktok === video.url_tiktok ? { ...v, click: (v.click || 0) + 1 } : v
        );
        setVideos(updatedVideos);

        const params = new URLSearchParams();
        params.set('url', video.url_tiktok);
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

        const updatedVideos = videos.map(v => {
            if (v.url_tiktok === video.url_tiktok) {
                return { ...v, tym: (v.tym || 0) + (isLiked ? -1 : 1) };
            }
            return v;
        });
        setVideos(updatedVideos);

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
            {videos.map(video => (
                <LazyTikTokCard
                    key={video.url_tiktok}
                    video={video}
                    userNames={userNames}
                    isLikedInitially={likedVideos.has(video.url_tiktok)}
                    onAnalyzeClick={handleAnalyzeClick}
                    onLikeClick={handleLikeClick}
                />
            ))}
        </div>
    );
}
