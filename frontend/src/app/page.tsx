'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import TikTokGrid from '@/components/TiktokGrid';
import Image from 'next/image';
import { Footer } from '@/components/Footer';

// --- Hằng số và Kiểu dữ liệu (giữ nguyên) ---
const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';

interface TikTokData {
    url_tiktok: string;
    description: string | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
    keyword?: string[] | null; // Thêm trường keyword nếu cần
    niche?: string | null; // Thêm trường ngách
    content_angle?: string | null; // Thêm trường góc nội dung
    hook_type?: string | null; // Thêm trường loại hook
    cta_type?: string | null; // Thêm trường loại CTA
    trust_tactic?: string | null; // Thêm trường chiến thuật tin cậy
    product_type?: string | null; // Thêm trường loại sản phẩm
}

interface CachedTiktokData {
    videos: TikTokData[];
    timestamp: number;
}


export default function Page() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videos, setVideos] = useState<TikTokData[]>([]);

    useEffect(() => {
        const fetchAndCacheData = async () => {
            // Tải từ cache trước
            try {
                const cachedItem = localStorage.getItem(TIKTOK_DATA_CACHE_KEY);
                if (cachedItem) {
                    const cachedData: CachedTiktokData = JSON.parse(cachedItem);
                    setVideos(cachedData.videos);
                }
            } catch (e) { console.error("Error reading cache:", e); }

            // Luôn fetch dữ liệu mới
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tiktok_data`);
                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
                
                const data: { tiktok: any[] } = await response.json();

                const parsedVideos: TikTokData[] = data.tiktok.map(video => {
                    let parsedKeywords: string[] | null = null;
                    if (video.keyword && typeof video.keyword === 'string') {
                        try { parsedKeywords = JSON.parse(video.keyword); } catch (e) { /* ignore */ }
                    } else if (Array.isArray(video.keyword)) {
                        parsedKeywords = video.keyword;
                    }
                    return { ...video, keyword: parsedKeywords };
                });

                setVideos(parsedVideos);
                setError(null);

                const newCacheData: CachedTiktokData = { videos: parsedVideos, timestamp: Date.now() };
                localStorage.setItem(TIKTOK_DATA_CACHE_KEY, JSON.stringify(newCacheData));
                
            } catch (err: any) {
                if (videos.length === 0) {
                   setError("Could not load video library. Please try again.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndCacheData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnalyzeClick = (video: TikTokData) => {
        const { url_tiktok, description } = video;
        const params = new URLSearchParams();
        params.set('url', url_tiktok);
        if (description) {
            params.set('description', description);
        }
        router.push(`/research?${params.toString()}`);
    };
    
    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />
            <div className="container mx-auto p-4 flex flex-col items-center text-center">
                <Image src="/images/logo.svg" alt="CaseSurf Logo" width={500} height={150} className="mb-4" />
                <p className="text-gray-600 mb-6 max-w-2xl">
                    Use the search bar to analyze a specific video, or browse the library of collected videos.
                </p>

                <div className="w-full max-w-lg space-y-4 mb-8">
                    <SearchBox 
                        onSearch={(query) => router.push(`/research?url=${encodeURIComponent(query)}`)} 
                        placeholder="Search for a TikTok video URL or description..." 
                    />
                </div>
                
                {isLoading && videos.length === 0 && ( <div className="mt-6 text-lg text-slate-500">Library Update...</div> )}
                {error && ( <div className="mt-6 w-full max-w-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><strong className="font-bold">Error: </strong><span>{error}</span></div> )}
                
                {videos.length > 0 && (
                    <TikTokGrid 
                        videos={videos.slice(0, 12
                        )} // Chỉ hiển thị 10 video
                        router={router} 
                        userNames={{}} // Giả sử không cần dữ liệu userNames ở đây
                        cardMaxWidth="320px" // Giới hạn chiều rộng card trên trang chủ
                    />
                )}
            </div>
            <Footer />
        </div>
    );
}