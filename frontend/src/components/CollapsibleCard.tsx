// components/CollapsibleCard.tsx

import React, { useState } from 'react';
// Giả sử các icon này được import từ một file tập trung
import { ChevronDownIcon, ClipboardIcon, PencilIcon, SaveIcon } from './Icons';

// Định nghĩa props một cách rõ ràng và nhất quán
interface CollapsibleCardProps {
    title: string;
    children: React.ReactNode;
    onCopy: () => void;
    copyText: string;
    onSave?: () => void;
    isSaving?: boolean;
    onEdit?: () => void;
    borderClass?: string;
    titleColor?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
    title,
    children,
    onCopy,
    copyText,
    onSave,
    isSaving = false, // Cung cấp giá trị mặc định
    onEdit,
    borderClass = 'border-slate-200',
    titleColor = 'text-gray-800',
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    // Tách các hàm xử lý sự kiện để code dễ đọc hơn
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Ngăn card bị đóng/mở khi nhấn nút
        onCopy();
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(); // Gọi hàm onEdit nếu nó tồn tại
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSave?.(); // Gọi hàm onSave nếu nó tồn tại
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg border ${borderClass} overflow-hidden transition-all duration-300`}>
            <header
                className="flex items-center justify-between p-4 md:p-5 cursor-pointer"
                onClick={toggleOpen}
            >
                <h2 className={`text-xl md:text-2xl font-bold ${titleColor} truncate pr-4`}>{title}</h2>
                <div className="flex items-center gap-2">
                    {/* Các nút chức năng */}
                    {onSave && (
                        <button
                            onClick={handleSave}
                            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-100 hover:bg-blue-200"
                            title="Lưu vào Firestore"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <span className="text-sm text-blue-600 font-semibold px-1">Saving...</span>
                            ) : (
                                <SaveIcon className="w-5 h-5 text-blue-600" />
                            )}
                        </button>
                    )}
                    {onEdit && (
                        <button
                            onClick={handleEdit}
                            className="p-2 rounded-lg transition-colors bg-slate-100 hover:bg-slate-200"
                            title="Edit content"
                        >
                            <PencilIcon className="w-5 h-5 text-slate-600" />
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg transition-colors bg-slate-100 hover:bg-slate-200"
                        title={isCopied ? "Đã chép!" : "Copy nội dung"}
                    >
                        {isCopied ? (
                             <span className="text-sm text-blue-600 font-semibold px-1">Copied!</span>
                        ) : (
                            <ClipboardIcon className="w-5 h-5 text-slate-600" />
                        )}
                    </button>
                    
                    {/* Nút đóng/mở */}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
                        className="p-2 rounded-lg hover:bg-slate-100"
                        title={isOpen ? "Collapse" : "Expand"}
                    >
                        <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </header>
            <div
                className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-4 md:px-6 pb-6 md:pb-8 border-t border-slate-200 pt-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
