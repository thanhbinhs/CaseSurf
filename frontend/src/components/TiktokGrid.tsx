'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TikTokEmbed } from 'react-social-media-embed';

// --- Icons (Giữ nguyên) ---
const HeartIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-4.5-4.309A6.5 6.5 0 019.5 2.846a6.5 6.5 0 015.366 9.752 20.759 20.759 0 01-4.5 4.309l-.019.01-.005.003h-.002z" /></svg>);
const CursorArrowRaysIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 6.243a1.5 1.5 0 012.122 2.121l-3.36 3.36a1.5 1.5 0 01-2.12 0l-3.362-3.36a1.5 1.5 0 012.121-2.121L10 7.622l1.25-1.379z" /><path d="M4.273 4.273a7.5 7.5 0 0111.454 0 7.5 7.5 0 010 11.454l-1.889-1.889a5.503 5.503 0 000-7.676 5.503 5.503 0 00-7.676 0L4.273 15.727a7.5 7.5 0 010-11.454z" /></svg>);
const TagIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>);

// --- Định nghĩa kiểu dữ liệu ---
interface TikTokData {
    // THAY ĐỔI: Không còn dùng id
    url_tiktok: string;
    description: string | null;
    keyword: string[] | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
}

interface TikTokGridProps {
    videos: TikTokData[];
    router: ReturnType<typeof useRouter>; 
    cardMaxWidth?: string;
}

export default function TikTokGrid({ videos: initialVideos, router, cardMaxWidth = 'none' }: TikTokGridProps) {
    const [videos, setVideos] = useState(initialVideos);
    // THAY ĐỔI: State giờ lưu một Set các chuỗi (string) URL, không phải số (number) ID
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
        // THAY ĐỔI: Tìm video bằng `url_tiktok`
        const updatedVideos = videos.map(v =>
            v.url_tiktok === video.url_tiktok ? { ...v, click: (v.click || 0) + 1 } : v
        );
        setVideos(updatedVideos);

        // THAY ĐỔI: Mã hóa URL trước khi gửi đi làm param
        fetch(`/api/videos/${encodeURIComponent(video.url_tiktok)}/click`, { method: 'POST' })
            .catch(err => console.error("Failed to update click count:", err));
        
        const params = new URLSearchParams();
        params.set('url', video.url_tiktok);
        if (video.description) {
            params.set('description', video.description);
        }
        router.push(`/research?${params.toString()}`);
    };

    const handleLikeClick = (video: TikTokData) => {
        // THAY ĐỔI: Dùng `url_tiktok` để kiểm tra và cập nhật Set
        const newLikedSet = new Set(likedVideos);
        const isLiked = newLikedSet.has(video.url_tiktok);
        const action = isLiked ? 'unlike' : 'like';

        if (isLiked) {
            newLikedSet.delete(video.url_tiktok);
        } else {
            newLikedSet.add(video.url_tiktok);
        }
        setLikedVideos(newLikedSet);
        
        // THAY ĐỔI: Tìm video bằng `url_tiktok`
        const updatedVideos = videos.map(v => {
            if (v.url_tiktok === video.url_tiktok) {
                return { ...v, tym: (v.tym || 0) + (isLiked ? -1 : 1) };
            }
            return v;
        });
        setVideos(updatedVideos);

        localStorage.setItem('likedVideos', JSON.stringify(Array.from(newLikedSet)));

        // THAY ĐỔI: Mã hóa URL trước khi gửi đi làm param
        fetch(`/api/videos/${encodeURIComponent(video.url_tiktok)}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
        }).catch(err => console.error("Failed to update like count:", err));
    };

    if (videos.length === 0) {
        // ... (giữ nguyên)
    }

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {videos.map(video => {
                // THAY ĐỔI: Kiểm tra like bằng `url_tiktok`
                const isLiked = likedVideos.has(video.url_tiktok);
                return (
                    // THAY ĐỔI: Dùng `url_tiktok` làm key cho React
                    <div
                        key={video.url_tiktok}
                        className="bg-white rounded-xl shadow-md overflow-hidden w-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                        style={{ maxWidth: cardMaxWidth }}
                    >
                        {/* ... Phần còn lại của JSX không đổi, vì các hàm đã được cập nhật */}
                        <div className="w-full h-[420px] bg-slate-200">
                            <TikTokEmbed url={video.url_tiktok} width="100%" height={420} />
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            {video.keyword && video.keyword.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2 mb-4 h-9">
                                    {video.keyword.slice(0, 2).map(kw => (
                                        <div key={kw} className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-2 py-1 rounded-md">
                                            <TagIcon className="w-3.5 h-3.5" />
                                            <span className="text-xs font-medium">{kw}</span>
                                        </div>
                                    ))}
                                    {video.keyword.length > 2 && (
                                        <div className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                            <span className="text-xs font-medium">+{video.keyword.length - 2} more</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-9 mb-4 text-sm text-slate-400 italic">No keywords.</div>
                            )}
                            
                            <div className="flex-grow"/>

                            <div className="flex items-center justify-between text-sm text-slate-500 mb-4 mt-4">
                                <div className="flex items-center gap-1.5">
                                    <CursorArrowRaysIcon className="w-5 h-5 text-sky-500" />
                                    <span className="font-medium">{video.click || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-slate-800">{video.userId || "Unknown"}</span>
                                </div>
                                <button onClick={() => handleLikeClick(video)} className="flex items-center gap-1.5 cursor-pointer">
                                    <HeartIcon className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`} />
                                    <span className="font-medium">{video.tym || 0}</span>
                                </button>
                            </div>
                            <div className="mt-auto">
                                <button 
                                    onClick={() => handleAnalyzeClick(video)} 
                                    disabled={!video.url_tiktok} 
                                    className="w-full cursor-pointer bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
                                >
                                    {video.description ? "View & Improve" : "Analyze Script"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}