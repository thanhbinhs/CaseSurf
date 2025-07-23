'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TikTokEmbed } from 'react-social-media-embed';
import Navbar from '@/components/Navbar';

// --- Icons ---
const HeartIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-4.5-4.309A6.5 6.5 0 019.5 2.846a6.5 6.5 0 015.366 9.752 20.759 20.759 0 01-4.5 4.309l-.019.01-.005.003h-.002z" /></svg>);
const CursorArrowRaysIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 6.243a1.5 1.5 0 012.122 2.121l-3.36 3.36a1.5 1.5 0 01-2.12 0l-3.362-3.36a1.5 1.5 0 012.121-2.121L10 7.622l1.25-1.379z" /><path d="M4.273 4.273a7.5 7.5 0 0111.454 0 7.5 7.5 0 010 11.454l-1.889-1.889a5.503 5.503 0 000-7.676 5.503 5.503 0 00-7.676 0L4.273 15.727a7.5 7.5 0 010-11.454z" /></svg>);
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const TagIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>);
const BarsArrowDownIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>);

// --- Hằng số cache ---
const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';

// --- Định nghĩa kiểu dữ liệu ---
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
    const [isLoading, setIsLoading] = useState(true);
    const [allKeywords, setAllKeywords] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKeyword, setSelectedKeyword] = useState('all'); // Giữ lại nếu muốn có filter keyword riêng
    const [sortOption, setSortOption] = useState('default');

    useEffect(() => {
        try {
            const cachedItem = localStorage.getItem(TIKTOK_DATA_CACHE_KEY);
            if (cachedItem) {
                const cachedData: CachedTiktokData = JSON.parse(cachedItem);
                setAllVideos(cachedData.videos);
                setFilteredVideos(cachedData.videos);
                const keywords = new Set<string>();
                cachedData.videos.forEach(video => {
                    video.keyword?.forEach(kw => keywords.add(kw));
                });
                setAllKeywords(Array.from(keywords).sort());
            }
        } catch (e) {
            console.error("Lỗi khi đọc hoặc phân tích cache:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let processedVideos = [...allVideos];
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        // 1. Áp dụng bộ lọc tìm kiếm
        if (searchTerm) {
            // Kiểm tra xem searchTerm có phải là URL TikTok hợp lệ không
            const isTikTokUrl = (url: string) => {
                try {
                    const urlObj = new URL(url);
                    return urlObj.hostname.includes('tiktok.com');
                } catch {
                    return false;
                }
            };

            if (isTikTokUrl(searchTerm)) {
                // Nếu là URL, tìm kiếm chính xác theo url_tiktok
                processedVideos = processedVideos.filter(video =>
                    video.url_tiktok.toLowerCase() === lowercasedSearchTerm
                );
            } else {
                // Nếu không phải URL, tìm kiếm theo keyword (như cũ)
                processedVideos = processedVideos.filter(video =>
                    video.keyword?.some(kw =>
                        kw.toLowerCase().includes(lowercasedSearchTerm)
                    )
                );
            }
        }

        // 2. Áp dụng sắp xếp
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
    }, [searchTerm, sortOption, allVideos]); // Bỏ selectedKeyword nếu không dùng filter keyword riêng

    const handleAnalyzeClick = (video: TikTokData) => {
        const { url_tiktok, description } = video;
        if (description) {
            const query = new URLSearchParams({ url: url_tiktok, description }).toString();
            router.push(`/research?${query}`);
        } else {
            router.push(`/research?url=${encodeURIComponent(url_tiktok)}`);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10 text-slate-500">Đang tải thư viện...</div>;
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
                            // Cập nhật placeholder để phản ánh tìm kiếm linh hoạt hơn
                            placeholder="Search by keyword or TikTok URL"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2.5 pl-10 border placeholder:text-slate-400  fill-amber-50 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                    <div className="relative w-full md:w-auto">
                        <BarsArrowDownIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-full md:w-56 p-2.5 pl-10 border appearance-none border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                            <option value="default">Sort by</option>
                            <option value="click_desc">Most Clicked</option>
                            <option value="tym_desc">Most Liked</option>
                        </select>
                    </div>
                </div>

                {/* --- Phần hiển thị video giữ nguyên --- */}
                {filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVideos.map(video => (
                            <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <TikTokEmbed url={video.url_tiktok} width="100%" height="420px" />
                                <div className="p-4 flex flex-col flex-grow">
                                    {video.keyword && video.keyword.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {/* Chỉ hiển thị 2 keyword đầu tiên để tránh làm rối thẻ */}
                                            {video.keyword.slice(0, 2).map(kw => (
                                                <div key={kw} className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-2 py-1 rounded-md">
                                                    <TagIcon className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">
                                                        {kw}
                                                    </span>
                                                </div>
                                            ))}
                                            {/* Nếu có nhiều hơn 2 keyword, hiển thị số lượng còn lại */}
                                            {video.keyword.length > 2 && (
                                                <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                    <span className="text-xs font-medium">
                                                        +{video.keyword.length - 2} khác
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ): (
                                        <div className="text-sm text-slate-500 italic mb-4">No keywords found.</div>
                                    )}
                                    <div className="flex-grow" />
                                    <div className="flex items-center justify-between text-sm text-slate-500 mt-2 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <CursorArrowRaysIcon className="w-5 h-5 text-sky-500" />
                                            <span className="font-medium">{video.click || 0}</span>
                                        </div>

                                        {/* Username */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium">{video.userId || "Unknown"}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <HeartIcon className="w-5 h-5 text-red-500" />
                                            <span className="font-medium">{video.tym || 0}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAnalyzeClick(video)}
                                        disabled={!video.url_tiktok}
                                        className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
                                    >
                                        {video.description ? "Xem & Cải tiến" : "Phân tích Kịch bản"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-6 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-slate-700">No Results Found</h3>
                        <p className="text-slate-500 mt-2">Try changing your search keywords or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}