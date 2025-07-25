// components/research/ResultDisplay.tsx

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisReport } from './AnalysisReport';
import { ImprovedScript } from './ImprovedScript';
import { ProgressBar } from '@/components/ProgressBar';
import { AlertTriangleIcon } from '@/components/Icons';
// MarkdownRenderer không còn cần thiết trong trình soạn thảo nữa, nhưng vẫn dùng ở nơi khác
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

// Định nghĩa một interface nhất quán cho tất cả các props
interface ResultDisplayProps {
    isLoadingReport: boolean;
    report: string;
    error: string | null;
    isGeneratingNewScript: boolean;
    improvedScript: string;
    scriptGenerationError: string | null;
    isSaving: boolean;

    onGenerateNewScript: (improvements: string[]) => void;
    onRetryGenerate: () => void;
    onCopy: (text: string) => void;

    // Props cho việc sửa REPORT
    isEditingReport: boolean;
    onEditReport: () => void;
    onSaveReport: (newReport: string) => void;
    onCancelEditReport: () => void;

    // Props cho việc sửa SCRIPT
    isEditingScript: boolean;
    onEditScript: () => void;
    onSaveEditScript: (newScript: string) => void;
    onCancelEditScript: () => void;

    // Prop để lưu vào Firestore
    onSaveToFirestore: () => void;

    currentView: 'report' | 'script';
    onViewChange: (view: 'report' | 'script') => void;
}

// --- Helper Functions for Editor ---
// Chuyển đổi Markdown đơn giản sang HTML để hiển thị trong editor
const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
        // SỬA LỖI: Tự động thêm khoảng trắng xung quanh dấu / để dễ đọc hơn
        .replace(/(\w)\/(\w)/g, '$1 / $2')
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
};

// Chuyển đổi HTML từ editor về lại Markdown để lưu trữ
const htmlToMarkdown = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<h3>(.*?)<\/h3>/gi, '### $1')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '*$1*')
        // Dọn dẹp các thẻ HTML khác mà editor có thể tự thêm vào
        .replace(/<div>/gi, '\n') 
        .replace(/<\/div>/gi, '')
        .replace(/&nbsp;/g, ' ')
        // SỬA LỖI: Xóa khoảng trắng xung quanh dấu / khi lưu để giữ cho mã nguồn Markdown sạch sẽ
        .replace(/(\w)\s+\/\s+(\w)/g, '$1/$2')
        .trim();
};


// Component trình soạn thảo WYSIWYG trực tiếp
const DirectEditor = ({ title, initialContent, onSave, onCancel }: {
    title: string;
    initialContent: string; // Nhận vào Markdown
    onSave: (markdownContent: string) => void; // Trả về Markdown
    onCancel: () => void;
}) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Cập nhật nội dung editor khi prop initialContent thay đổi
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = markdownToHtml(initialContent);
        }
    }, [initialContent]);

    const handleSave = () => {
        if (editorRef.current) {
            const finalMarkdown = htmlToMarkdown(editorRef.current.innerHTML);
            onSave(finalMarkdown);
        }
    };

    const applyFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    // Xử lý sự kiện nhấn phím để bắt phím tắt
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        // Hoàn tác: Ctrl+Z (Windows/Linux) hoặc Command+Z (Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            event.preventDefault();
            document.execCommand('undo');
        }
        // Làm lại: Ctrl+Y (Windows/Linux) hoặc Command+Shift+Z (Mac)
        if ((event.ctrlKey && event.key === 'y') || (event.metaKey && event.shiftKey && event.key === 'z')) {
            event.preventDefault();
            document.execCommand('redo');
        }
    };

    const ToolbarButton = ({ label, onClick, title }: { label: string; onClick: () => void, title?: string }) => (
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-bold rounded" title={title}>
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-6 bg-white border-2 border-blue-300 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-blue-800 mb-2">{title}</h3>
            
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded-md border border-slate-200">
                <ToolbarButton label="Undo" onClick={() => applyFormat('undo')} title="Hoàn tác (Ctrl+Z)" />
                <ToolbarButton label="Redo" onClick={() => applyFormat('redo')} title="Làm lại (Ctrl+Y)" />
                <ToolbarButton label="B" onClick={() => applyFormat('bold')} title="In đậm" />
                <ToolbarButton label="I" onClick={() => applyFormat('italic')} title="In nghiêng" />
                <ToolbarButton label="H3" onClick={() => applyFormat('formatBlock', '<h3>')} title="Tiêu đề" />
            </div>

            <div
                ref={editorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onKeyDown={handleKeyDown}
                className="w-full h-96 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white overflow-y-auto"
                style={{ lineHeight: '1.6' }}
            />

            <div className="flex justify-end gap-4 mt-4">
                <button onClick={onCancel} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-2 px-6 rounded-lg">Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg">Save Changes</button>
            </div>
        </div>
    );
};


export const ResultDisplay = (props: ResultDisplayProps) => {
    const {
        isLoadingReport, report, error,
        isGeneratingNewScript, improvedScript, scriptGenerationError,
        onGenerateNewScript, onRetryGenerate, onCopy,
        isEditingReport, onEditReport, onSaveReport, onCancelEditReport,
        isEditingScript, onEditScript, onSaveEditScript, onCancelEditScript,
        onSaveToFirestore, isSaving, currentView, onViewChange
    } = props;

    if (isLoadingReport) {
        return <ProgressBar isLoading={true} title="Analyzing URL..." />;
    }

    if (isEditingReport) {
        return (
            <DirectEditor
                title="Edit Analysis Report"
                initialContent={report}
                onSave={onSaveReport}
                onCancel={onCancelEditReport}
            />
        );
    }

    if (isEditingScript) {
        return (
            <DirectEditor
                title="Edit Script"
                initialContent={improvedScript}
                onSave={onSaveEditScript}
                onCancel={onCancelEditScript}
            />
        );
    }

        const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={` cursor-pointer px-4 py-2 font-semibold text-sm sm:text-base transition-colors duration-200 ${isActive ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'}`}
        >
            {label}
        </button>
    );

    if (error) {
        return (
            <div className="text-center mt-16 p-6 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
                <p className="text-red-600 mt-2">{error}</p>
            </div>
        );
    }

    if (isGeneratingNewScript) {
        return <ProgressBar isLoading={true} title="Creating New Script..." />;
    }

    if (scriptGenerationError) {
        return (
            <div className="text-center p-6 bg-red-50/50 border-2 border-red-200 rounded-lg flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangleIcon className="w-6 h-6" />
                    <p className="font-semibold">An Error Occurred</p>
                </div>
                <p className="text-red-600 max-w-md">{scriptGenerationError}</p>
                <button onClick={onRetryGenerate} className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">Try Again</button>
            </div>
        );
    }

    if (report) {
        return (
            <div className="space-y-4">
                {/* Chỉ hiển thị Tab khi có cả report và script */}
                {improvedScript && (
                    <div className="flex justify-center border-b border-slate-200 bg-white/50 backdrop-blur-sm rounded-t-lg sticky top-[80px] z-10">
                        <TabButton label="Analysis Report" isActive={currentView === 'report'} onClick={() => onViewChange('report')} />
                        <TabButton label="Improved Script" isActive={currentView === 'script'} onClick={() => onViewChange('script')} />
                    </div>
                )}
                
                {/* Hiển thị nội dung dựa trên tab được chọn */}
                <div className="transition-opacity duration-300">
                    {currentView === 'report' && (
                        <AnalysisReport
                            report={report}
                            onGenerateNewScript={props.onGenerateNewScript}
                            onCopy={props.onCopy}
                            onEdit={props.onEditReport}
                            isGenerating={isGeneratingNewScript}
                        />
                    )}
                    {currentView === 'script' && improvedScript && (
                        <ImprovedScript
                            script={improvedScript}
                            onCopy={props.onCopy}
                            onEdit={props.onEditScript}
                            onSave={props.onSaveToFirestore}
                            isSaving={props.isSaving}
                            onGenerateNewScript={props.onGenerateNewScript}
                            isGenerating={isGeneratingNewScript}
                        />
                    )}
                </div>
                {/*  */}

                {/* Hiển thị thanh tiến trình hoặc lỗi khi đang tạo script mới */}
                {isGeneratingNewScript && <ProgressBar isLoading={true} title="Creating New Script..." />}
                {scriptGenerationError && (
                    <div className="text-center p-6 bg-red-50/50 border-2 border-red-200 rounded-lg flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-red-700"><AlertTriangleIcon className="w-6 h-6" /><p className="font-semibold">An Error Occurred</p></div>
                        <p className="text-red-600 max-w-md">{scriptGenerationError}</p>
                        <button onClick={props.onRetryGenerate} className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">Try Again</button>
                    </div>
                )}
            </div>
        );
    }

    return null;
};
