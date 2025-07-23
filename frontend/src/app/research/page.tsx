// app/research/page.tsx

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

// --- Components ---
import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import { ResultDisplay } from '@/components/research/ResultDisplay';
import { doc, increment, updateDoc,  setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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

// Create a separate Client Component that uses useSearchParams
function ResearchContent() {
    const searchParams = useSearchParams();
    const currentUrl = searchParams.get('url');

    // State luồng chính
    const [report, setReport] = useState<string>('');
    const [isLoadingReport, setIsLoadingReport] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth(); // Giả sử 'user' object từ useAuth chứa thông tin credit

    // State luồng cải tiến
    const [lastImprovements, setLastImprovements] = useState<string[]>([]);
    const [isGeneratingNewScript, setIsGeneratingNewScript] = useState(false);
    const [improvedScript, setImprovedScript] = useState('');
    const [scriptGenerationError, setScriptGenerationError] = useState<string | null>(null);

    // State for editing the improved script
    const [isEditingScript, setIsEditingScript] = useState(false);

    const [currentView, setCurrentView] = useState<'report' | 'script'>('report');

    const [isEditingReport, setIsEditingReport] = useState(false);

    // <<< STATE MỚI >>>
    const [isSaving, setIsSaving] = useState(false); // Trạng thái cho nút lưu
    const [hasCheckedFirestore, setHasCheckedFirestore] = useState(false); // Ngăn việc gọi lại liên tục


    const resetAllState = useCallback(() => {
        setReport('');
        setError(null);
        setImprovedScript('');
        setScriptGenerationError(null);
        setLastImprovements([]);
        setIsEditingScript(false);
        setCurrentView('report'); // Reset về giao diện report
        setIsEditingReport(false);
    }, []);

     const encodeUrlForId = (url: string) => {
        // btoa là cách đơn giản nhất để mã hóa URL thành một chuỗi hợp lệ cho ID của Firestore
        return btoa(url);
    };

    const handleSearch = useCallback(async (videoUrl: string) => {
        if (!videoUrl) return;

        if (!user) {
        setError("Bạn cần đăng nhập để sử dụng chức năng này.");
        setIsLoadingReport(false);
        return; // Dừng hàm nếu chưa đăng nhập
    }
        setIsLoadingReport(true);
        resetAllState();

        try {
            const docId = encodeUrlForId(videoUrl);
            const docRef = doc(db, 'users', user.uid, 'saved_scripts', docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setReport(data.originalReport);
                setImprovedScript(data.improvedScript);
                console.log("Loaded data from Firestore.");
                setIsLoadingReport(false);
                return; // Dừng lại nếu đã có dữ liệu
            }
        } catch (e) {
            console.error("Error loading from Firestore:", e);
        }


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
            console.error("Lỗi khi đọc cache:", e);
        }

        // Nếu không có trong cache, gọi API
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: videoUrl, userId: user.displayName }),
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
    }, [user, resetAllState]); // SỬA LỖI: Thêm user và resetAllState vào dependency array

    useEffect(() => {
        // Logic này cần được xem xét lại để tránh gọi lại handleSearch không cần thiết
        if (currentUrl && user && !hasCheckedFirestore) {
            handleSearch(currentUrl);
            setHasCheckedFirestore(true);
        } else if (!currentUrl) {
            setError("Vui lòng cung cấp URL để phân tích.");
            setIsLoadingReport(false);
        }
    }, [currentUrl, user, hasCheckedFirestore, handleSearch]);

   const handleGenerateNewScript = useCallback(async (improvements: string[]) => {
        setLastImprovements(improvements);
        setIsGeneratingNewScript(true);
        setImprovedScript('');
        setScriptGenerationError(null);
        setIsEditingScript(false);

        if (!user) {
            setScriptGenerationError("Vui lòng đăng nhập để sử dụng chức năng này.");
            setIsGeneratingNewScript(false);
            return;
        }

        try {
            // Bước 1: Lấy dữ liệu credit mới nhất từ Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                throw new Error("Không tìm thấy thông tin người dùng.");
            }

            const currentCredit = userDocSnap.data().credit;

            // Bước 2: Kiểm tra credit
            if (currentCredit <= 0) {
                setScriptGenerationError("You don't have enough credit to generate a new script. Please recharge.");
                setIsGeneratingNewScript(false);
                return;
            }

            // Bước 3: Nếu đủ credit, tiến hành gọi API
            const baseText = improvedScript || report;
            const payload: ImprovementRequest = { original_report: baseText, improvements };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/improvement-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const scriptText = await res.text();
            if (!res.ok) throw new Error(scriptText || 'Failed to generate improved script');

            // Bước 4: Trừ credit sau khi gọi API thành công
            await updateDoc(userDocRef, {
                credit: increment(-1)
            });
            console.log('Credit deducted successfully for user:', user.uid);

            setImprovedScript(scriptText);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            setScriptGenerationError(`Đã xảy ra lỗi: ${errorMessage}.`);
        } finally {
            setIsGeneratingNewScript(false);
        }
    }, [report, improvedScript, user]);

     const handleSaveScript = async () => {
        if (!user || !currentUrl || !improvedScript) {
            alert("Cannot save. Missing user, URL, or script content.");
            return;
        }
        setIsSaving(true);
        try {
            const docId = encodeUrlForId(currentUrl);
            const docRef = doc(db, 'users', user.uid, 'saved_scripts', docId);
            await setDoc(docRef, {
                originalReport: report,
                improvedScript: improvedScript,
                tiktokUrl: currentUrl,
                savedAt: serverTimestamp(),
            }, { merge: true }); // Dùng merge để không ghi đè các trường khác nếu có
            alert("Script saved successfully!");
        } catch (error) {
            console.error("Error saving script to Firestore:", error);
            alert("Failed to save script.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRetryGenerate = () => {
        if (lastImprovements.length > 0) {
            handleGenerateNewScript(lastImprovements);
        }
    };
        const handleStartEditReport = () => {
        setIsEditingReport(true);
    };

        const handleCancelEditReport = () => {
        setIsEditingReport(false);
    };
        const handleSaveEditReport = (newReport: string) => {
        setReport(newReport); // Cập nhật lại state report gốc
        setIsEditingReport(false);
    };

    const handleCopyText = (textToCopy: string) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
    };

    // --- Handlers for editing the script ---
    const handleStartEdit = () => {
        setIsEditingScript(true);
    };

    const handleCancelEdit = () => {
        setIsEditingScript(false);
    };

    const handleSaveEdit = (newScript: string) => {
        setImprovedScript(newScript);
        setIsEditingScript(false);
    };


    return (
        <> {/* Use a fragment or div to wrap */}
            <header className="p-4 bg-white/70 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto">
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
                    // --- Props chung (giữ nguyên) ---
                    isLoadingReport={isLoadingReport}
                    report={report}
                    error={error}
                    isGeneratingNewScript={isGeneratingNewScript}
                    improvedScript={improvedScript}
                    scriptGenerationError={scriptGenerationError}
                    onGenerateNewScript={handleGenerateNewScript}
                    onRetryGenerate={handleRetryGenerate}
                    onCopy={handleCopyText}

                    // --- Props cho SỬA REPORT (giữ nguyên) ---
                    isEditingReport={isEditingReport}
                    onEditReport={handleStartEditReport}
                    onSaveReport={handleSaveEditReport}
                    onCancelEditReport={handleCancelEditReport}

                    // --- Props cho việc chuyển đổi giao diện ---
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    
                    // --- SỬA LẠI PROPS CHO SỬA SCRIPT ---

                    // 1. Props cho trình soạn thảo (textarea)
                    isEditingScript={isEditingScript}
                    onEditScript={handleStartEdit}
                    onSaveEditScript={handleSaveEdit} // <<< DÙNG handleSaveEdit cho việc lưu state
                    onCancelEditScript={handleCancelEdit}

                    // 2. Props cho nút Save trên header (lưu vào Firestore)
                    onSaveToFirestore={handleSaveScript} // <<< DÙNG handleSaveScript cho việc lưu vào DB
                    isSaving={isSaving}
                />
            </div>
        </main>
    </>
    );
}


export default function ResearchPageWrapper() {
    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <Navbar />
            <Suspense fallback={<div>Loading research tools...</div>}>
                <ResearchContent />
            </Suspense>
        </div>
    );
}
