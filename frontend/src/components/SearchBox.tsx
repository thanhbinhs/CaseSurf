'use client';

import { useState, FormEvent } from 'react';

type SearchBoxProps = {
    placeholder?: string;
    onSearch: (query: string) => void;
    isLoading?: boolean;
};

export default function SearchBox({
    placeholder = 'Tìm kiếm...',
    onSearch,
    isLoading = false,
}: SearchBoxProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Chỉ thực hiện tìm kiếm khi không đang tải và có nội dung
        if (!isLoading && query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="relative flex items-center w-full h-14 rounded-full border border-gray-300 bg-white shadow-sm transition-all duration-300 
                       focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/50"
        >
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                disabled={isLoading}
                className="w-full h-full pl-6 pr-20 rounded-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none disabled:text-gray-500"
            />
            <button
                disabled={isLoading || !query.trim()}
                type="submit"
                aria-label="Tìm kiếm"
                // Sửa đổi class để thay đổi giao diện khi bị vô hiệu hóa
                className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
                {/* --- THAY ĐỔI CHÍNH NẰM Ở ĐÂY --- */}
                {isLoading ? (
                    // Hiển thị spinner khi đang tải
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    // Hiển thị icon tìm kiếm khi bình thường
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                        ></path>
                    </svg>
                )}
            </button>
        </form>
    );
}
