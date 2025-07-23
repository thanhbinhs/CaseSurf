// components/ProgressBar.tsx

'use client';

import React, { useEffect, useState } from 'react';

export const ProgressBar = ({ isLoading, title }: { isLoading: boolean, title: string }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(oldProgress => {
                    // Giả lập tiến trình không bao giờ đạt 100% để thể hiện trạng thái "đang xử lý"
                    if (oldProgress >= 95) {
                        return oldProgress; // Giữ ở mức 95%
                    }
                    // Tạo ra bước tăng ngẫu nhiên để tiến trình trông tự nhiên hơn
                    const diff = Math.random() * 5;
                    return Math.min(oldProgress + diff, 95);
                });
            }, 800); // Tần suất cập nhật tiến trình
            return () => clearInterval(interval);
        } else {
            // Khi hoàn thành, đặt tiến trình là 100%
            setProgress(100);
        }
    }, [isLoading]);

    // Không hiển thị gì nếu không ở trạng thái loading và tiến trình đã hoàn tất
    if (!isLoading && progress < 100) return null;

    return (
        <div className="w-full max-w-2xl mx-auto my-12 text-center">
            <h2 className="text-2xl font-semibold text-slate-700 mb-3">{title}</h2>
            <p className="text-slate-500 mb-6">Please wait a moment while we process your request...</p>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-sm text-slate-600 font-semibold mt-3">{Math.round(progress)}% Complete</p>
        </div>
    );
};
