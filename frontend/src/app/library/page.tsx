'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TikTokGrid from '@/components/TiktokGrid'; // Import component chung
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'; // Import custom hook

// --- Icons (giữ nguyên) ---
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const BarsArrowDownIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>);

// --- Hằng số và Kiểu dữ liệu (giữ nguyên) ---
const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';
const VIDEOS_PER_PAGE = 12; // Số video tải mỗi lần

interface TikTokData {
    id: number;
    url_tiktok: string;
    description: string | null;
    keyword: string[] | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
}

interface CachedTiktokData {
    videos: TikTokData[];
    timestamp: number;
}

export default function TiktokLibrary() {
    const router = useRouter();
    const [allVideos, setAllVideos] = useState<TikTokData[]>([]);
    const [filteredVideos, setFilteredVideos] = useState<TikTokData[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('default');

    // Sử dụng custom hook để quản lý hiển thị và tải thêm
    const { visibleItems, loadMoreItems, hasMore } = useInfiniteScroll(filteredVideos, VIDEOS_PER_PAGE);

    // Ref cho Intersection Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (isInitialLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreItems();
            }
        });

        if (node) observer.current.observe(node);
    }, [isInitialLoading, loadMoreItems, hasMore]);


    // Effect để tải dữ liệu từ cache lúc đầu
    useEffect(() => {
        try {
            const cachedItem = localStorage.getItem(TIKTOK_DATA_CACHE_KEY);
            if (cachedItem) {
                const cachedData: CachedTiktokData = JSON.parse(cachedItem);
                setAllVideos(cachedData.videos);
                setFilteredVideos(cachedData.videos);
            }
        } catch (e) {
            console.error("Error reading or parsing cache:", e);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    // Effect để lọc và sắp xếp video
    useEffect(() => {
        let processedVideos = [...allVideos];
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        if (searchTerm) {
            const isTikTokUrl = (url: string) => {
                try {
                    new URL(url);
                    return url.includes('tiktok.com');
                } catch { return false; }
            };

            if (isTikTokUrl(searchTerm)) {
                processedVideos = processedVideos.filter(video =>
                    video.url_tiktok.toLowerCase() === lowercasedSearchTerm
                );
            } else {
                processedVideos = processedVideos.filter(video =>
                    video.keyword?.some(kw =>
                        kw.toLowerCase().includes(lowercasedSearchTerm)
                    )
                );
            }
        }

        switch (sortOption) {
            case 'click_desc':
                processedVideos.sort((a, b) => (b.click || 0) - (a.click || 0));
                break;
            case 'tym_desc':
                processedVideos.sort((a, b) => (b.tym || 0) - (a.tym || 0));
                break;
            default:
                 // Sắp xếp mặc định theo ID hoặc một tiêu chí ổn định khác
                processedVideos.sort((a, b) => a.id - b.id);
                break;
        }

        setFilteredVideos(processedVideos);
    }, [searchTerm, sortOption, allVideos]);

    const handleAnalyzeClick = (video: TikTokData) => {
        const { url_tiktok, description } = video;
        const params = new URLSearchParams();
        params.set('url', url_tiktok);
        if (description) {
            params.set('description', description);
        }
        router.push(`/research?${params.toString()}`);
    };

    if (isInitialLoading) {
        return <div className="text-center p-10 text-slate-500">Loading library...</div>;
    }

    return (
        <div className="bg-slate-100 min-h-screen">
            <Navbar />
            <div className="container mx-auto p-4 md:p-8">
                <div className="text-center mb-10">
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Explore, search, and analyze collected videos to uncover breakthrough ideas.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-md sticky top-[70px] z-10 backdrop-blur-sm bg-white/80">
                    <div className="relative w-full md:flex-1">
                        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by keyword or TikTok URL"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2.5 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                    <div className="relative w-full md:w-auto">
                        <BarsArrowDownIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full md:w-56 p-2.5 pl-10 border appearance-none border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                            <option value="default">Sort by Default</option>
                            <option value="click_desc">Most Clicked</option>
                            <option value="tym_desc">Most Liked</option>
                        </select>
                    </div>
                </div>

                {/* Sử dụng component TikTokGrid với danh sách video đang hiển thị */}
                <TikTokGrid 
                    videos={visibleItems}
                     router={router} 
                />

                {/* Phần tử để trigger tải thêm */}
                <div ref={loadMoreRef} className="h-10 w-full flex justify-center items-center">
                    {hasMore && <span className="text-slate-500">Loading more...</span>}
                </div>

            </div>
        </div>
    );
}