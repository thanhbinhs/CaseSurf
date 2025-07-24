'use client';

import React, { useState, useEffect } from 'react';
import { TikTokEmbed } from 'react-social-media-embed';
import { useRouter } from 'next/navigation';

// --- Icons ---
const HeartIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-4.5-4.309A6.5 6.5 0 019.5 2.846a6.5 6.5 0 015.366 9.752 20.759 20.759 0 01-4.5 4.309l-.019.01-.005.003h-.002z" /></svg>);
const CursorArrowRaysIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 6.243a1.5 1.5 0 012.122 2.121l-3.36 3.36a1.5 1.5 0 01-2.12 0l-3.362-3.36a1.5 1.5 0 012.121-2.121L10 7.622l1.25-1.379z" /><path d="M4.273 4.273a7.5 7.5 0 0111.454 0 7.5 7.5 0 010 11.454l-1.889-1.889a5.503 5.503 0 000-7.676 5.503 5.503 0 00-7.676 0L4.273 15.727a7.5 7.5 0 010-11.454z" /></svg>);
const TagIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>);
const SparklesIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10.868 2.884c.321.64.321 1.415 0 2.055l-1.76 3.52a.5.5 0 00.465.695h3.52c.85 0 1.212.992.64 1.562l-3.52 3.52a.5.5 0 00-.232.465v3.52c0 .85-.992 1.212-1.562.64l-3.52-3.52a.5.5 0 00-.465-.232H2.884c-.85 0-1.212-.992-.64-1.562l3.52-3.52a.5.5 0 00.232-.465V6.444c0-.85.992-1.212 1.562-.64L10.868 2.884zM8.42 20a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84zM17.63 8.42a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84zM20 17.63a1.92 1.92 0 10-3.84 0 1.92 1.92 0 003.84 0zM8.42 2.37a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84z" clipRule="evenodd" /></svg>);

// --- Định nghĩa kiểu dữ liệu ---
interface TikTokData {
    url_tiktok: string;
    description: string | null;
    keyword: string[] | null;
    click: number | null;
    tym: number | null;
    userId: string | null;
}

interface TikTokGridProps {
    videos: TikTokData[];
    router: ReturnType<typeof useRouter>; // Sửa lại: Dùng router
    userNames: Record<string, string>;
    cardMaxWidth?: string;
}

export default function TikTokGrid({ videos: initialVideos, router, userNames, cardMaxWidth = 'none'  }: TikTokGridProps) {
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

    // Thêm lại hàm handleAnalyzeClick vào bên trong component
    const handleAnalyzeClick = async (video: TikTokData) => {
        const updatedVideos = videos.map(v =>
            v.url_tiktok === video.url_tiktok ? { ...v, click: (v.click || 0) + 1 } : v
        );
        setVideos(updatedVideos);

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
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {videos.map(video => {
                const isLiked = likedVideos.has(video.url_tiktok);
                const userName = video.userId ? (userNames[video.userId] || '...') : 'Unknown';

                return (
                    <div
                        key={video.url_tiktok}
                        onClick={() => handleAnalyzeClick(video)} // Sửa lại: Gọi hàm nội bộ
                        className="bg-white rounded-xl shadow-lg overflow-hidden w-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-slate-200 cursor-pointer"
                    >
                        <div className="w-full h-[420px] bg-slate-100">
                            <TikTokEmbed url={video.url_tiktok} width="100%" height={420} />
                        </div>
                        <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-white to-slate-50">
                            {video.keyword && video.keyword.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-2 mb-3 h-10">
                                    {video.keyword.slice(0, 2).map(kw => (
                                        <div key={kw} className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                                            <TagIcon className="w-3.5 h-3.5" />
                                            <span className="text-xs font-semibold">{kw}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-10 mb-3 text-sm text-slate-400 italic flex items-center">No keywords available.</div>
                            )}
                            
                            <div className="flex-grow"/>

                            <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-200">
                                <div className="flex items-center gap-1.5" title="Analyze Clicks">
                                    <CursorArrowRaysIcon className="w-5 h-5 text-sky-500" />
                                    <span className="font-semibold text-slate-700">{video.click || 0}</span>
                                </div>
                                <div className="font-semibold text-slate-800 truncate" title={userName}>{userName}</div>
                                <button onClick={(e) => { e.stopPropagation(); handleLikeClick(video); }} className="flex items-center gap-1.5 group" title="Like">
                                    <HeartIcon className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 group-hover:text-red-400'}`} />
                                    <span className="font-semibold text-slate-700">{video.tym || 0}</span>
                                </button>
                            </div>
                            <div className="mt-4">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAnalyzeClick(video); }} // Sửa lại: Gọi hàm nội bộ
                                    disabled={!video.url_tiktok} 
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    <span>{video.description ? "View & Improve" : "Analyze Script"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
