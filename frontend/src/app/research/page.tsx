// app/research/page.tsx

'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef, use } from 'react'; // Thêm useRef
import { useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';

// --- Components ---
import Navbar from '@/components/Navbar';
import SearchBox from '@/components/SearchBox';
import { ResultDisplay } from '@/components/research/ResultDisplay';
import { doc, increment, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Footer } from '@/components/Footer';
import { TikTokData } from '@/types/tiktok';

// --- Types ---
type ImprovementRequest = {
    original_report: string;
    improvements: string[];
};

const TIKTOK_DATA_CACHE_KEY = 'tiktokDataCache';

interface CachedTiktokData {
    videos: TikTokData[];
    timestamp: number;
}

// --- Notification Component ---
interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    
    return (
        <div className={`fixed bottom-5 right-5 flex items-center justify-between gap-4 p-4 rounded-lg text-white shadow-lg animate-slide-in-right ${bgColor}`}>
            <span>{message}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// Create a separate Client Component that uses useSearchParams
function ResearchContent() {
    const searchParams = useSearchParams();
    const currentUrl = searchParams.get('url');

    // State luồng chính
    const [report, setReport] = useState<string>('');
    const [isLoadingReport, setIsLoadingReport] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();// --- STATE MỚI: Lưu trữ dữ liệu chi tiết của video ---
    const [videoData, setVideoData] = useState<TikTokData | null>(null);

    // ... các state khác ...
    const [lastImprovements, setLastImprovements] = useState<string[]>([]);
    const [isGeneratingNewScript, setIsGeneratingNewScript] = useState(false);
    const [improvedScript, setImprovedScript] = useState('');
    const [scriptGenerationError, setScriptGenerationError] = useState<string | null>(null);
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [currentView, setCurrentView] = useState<'report' | 'script'>('report');
    const [isEditingReport, setIsEditingReport] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

     // --- STATE MỚI CHO THÔNG BÁO ---
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    
    // --- SỬA LỖI: Sử dụng useRef để theo dõi việc tìm kiếm ban đầu ---
    const initialSearchPerformed = useRef(false);


    const resetAllState = useCallback(() => {
        setReport('');
        setError(null);
        setImprovedScript('');
        setScriptGenerationError(null);
        setLastImprovements([]);
        setIsEditingScript(false);
        setCurrentView('report');
        setIsEditingReport(false);
        setVideoData(null);
    }, []);

    const encodeUrlForId = (url: string) => {
        // Mã hóa Base64 tiêu chuẩn
        const base64 = btoa(url);
        // Thay thế các ký tự không hợp lệ ('/' và '+') bằng các ký tự an toàn
        // và loại bỏ ký tự đệm '='
        return base64.replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
    };
    const handleSearch = useCallback(async (videoUrl: string) => {
        if (!user) {
            setError("Bạn cần đăng nhập để sử dụng chức năng này.");
            setIsLoadingReport(false);
            return;
        }
        setIsLoadingReport(true);
        resetAllState();

        try {
            // Chỉ cần một lệnh gọi API duy nhất đến backend.
            // Backend sẽ tự xử lý logic kiểm tra DB hoặc gọi n8n.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: videoUrl, userId: user.uid }),
            });

            if (!res.ok) {
                // Xử lý lỗi an toàn hơn
                const errorText = await res.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.detail || 'An error occurred while processing your request.');
                } catch {
                    throw new Error(`An unexpected error occurred.`);
                }
            }

            // Backend sẽ trả về một cấu trúc dữ liệu nhất quán
            const data = await res.json();
            
            // Cập nhật state từ một nguồn duy nhất
            setReport(data.report_text || '');
            setVideoData(data.video_data || null);

            // Kiểm tra xem có kịch bản đã lưu từ trước không (nếu backend trả về)
            if (data.video_data && data.video_data.improvedScript) {
                setImprovedScript(data.video_data.improvedScript);
                setCurrentView('script');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoadingReport(false);
        }
    }, [user, resetAllState]);
    useEffect(() => {
        // Chỉ thực hiện tìm kiếm ban đầu MỘT LẦN khi có đủ thông tin
        if (currentUrl && user && !initialSearchPerformed.current) {
            initialSearchPerformed.current = true; // Đánh dấu là đã thực hiện
            handleSearch(currentUrl);
        } else if (!currentUrl) {
            setError("Please provide a URL to analyze.");
            setIsLoadingReport(false);
        }
    }, [currentUrl, user, handleSearch]);

    const handleGenerateNewScript = useCallback(async (improvements: string[]) => {
        setLastImprovements(improvements);
        setIsGeneratingNewScript(true);
        setImprovedScript('');
        setScriptGenerationError(null);
        setIsEditingScript(false);

        if (!user) {
            setScriptGenerationError("You need to be logged in to use this feature.");
            setIsGeneratingNewScript(false);
            return;
        }


        try {

            // Bước 1: Lấy dữ liệu credit mới nhất từ Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
                throw new Error("User information not found.");
            }

            const currentCredit = userDocSnap.data().credit;

            // Bước 2: Kiểm tra credit
            if (currentCredit <= 0) {
                setScriptGenerationError("You don't have enough credit to generate a new script. Please recharge.");
                setIsGeneratingNewScript(false);
                return;
            }
            // 1. Xác định xem đây có phải là yêu cầu lặp lại không
            const isIterativeRequest = !!improvedScript; // Chuyển đổi thành boolean (true/false)

            // Bước 3: Nếu đủ credit, tiến hành gọi API
            const baseText = improvedScript || report;
            const payload = {
                base_text: baseText, // Đổi tên từ 'original_report' cho rõ nghĩa
                improvements: improvements,
                is_iterative: isIterativeRequest, // Gửi cờ này lên backend
            };
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/improvement-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const scriptText = await res.text();
            if (!res.ok) throw new Error(scriptText || 'An error occurred, please try again later.');

            // Bước 4: Trừ credit sau khi gọi API thành công
            await updateDoc(userDocRef, {
                credit: increment(-1)
            });
            console.log('Credit deducted successfully for user:', user.uid);

            setImprovedScript(scriptText);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred, please try again later.';
            setScriptGenerationError(`${errorMessage}.`);
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
           // Hiển thị thông báo thành công
            setNotification({ message: 'Script saved successfully!', type: 'success' });
        } catch (error) {
            console.error("Error saving script to Firestore:", error);
            setNotification({ message: 'Failed to save script.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- EFFECT ĐỂ TỰ ĐỘNG ẨN THÔNG BÁO ---
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000); // 5 giây

            // Dọn dẹp timer nếu component unmount hoặc notification thay đổi
            return () => clearTimeout(timer);
        }
    }, [notification]);

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
        <>
            <header className="p-4 bg-white/70 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto">
                    <SearchBox
                        // Hàm onSearch này chỉ được gọi khi người dùng chủ động tìm kiếm
                        onSearch={handleSearch}
                        placeholder="Search for a TikTok video URL"
                        isLoading={isLoadingReport}
                    />
                </div>
            </header>

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            <main className="flex-grow flex items-start justify-center p-4 md:p-8">
                <div className="w-full max-w-4xl mx-auto space-y-8">
                    <ResultDisplay
                        video={videoData}
                        isLoadingReport={isLoadingReport}
                        report={report}
                        error={error}
                        isGeneratingNewScript={isGeneratingNewScript}
                        improvedScript={improvedScript}
                        scriptGenerationError={scriptGenerationError}
                        onGenerateNewScript={handleGenerateNewScript}
                        onRetryGenerate={handleRetryGenerate}
                        onCopy={handleCopyText}
                        isEditingReport={isEditingReport}
                        onEditReport={handleStartEditReport}
                        onSaveReport={handleSaveEditReport}
                        onCancelEditReport={handleCancelEditReport}
                        currentView={currentView}
                        onViewChange={setCurrentView}
                        isEditingScript={isEditingScript}
                        onEditScript={handleStartEdit}
                        onSaveEditScript={handleSaveEdit}
                        onCancelEditScript={handleCancelEdit}
                        onSaveToFirestore={handleSaveScript}
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
            <Footer />
        </div>
    );
}
