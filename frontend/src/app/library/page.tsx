'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import TikTokGrid from '@/components/TiktokGrid';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Footer } from '@/components/Footer';

// --- Icons ---
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const BarsArrowDownIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>);
const TagIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>);

// --- Hằng số và Kiểu dữ liệu ---
const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';
const VIDEOS_PER_PAGE = 12;

// Cấu trúc dữ liệu mới cho video
interface TikTokData {
    id: number;
    url_tiktok: string;
    description: string | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
    keyword?: string[] | null;
    niche?: string | null;
    content_angle?: string | null;
    hook_type?: string | null;
    cta_type?: string | null;
    trust_tactic?: string | null;
    product_type?: string | null;
}

interface KeywordData {
    keyword: string;
    count: number;
}

export default function TiktokLibrary() {
    const router = useRouter();
    const [allVideos, setAllVideos] = useState<TikTokData[]>([]);
    const [filteredVideos, setFilteredVideos] = useState<TikTokData[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('default');

    const [topKeywords, setTopKeywords] = useState<KeywordData[]>([]);
    const [keywordsLoading, setKeywordsLoading] = useState(true);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    const { visibleItems, loadMoreItems, hasMore } = useInfiniteScroll(filteredVideos, VIDEOS_PER_PAGE);

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

    // Effect để tải dữ liệu video, keywords, và usernames
    useEffect(() => {
        const fetchData = async () => {
            let videosFromCache: TikTokData[] = [];
            // Tải video từ cache
            try {
                const cachedItem = localStorage.getItem(TIKTOK_DATA_CACHE_KEY);
                if (cachedItem) {
                    const cachedData = JSON.parse(cachedItem);
                    videosFromCache = cachedData.videos;
                    setAllVideos(videosFromCache);
                    setFilteredVideos(videosFromCache);
                }
            } catch (e) { console.error("Error reading cache:", e); }
            finally { setIsInitialLoading(false); }

            // --- THÊM LOGIC: Lấy tên người dùng ---
            if (videosFromCache.length > 0) {
                // Lấy danh sách các ID người dùng duy nhất
                const userIds = [...new Set(videosFromCache.map(v => v.userId).filter(Boolean))] as string[];

                if (userIds.length > 0) {
                    try {
                        const usersRef = collection(db, 'users');

                        // THAY ĐỔI: Tìm kiếm dựa trên trường 'uid' thay vì ID của document
                        const q = query(usersRef, where('uid', 'in', userIds));

                        const querySnapshot = await getDocs(q);
                        const namesMap: Record<string, string> = {};

                        querySnapshot.forEach((doc) => {
                            const userData = doc.data();
                            // Dùng userData.uid để làm key cho map
                            namesMap[userData.uid] = userData.username || 'Unknown User';
                        });

                        setUserNames(namesMap);
                    } catch (error) {
                        console.error("Error fetching usernames:", error);
                    }
                }
            }

            // Tải keywords từ backend (giữ nguyên)
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/keywords`);
                if (!response.ok) throw new Error('Failed to fetch keywords');
                const data: KeywordData[] = await response.json();
                setTopKeywords(data || []);

            } catch (error) {
                console.error("Error fetching top keywords:", error);
            } finally {
                setKeywordsLoading(false);
            }
        };
        fetchData();
    }, []);
    useEffect(() => {
        let processedVideos = [...allVideos];
        // SỬA LỖI 1: Đảm bảo searchTerm luôn là một chuỗi trước khi gọi toLowerCase
        const lowercasedSearchTerm = (searchTerm || '').toLowerCase();

        if (lowercasedSearchTerm) { // Sử dụng biến đã được xử lý
            processedVideos = processedVideos.filter(video => {
                const isUrlMatch = video.url_tiktok.toLowerCase().includes(lowercasedSearchTerm);
                const isKeywordMatch = video.keyword?.some(kw => kw.toLowerCase().includes(lowercasedSearchTerm));
                const isNicheMatch = video.niche?.toLowerCase().includes(lowercasedSearchTerm);
                const isContentAngleMatch = video.content_angle?.toLowerCase().includes(lowercasedSearchTerm);
                const isHookTypeMatch = video.hook_type?.toLowerCase().includes(lowercasedSearchTerm);
                const isCtaTypeMatch = video.cta_type?.toLowerCase().includes(lowercasedSearchTerm);
                const isTrustTacticMatch = video.trust_tactic?.toLowerCase().includes(lowercasedSearchTerm);
                const isProductTypeMatch = video.product_type?.toLowerCase().includes(lowercasedSearchTerm);

                return isUrlMatch || isKeywordMatch || isNicheMatch || isContentAngleMatch || isHookTypeMatch || isCtaTypeMatch || isTrustTacticMatch || isProductTypeMatch;
            });
        }

        switch (sortOption) {
            case 'click_desc':
                processedVideos.sort((a, b) => (b.click || 0) - (a.click || 0));
                break;
            case 'tym_desc':
                processedVideos.sort((a, b) => (b.tym || 0) - (a.tym || 0));
                break;
            default:
                processedVideos.sort((a, b) => a.id - b.id);
                break;
        }
        setFilteredVideos(processedVideos);
    }, [searchTerm, sortOption, allVideos]);

    const handleAnalyzeClick = (video: TikTokData) => {
        const params = new URLSearchParams();
        params.set('url', video.url_tiktok);
        if (video.description) {
            params.set('description', video.description);
        }
        router.push(`/research?${params.toString()}`);
    };

    if (isInitialLoading) {
        return <div className="text-center p-10 text-slate-500">Loading library...</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <Navbar />
            <div className="container mx-auto p-4 md:p-8">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">Video Library</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Explore, search, and analyze collected videos to uncover breakthrough ideas.
                    </p>
                </div>

                <div className="p-4 bg-white rounded-xl shadow-md sticky top-[88px] z-20 backdrop-blur-sm bg-white/90 mb-8">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:flex-1">
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by keyword, niche, or TikTok URL"
                                value={searchTerm || ''}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-black"
                            />
                        </div>
                        <div className="relative w-full md:w-auto">
                            <BarsArrowDownIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full md:w-56 p-3 pl-10 border appearance-none border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                                <option value="default">Sort by Default</option>
                                <option value="click_desc">Most Clicked</option>
                                <option value="tym_desc">Most Liked</option>
                            </select>
                        </div>
                    </div>
                    {/* --- KHU VỰC KEYWORDS MỚI --- */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        {keywordsLoading ? (
                            <div className="flex flex-wrap gap-2">
                                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 w-24 bg-slate-200 rounded-full animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                                <TagIcon className="w-5 h-5 text-slate-500 mr-2" />
                                {topKeywords.slice(0, 8).map(kw => (
                                    <button
                                        key={kw.keyword}
                                        onClick={() => setSearchTerm(kw.keyword)}
                                        className="px-3 py-1 bg-slate-100 border border-transparent text-slate-700 rounded-full text-sm font-medium hover:bg-purple-100 hover:text-purple-700 hover:border-purple-200 transition-colors cursor-pointer"
                                    >
                                        {kw.keyword}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <TikTokGrid
                    videos={visibleItems}
                    userNames={userNames}
                />

                <div ref={loadMoreRef} className="h-20 w-full flex justify-center items-center">
                    {hasMore && <span className="text-slate-500">Loading more videos...</span>}
                    {!hasMore && filteredVideos.length > 0 && <span className="text-slate-400">You've reached the end.</span>}
                </div>
            </div>
            <Footer />
        </div>
    );
}
