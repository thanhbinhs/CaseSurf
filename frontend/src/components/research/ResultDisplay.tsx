'use client';
import React, { JSX, useEffect, useRef } from 'react';
import { AnalysisReport } from './AnalysisReport';
import { ImprovedScript } from './ImprovedScript';
import { ProgressBar } from '@/components/ProgressBar';
import { AlertTriangleIcon } from '@/components/Icons';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { TikTokData } from '@/types/tiktok'; // Giả sử bạn có file type này
import {
    Tags, Type, AArrowDown, AArrowUp, PenSquare, FileText, Anchor, ShoppingBag
} from 'lucide-react';

// --- Định nghĩa Interface ---
interface ResultDisplayProps {
    video: TikTokData | null; // <<< THÊM: Prop để nhận dữ liệu video
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
    isEditingReport: boolean;
    onEditReport: () => void;
    onSaveReport: (newReport: string) => void;
    onCancelEditReport: () => void;
    isEditingScript: boolean;
    onEditScript: () => void;
    onSaveEditScript: (newScript: string) => void;
    onCancelEditScript: () => void;
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



// --- Component phụ cho các trạng thái bên trong Card ---
const InlineLoader = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-semibold">{text}</p>
    </div>
);

const InlineError = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <div className="p-8 text-center bg-red-50/50 border-2 border-red-200 rounded-lg flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-red-700">
            <AlertTriangleIcon className="w-6 h-6" />
            <p className="font-semibold">An Error Occurred</p>
        </div>
        <p className="text-red-600 max-w-md">{message}</p>
        <button onClick={onRetry} className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Try Again
        </button>
    </div>
);

const attributeIcons: Record<string, JSX.Element> = {
    'Niche': <Tags size={16} className="text-sky-600" />,
    'Content Angle': <Type size={16} className="text-purple-600" />,
    'Hook Type': <Anchor size={16} className="text-amber-600" />,
    'Product Type': <ShoppingBag size={16} className="text-emerald-600" />,
    'Product Type & Key Benefits': <AArrowDown size={16} className="text-slate-500" />,
    'Target Audience & Problem': <AArrowUp size={16} className="text-slate-500" />,
    'Script Framework': <FileText size={16} className="text-rose-600" />,
    'Default': <PenSquare size={16} className="text-slate-500" />
};

const VideoAttributesDisplay = ({ video }: { video: TikTokData }) => {
    // We remove 'Title' from this list because it's already used as the main header
    const videoAttributes = [
        { label: 'Niche', value: video.niche },
        { label: 'Content Angle', value: video.content_angle },
        { label: 'Hook Type', value: video.hook_type },
        { label: 'Product Type', value: video.product_type },
        { label: 'Product Type & Key Benefits', value: video.title1 },
        { label: 'Target Audience & Problem', value: video.title2 },
        { label: 'Script Framework', value: video.script_framework }
    ].filter(attr => attr.value); // Only show attributes that have a value

    if (videoAttributes.length === 0) {
        return null; // Don't render anything if there are no attributes
    }

    return (
        <div className="p-5 bg-white rounded-xl shadow-md border border-slate-200 mb-6">
            {/* Main Title */}
            <h3 className="text-xl font-bold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                {video.title}
            </h3>

            {/* Attributes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {videoAttributes.map((attr) => (
                    <div key={attr.label} className="flex flex-col gap-1">
                        {/* Attribute Label with Icon */}
                        <div className="flex items-center gap-2">
                            {attributeIcons[attr.label as string] || attributeIcons['Default']}
                            <span className="text-sm font-semibold text-slate-600">
                                {attr.label}
                            </span>
                        </div>
                        {/* Attribute Value as a Badge */}
                        <span className="text-base font-medium text-slate-900 bg-slate-100 px-3 py-1 rounded-md w-fit">
                            {attr.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ResultDisplay = (props: ResultDisplayProps) => {
    const {
        video, // <<< Lấy prop video
        isLoadingReport, report, error,
        isGeneratingNewScript, improvedScript, scriptGenerationError,
        isEditingReport, isEditingScript,
        currentView, onViewChange
    } = props;

    // --- Xử lý các trạng thái chiếm toàn bộ màn hình trước ---
    if (isLoadingReport) return <ProgressBar isLoading={true} title="Analyzing URL..." />;
    if (error) return (
        <div className="text-center mt-16 p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
            <p className="text-red-600 mt-2">{error}</p>
        </div>
    );
    if (isEditingReport) return <DirectEditor title="Edit Analysis Report" initialContent={report} onSave={props.onSaveReport} onCancel={props.onCancelEditReport} />;
    if (isEditingScript) return <DirectEditor title="Edit Script" initialContent={improvedScript} onSave={props.onSaveEditScript} onCancel={props.onCancelEditScript} />;


    // --- Component Nút Tab ---
    const TabButton = ({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`px-4 py-3 font-semibold text-sm transition-colors duration-200 border-b-2 ${
                isActive 
                ? 'border-purple-600 text-purple-600' 
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-300'
            }`}
        >
            {label}
        </button>
    );

    // --- Component chính để hiển thị kết quả ---
    const renderContent = () => {
        if (isGeneratingNewScript) {
            return <InlineLoader text="Generating new script..." />;
        }
        if (scriptGenerationError) {
            return <InlineError message={scriptGenerationError} onRetry={props.onRetryGenerate} />;
        }

        if (currentView === 'report') {
            return (
                <>
                    {/* <<< THÊM: Hiển thị thuộc tính video ở đây */}
                    {video && <VideoAttributesDisplay video={video} />}
                    <AnalysisReport
                        report={report}
                        onGenerateNewScript={props.onGenerateNewScript}
                        onCopy={props.onCopy}
                        onEdit={props.onEditReport}
                        isGenerating={isGeneratingNewScript}
                    />
                </>
            );
        }

        if (currentView === 'script' && improvedScript) {
            return (
                <ImprovedScript
                    script={improvedScript}
                    onCopy={props.onCopy}
                    onEdit={props.onEditScript}
                    onSave={props.onSaveToFirestore}
                    isSaving={props.isSaving}
                    onGenerateNewScript={props.onGenerateNewScript}
                    isGenerating={isGeneratingNewScript}
                />
            );
        }
        return null;
    };

    if (report) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Header với các Tab */}
                {improvedScript && (
                    <header className="px-4 border-b border-slate-200">
                        <nav className="flex justify-center -mb-px">
                            <TabButton label="Analysis Report" isActive={currentView === 'report'} onClick={() => onViewChange('report')} />
                            <TabButton label="Improved Script" isActive={currentView === 'script'} onClick={() => onViewChange('script')} />
                        </nav>
                    </header>
                )}
                
                {/* Khu vực hiển thị nội dung chính */}
                <div className="p-2 sm:p-6 transition-opacity duration-300">
                    {renderContent()}
                </div>
            </div>
        );
    }

    return null;
};
