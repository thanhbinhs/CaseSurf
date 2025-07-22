// app/research/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext'; // 1. Import useAuth
import { db } from '@/lib/firebase'; // 2. Import Firestore instance

// --- Components ---
import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import { ResultDisplay } from '@/components/research/ResultDisplay';
import { doc, increment, updateDoc } from 'firebase/firestore';

// --- Types ---
type ImprovementRequest = {
    original_report: string;
    improvements: string[];
};

const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';

interface TikTokData {
    id: number;
    url_tiktok: string;
    description: string | null;
}

interface CachedTiktokData {
    videos: TikTokData[];
    timestamp: number;
}


export default function ResearchPage() {
    const searchParams = useSearchParams();

    // State luồng chính
    const [report, setReport] = useState<string>('');
    const [isLoadingReport, setIsLoadingReport] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // State luồng cải tiến
    const [lastImprovements, setLastImprovements] = useState<string[]>([]);
    const [isGeneratingNewScript, setIsGeneratingNewScript] = useState(false);
    const [improvedScript, setImprovedScript] = useState('');
    const [scriptGenerationError, setScriptGenerationError] = useState<string | null>(null);

    const resetAllState = () => {
        setReport('');
        setError(null);
        setImprovedScript('');
        setScriptGenerationError(null);
        setLastImprovements([]);
    };

    const handleSearch = useCallback(async (videoUrl: string) => {
        if (!videoUrl) return;

        setIsLoadingReport(true);
        resetAllState();

        // Kiểm tra cache trước
        try {
            const cachedItem = localStorage.getItem(TIKTOK_DATA_CACHE_KEY);
            if (cachedItem) {
                const cachedData: CachedTiktokData = JSON.parse(cachedItem);
                const foundVideo = cachedData.videos.find(v => v.url_tiktok === videoUrl);
                if (foundVideo?.description) {
                    setReport(foundVideo.description);
                    setIsLoadingReport(false);
                    return;
                }
            }
        } catch (e) {
            console.error("Lỗi cache:", e);
        }

        // Nếu không có trong cache, gọi API
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: videoUrl }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to generate report');
            }
            const data = await res.json();
            setReport(data.text);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
            setError(`Đã xảy ra lỗi khi tạo báo cáo: ${errorMessage}`);
        } finally {
            setIsLoadingReport(false);
        }
    }, []);

    useEffect(() => {
        const urlFromQuery = searchParams.get('url');
        const descFromQuery = searchParams.get('description');

        if (descFromQuery) {
            setReport(descFromQuery);
            setIsLoadingReport(false);
        } else if (urlFromQuery) {
            handleSearch(urlFromQuery);
        } else {
            setError("Vui lòng cung cấp URL để phân tích.");
            setIsLoadingReport(false);
        }
    }, [searchParams, handleSearch]);

   const handleGenerateNewScript = useCallback(async (improvements: string[]) => {
        setLastImprovements(improvements);
        setIsGeneratingNewScript(true);
        setImprovedScript('');
        setScriptGenerationError(null);

        // Kiểm tra xem người dùng có đăng nhập không trước khi gọi API
        if (!user) {
            setScriptGenerationError("Vui lòng đăng nhập để sử dụng chức năng này.");
            setIsGeneratingNewScript(false);
            return;
        }

        try {
            const payload: ImprovementRequest = { original_report: report, improvements };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/improvement-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const scriptText = await res.text();
            if (!res.ok) throw new Error(scriptText || 'Failed to generate improved script');

            // --- BẮT ĐẦU LOGIC TRỪ CREDIT ---
            // Nếu gọi API thành công, tiến hành trừ credit
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, {
                    credit: increment(-1) // Giảm giá trị credit đi 1
                });
                console.log('Credit deducted successfully for user:', user.uid);
            } catch (creditError) {
                // Ghi lại lỗi nếu việc trừ credit thất bại, nhưng không chặn người dùng
                // vì họ đã nhận được kịch bản.
                console.error("QUAN TRỌNG: Không thể trừ credit sau khi tạo kịch bản.", creditError);
            }
            // --- KẾT THÚC LOGIC TRỪ CREDIT ---

            setImprovedScript(scriptText);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            setScriptGenerationError(`Đã xảy ra lỗi: ${errorMessage}.`);
        } finally {
            setIsGeneratingNewScript(false);
        }
    }, [report, user]); // 5. Thêm `user` vào dependency array của useCallback


    const handleRetryGenerate = () => {
        if (lastImprovements.length > 0) {
            handleGenerateNewScript(lastImprovements);
        }
    };

    const handleCopyText = (textToCopy: string) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        // Optional: Hiển thị thông báo "Đã sao chép!"
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <Navbar />
            <header className="p-4 bg-white/70 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto">
                    {/* [SỬA ĐỔI] Truyền prop isLoading */}
                    <SearchBox
                        onSearch={handleSearch}
                        placeholder="Search for a TikTok video URL"
                        isLoading={isLoadingReport}
                    />
                </div>
            </header>

            <main className="flex-grow flex items-start justify-center p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto space-y-8">
                    <ResultDisplay
                        isLoadingReport={isLoadingReport}
                        report={report}
                        error={error}
                        isGeneratingNewScript={isGeneratingNewScript}
                        improvedScript={improvedScript}
                        scriptGenerationError={scriptGenerationError}
                        onGenerateNewScript={handleGenerateNewScript}
                        onRetryGenerate={handleRetryGenerate}
                        onCopy={handleCopyText}
                    />
                </div>
            </main>
        </div>
    );
}