// components/research/ResultDisplay.tsx

'use client';
import React from 'react';
import { AnalysisReport } from './AnalysisReport';
import { ImprovedScript } from './ImprovedScript';
import { ProgressBar } from '@/components/ProgressBar'; // Giả định đã export
import { AlertTriangleIcon } from '@/components/Icons'; // Giả định đã export

interface ResultDisplayProps {
    // Trạng thái chung
    isLoadingReport: boolean;
    report: string;
    error: string | null;

    // Trạng thái cải tiến
    isGeneratingNewScript: boolean;
    improvedScript: string;
    scriptGenerationError: string | null;

    // Callbacks
    onGenerateNewScript: (improvements: string[]) => void;
    onRetryGenerate: () => void;
    onCopy: (text: string) => void;
}

export const ResultDisplay = (props: ResultDisplayProps) => {
    const {
        isLoadingReport, report, error,
        isGeneratingNewScript, improvedScript, scriptGenerationError,
        onGenerateNewScript, onRetryGenerate, onCopy
    } = props;
    
    // 1. Hiển thị thanh tiến trình chính
    if (isLoadingReport) {
        return <ProgressBar isLoading={true} title="Analyzing URL..." />;
    }

    // 2. Hiển thị lỗi chính
    if (error) {
        return (
            <div className="text-center mt-16 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
                <p className="text-red-600 mt-2">{error}</p>
            </div>
        );
    }
    
    // 3. Hiển thị báo cáo gốc
    if (report && !improvedScript && !isGeneratingNewScript && !scriptGenerationError) {
        return <AnalysisReport report={report} onGenerateNewScript={onGenerateNewScript} onCopy={onCopy} />
    }
    
    // 4. Hiển thị thanh tiến trình khi tạo kịch bản mới
    if (isGeneratingNewScript) {
        return <ProgressBar isLoading={true} title="Creating New Script..." />;
    }
    
    // 5. Hiển thị lỗi khi tạo kịch bản mới
    if (scriptGenerationError) {
         return (
            <div className="text-center p-6 bg-red-50/50 border-2 border-red-200 rounded-lg flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangleIcon className="w-6 h-6" />
                    <p className="font-semibold">An Error Occurred</p>
                </div>
                <p className="text-red-600 max-w-md">{scriptGenerationError}</p>
                <button onClick={onRetryGenerate} className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                    Try Again
                </button>
            </div>
        );
    }
    
    // 6. Hiển thị kịch bản đã cải tiến
    if (improvedScript) {
        return <ImprovedScript script={improvedScript} onCopy={onCopy} />;
    }
    
    // Mặc định không hiển thị gì
    return null;
};