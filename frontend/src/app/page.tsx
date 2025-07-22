'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import { TikTokEmbed } from 'react-social-media-embed';
import Image from 'next/image';

// --- Icons (Giữ nguyên) ---
const HeartIcon = ({ className }: { className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-4.5-4.309A6.5 6.5 0 019.5 2.846a6.5 6.5 0 015.366 9.752 20.759 20.759 0 01-4.5 4.309l-.019.01-.005.003h-.002z" /></svg> );
const CursorArrowRaysIcon = ({ className }: { className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 6.243a1.5 1.5 0 012.122 2.121l-3.36 3.36a1.5 1.5 0 01-2.12 0l-3.362-3.36a1.5 1.5 0 012.121-2.121L10 7.622l1.25-1.379z" /><path d="M4.273 4.273a7.5 7.5 0 0111.454 0 7.5 7.5 0 010 11.454l-1.889-1.889a5.503 5.503 0 000-7.676 5.503 5.503 0 00-7.676 0L4.273 15.727a7.5 7.5 0 010-11.454z" /></svg> );
const TagIcon = ({ className }: { className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg> );

// --- Hằng số và Kiểu dữ liệu ---
const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';

interface TikTokData {
    id: number;
    url_tiktok: string;
    description: string | null;
    keyword: string[] | null;
    click: number | null;
    tym: number | null;
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
        // Định nghĩa một hàm async bên trong để fetch dữ liệu
        const fetchAndCacheData = async () => {
            // **Bước 1: Tải dữ liệu từ cache để hiển thị ngay lập tức**
            try {
                const cachedItem = localStorage.getItem(TIKTOK_DATA_CACHE_KEY);
                if (cachedItem) {
                    const cachedData: CachedTiktokData = JSON.parse(cachedItem);
                    setVideos(cachedData.videos);
                }
            } catch (e) {
                console.error("Lỗi khi đọc cache:", e);
            }

            // **Bước 2: Luôn fetch dữ liệu mới từ backend**
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tiktok_data`);
                console.log("dang gui");
                if (!response.ok) {
                    throw new Error(`Lỗi API: ${response.statusText}`);
                }

                const data: { tiktok: any[] } = await response.json();

                // Xử lý và chuẩn hóa dữ liệu nhận về
                const parsedVideos: TikTokData[] = data.tiktok.map(video => {
                    let parsedKeywords: string[] | null = null;
                    if (video.keyword && typeof video.keyword === 'string') {
                        try {
                            parsedKeywords = JSON.parse(video.keyword);
                        } catch (e) {
                            console.error(`Lỗi parse keyword cho video ID ${video.id}:`, e);
                        }
                    } else if (Array.isArray(video.keyword)) {
                        parsedKeywords = video.keyword;
                    }
                    return { ...video, keyword: parsedKeywords };
                });

                // **Bước 3: Cập nhật state và lưu vào cache**
                setVideos(parsedVideos); // Cập nhật giao diện với dữ liệu mới nhất
                setError(null); // Xóa lỗi nếu fetch thành công

                const newCacheData: CachedTiktokData = {
                    videos: parsedVideos,
                    timestamp: Date.now()
                };
                localStorage.setItem(TIKTOK_DATA_CACHE_KEY, JSON.stringify(newCacheData));
                
            } catch (err: any) {
                console.error("Không thể fetch dữ liệu mới:", err);
                // Chỉ hiển thị lỗi nếu không có dữ liệu nào trong cache để hiển thị
                if (videos.length === 0) {
                   setError("Không thể tải thư viện video. Vui lòng thử lại.");
                }
            } finally {
                // Luôn tắt trạng thái loading sau khi quá trình hoàn tất
                setIsLoading(false);
            }
        };

        // Gọi hàm fetch khi component được mount
        fetchAndCacheData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Dependency rỗng `[]` để useEffect chỉ chạy một lần khi component mount


    const handleAnalyzeClick = (video: TikTokData) => {
        const { url_tiktok, description } = video;
        if (description) {
            const query = new URLSearchParams({ url: url_tiktok, description }).toString();
            router.push(`/research?${query}`);
        } else {
            router.push(`/research?url=${encodeURIComponent(url_tiktok)}`);
        }
    };

    // --- Phần JSX Render ---
    // (Giữ nguyên không thay đổi)
    return (
        <div className="bg-white min-h-screen">
            <Navbar />
            <div className="container mx-auto p-4 flex flex-col items-center text-center">
                <Image
                    src="/images/logo.svg"
                    alt="CaseSurf Logo"
                    width={500}
                    height={150}
                    className="mb-4"
                />
                <p className="text-gray-600 mb-6 max-w-2xl">
                  {/* English */}
                    Use the search bar to analyze a specific video, or browse the library of collected videos.
                    </p>

                <div className="w-full max-w-lg space-y-4 mb-8">
                    <SearchBox 
                        onSearch={(query) => router.push(`/research?url=${encodeURIComponent(query)}`)} 
                        placeholder="Search for a TikTok video URL or description..." 
                    />
                </div>
                
                {/* Hiển thị Loading chỉ khi chưa có video nào */}
                {isLoading && videos.length === 0 && ( <div className="mt-6 text-lg text-slate-500">Library Update...</div> )}
                {error && ( <div className="mt-6 w-full max-w-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"><strong className="font-bold">Lỗi: </strong><span className="block sm:inline">{error}</span></div> )}
                
                {videos.length > 0 && (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                       {videos.slice(0, 10).map((video) => (
                            <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden w-full max-w-xs flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <TikTokEmbed url={video.url_tiktok} width="100%" height="420px"/>
                                
                                <div className="p-4 flex flex-col flex-grow">
                                    {video.keyword && video.keyword.length > 0 ? (
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {video.keyword.slice(0, 2).map(kw => (
                                                <div key={kw} className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-2 py-1 rounded-md">
                                                    <TagIcon className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">{kw}</span>
                                                </div>
                                            ))}
                                            {video.keyword.length > 2 && (
                                                <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                                    <span className="text-xs font-medium">+{video.keyword.length - 2} khác</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-9 mb-4"></div>
                                    )}
                                    
                                    <div className="flex-grow"/>

                                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <CursorArrowRaysIcon className="w-5 h-5 text-sky-500" />
                                            <span className="font-medium">{video.click || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <HeartIcon className="w-5 h-5 text-red-500" />
                                            <span className="font-medium">{video.tym || 0}</span>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <button onClick={() => handleAnalyzeClick(video)} disabled={!video.url_tiktok} className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400">
                                            {video.description ? "Xem & Cải tiến" : "Phân tích Kịch bản"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}