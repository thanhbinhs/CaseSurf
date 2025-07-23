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

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && query && !isLoading) {
      onSearch(query);
    }
  };


    // Sử dụng handleSubmit trên form để bắt cả sự kiện click và nhấn Enter
    const handleSubmit = (e: FormEvent) => {
        // Ngăn trang tải lại khi form được submit
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        // 1. Sử dụng <form> để có ngữ nghĩa tốt hơn và xử lý phím Enter
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
                // 2. Input không cần border riêng và có padding-right để không bị che bởi button
                className="w-full h-full pl-6 pr-16 rounded-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button
             disabled={isLoading || !query.trim()}
                type="submit" // 3. Thêm type="submit" cho accessibility
                aria-label="Tìm kiếm" // Và aria-label
                className="absolute cursor-pointer right-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
            >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                    ></path>
                </svg>
            </button>
        </form>
    );
}