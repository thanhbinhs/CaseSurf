import React, {useState} from 'react';
import { ChevronDownIcon } from './Icons';
import {ClipboardIcon} from './Icons';

export const CollapsibleCard = ({
    title,
    children,
    onCopy,
    copyText,
    borderClass = 'border-slate-200',
    titleColor = 'text-gray-800',
}: {
    title: string;
    children: React.ReactNode;
    onCopy: () => void;
    copyText: string;
    borderClass?: string;
    titleColor?: string;
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-lg border ${borderClass} overflow-hidden`}>
            <div className="flex items-center justify-between p-4 md:p-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h2 className={`text-xl md:text-2xl font-bold ${titleColor} truncate pr-4`}>{title}</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition"
                        title={isCopied ? "Đã chép!" : "Copy nội dung"}
                    >
                        {isCopied ? <span className="text-sm text-blue-600 font-semibold px-1">Đã chép</span> : <ClipboardIcon className="w-5 h-5 text-slate-600" />}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-100">
                        <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 md:px-6 pb-6 md:pb-8 border-t border-slate-200">
                    {children}
                </div>
            </div>
        </div>
    );
};