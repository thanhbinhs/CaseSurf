import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const ProgressBar = ({ isLoading, title }: { isLoading: boolean, title: string }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const interval = setInterval(() => {
                setProgress(oldProgress => {
                    if (oldProgress >= 95) {
                        clearInterval(interval);
                        return oldProgress;
                    }
                    const diff = Math.random() * 10;
                    return Math.min(oldProgress + diff, 95);
                });
            }, 3000); // Tăng tốc độ giả lập
            return () => clearInterval(interval);
        } else {
            setProgress(100);
        }
    }, [isLoading]);

    if (!isLoading && progress < 100) return null;

    return (
        <div className="w-full max-w-2xl mx-auto my-10 text-center">
            <p className="text-lg text-gray-600 mb-4">{title}</p>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-sm text-blue-700 font-semibold mt-2">{Math.round(progress)}%</p>
        </div>
    );
};
