'use client';

import React, { useState } from 'react';
import { TikTokEmbed } from 'react-social-media-embed';
// import TiktokEmbed from './TiktokEmbed'; // Không dùng trong đoạn code này, có thể xóa nếu không cần
import { TikTokData } from '@/types/tiktok';

// --- Icons (Giữ nguyên) ---
const HeartIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-4.5-4.309A6.5 6.5 0 019.5 2.846a6.5 6.5 0 015.366 9.752 20.759 20.759 0 01-4.5 4.309l-.019.01-.005.003h-.002z" /></svg>);
const CursorArrowRaysIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M11.25 6.243a1.5 1.5 0 012.122 2.121l-3.36 3.36a1.5 1.5 0 01-2.12 0l-3.362-3.36a1.5 1.5 0 012.121-2.121L10 7.622l1.25-1.379z" /><path d="M4.273 4.273a7.5 7.5 0 0111.454 0 7.5 7.5 0 010 11.454l-1.889-1.889a5.503 5.503 0 000-7.676 5.503 5.503 0 00-7.676 0L4.273 15.727a7.5 7.5 0 010-11.454z" /></svg>);
const SparklesIcon = ({ className }: { className?: string }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10.868 2.884c.321.64.321 1.415 0 2.055l-1.76 3.52a.5.5 0 00.465.695h3.52c.85 0 1.212.992.64 1.562l-3.52 3.52a.5.5 0 00-.232.465v3.52c0 .85-.992 1.212-1.562.64l-3.52-3.52a.5.5 0 00-.465-.232H2.884c-.85 0-1.212-.992-.64-1.562l3.52-3.52a.5.5 0 00.232-.465V6.444c0-.85.992-1.212 1.562-.64L10.868 2.884zM8.42 20a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84zM17.63 8.42a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84zM20 17.63a1.92 1.92 0 10-3.84 0 1.92 1.92 0 003.84 0zM8.42 2.37a1.92 1.92 0 100-3.84 1.92 1.92 0 000 3.84z" clipRule="evenodd" /></svg>);

// Simple NicheIcon as a tag icon
const NicheIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 7.5h18M4.5 21h15a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 002.25 7.5v11.25A2.25 2.25 0 004.5 21z" />
  </svg>
);


// --- Props cho TikTokCard (Giữ nguyên) ---
interface TikTokCardProps {
    video: TikTokData;
    userName: string;
    isLiked: boolean;
    onAnalyzeClick: (video: TikTokData) => void;
    onLikeClick: (video: TikTokData) => void;
}

export default function TikTokCard({ video, userName, isLiked, onAnalyzeClick, onLikeClick }: TikTokCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    // isActive được giữ lại nhưng không được sử dụng trong component này
    // nếu bạn muốn nó có trạng thái "được chọn", logic cần được quản lý từ component cha.
    const [isActive, setIsActive] = useState(false); 

    const videoAttributes = [
        { label: 'Niche', value: video.niche },
        { label: 'Content Angle', value: video.content_angle },
        { label: 'Hook Type', value: video.hook_type },
        { label: 'CTA Type', value: video.cta_type },
        { label: 'Trust Tactic', value: video.trust_tactic },
        { label: 'Product Type', value: video.product_type },
        { label: 'Target Persona', value: video.target_persona },
        { label: 'Script Framework', value: video.script_framework },
        { label: 'Core Emotion', value: video.core_emotion }
    ].filter(attr => attr.value);

    // Kích thước video thay đổi dựa trên trạng thái hover
    const videoHeight = isHovered ? 560 : 400;

    return (
        <div
            // Chỉ duy trì onMouseEnter/onMouseLeave ở thẻ div ngoài cùng
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onAnalyzeClick(video)}
            className={`
                bg-white rounded-xl shadow-lg overflow-hidden w-full flex flex-col 
                transition-all duration-300 border border-slate-200 cursor-pointer
                ${isActive
                    ? 'absolute inset-0 scale-105 z-20 shadow-2xl' // Khi active: absolute và nổi lên
                    : 'relative' // Khi không active: relative và nằm yên
                }
            `}
        >
            {/* --- VÙNG VIDEO --- */}
            <div
                className="w-full relative bg-black transition-[height] duration-300 ease-in-out"
                style={{ height: `${videoHeight}px` }}
            >
                <TikTokEmbed
                    url={video.url_tiktok}
                    width="100%"
                    height={videoHeight}
                />
            </div>

            {/* --- VÙNG THÔNG TIN CƠ BẢN (TIÊU ĐỀ & MÔ TẢ NGẮN) --- */}
            <div className="px-4 py-3 bg-white">
                <h3 className="font-bold text-lg text-slate-900 truncate mb-1" title={video.title || undefined}>
                    {video.title || 'Không có tiêu đề'}
                </h3>
                {/* Bạn có thể thêm mô tả ngắn hoặc các thông tin cốt lõi khác ở đây */}
                {/* {video.description && <p className="text-sm text-slate-600 line-clamp-2">{video.description}</p>} */}
            </div>

            {/* --- VÙNG THẺ NICHE & POPOVER (được đặt lại vị trí) --- */}
            <div className="relative px-4 pb-3"> {/* Thêm padding để cân đối */}
                {/* --- THẺ NICHE --- */}
                {video.niche && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-xs font-semibold rounded-full cursor-pointer">
                        <NicheIcon className="w-4 h-4" />
                        <span>{video.niche}</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-lg text-white truncate mb-2" title={video.title || undefined}>
                        {video.title || 'No Title Available'}
                    </h3>
                    {videoAttributes.length > 0 && (
                        // SỬA LỖI: Thêm container có thể cuộn
                        <div className="max-h-[150px] overflow-y-auto pr-2">
                            <dl className="space-y-1.5 text-xs">
                                {/* SỬA LỖI: Bỏ .slice() để hiển thị tất cả */}
                                {videoAttributes.map(attr => (
                                    <div key={attr.label} className="grid grid-cols-2 items-center gap-2">
                                        <dt className="text-slate-300 truncate">{attr.label}</dt>
                                        <dd className="font-semibold text-white text-right truncate" title={attr.value ?? undefined}>{attr.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}
                </div>
            </div>

            {/* --- VÙNG THÔNG TIN & HÀNH ĐỘNG (Không đổi) --- */}
            <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-white to-slate-50">
                <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1.5" title="Lượt phân tích">
                        <CursorArrowRaysIcon className="w-5 h-5 text-sky-500" />
                        <span className="font-semibold text-slate-700">{video.click || 0}</span>
                    </div>
                    <div className="font-semibold text-slate-800 truncate" title={userName}>{userName}</div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onLikeClick(video); }}
                        className="flex items-center gap-1.5 group"
                        title="Thích"
                    >
                        <HeartIcon className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 group-hover:text-red-400'}`} />
                        <span className="font-semibold text-slate-700">{video.tym || 0}</span>
                    </button>
                </div>

                <div className="mt-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAnalyzeClick(video); }}
                        disabled={!video.url_tiktok}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>{video.description ? "Xem & Cải thiện" : "Phân tích kịch bản"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}