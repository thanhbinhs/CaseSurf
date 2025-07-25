// app/library/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';

import { TikTokEmbed } from 'react-social-media-embed';
import { Footer } from '@/components/Footer';

// Định nghĩa cấu trúc dữ liệu cho một script đã lưu
interface SavedScript {
    id: string; // ID của document trong Firestore
    tiktokUrl: string;
    // Bạn có thể thêm các trường khác nếu muốn hiển thị (ví dụ: originalReport)
}

export default function PersonalPage() {
    const { user } = useAuth();
    const [scripts, setScripts] = useState<SavedScript[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Hàm để lấy dữ liệu từ Firestore
        const fetchScripts = async () => {
            if (!user) {
                // Nếu người dùng chưa đăng nhập, không cần làm gì cả
                setIsLoading(false);
                return;
            }
            try {
                const scriptsCollectionRef = collection(db, 'users', user.uid, 'saved_scripts');
                // Sắp xếp theo ngày lưu, mới nhất lên đầu
                const q = query(scriptsCollectionRef, orderBy('savedAt', 'desc'));
                const querySnapshot = await getDocs(q);
                
                const fetchedScripts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as SavedScript));
                
                setScripts(fetchedScripts);
            } catch (err) {
                console.error("Error fetching saved scripts:", err);
                setError("Không thể tải danh sách script đã lưu.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchScripts();
    }, [user]); // Chạy lại mỗi khi thông tin người dùng thay đổi

    const renderContent = () => {
        if (isLoading) {
            return <p className="text-center text-slate-500 mt-16">Loading...</p>;
        }

        if (error) {
            return <p className="text-center text-red-500 mt-16">{error}</p>;
        }

        if (!user) {
            return (
                <div className="text-center mt-16">
                    <p className="text-slate-600">Please log in to view your saved scripts.</p>
                    {/* You can add a login button here */}
                </div>
            );
        }

        if (scripts.length === 0) {
            return (
                <div className="text-center mt-16">
                    <p className="text-slate-600">Your library is empty.</p>
                    <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                        Start analyzing a new video
                    </Link>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {scripts.map((script) => (
                    <div key={script.id} className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
                        <TikTokEmbed url={script.tiktokUrl} width="100%" height="420px" />
                        <Link 
                            href={`/research?url=${encodeURIComponent(script.tiktokUrl)}`}
                            className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg text-sm transition-colors w-full text-center"
                        >
                            View Analysis
                        </Link>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow p-4 md:p-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-slate-800 mb-8">Your Script Library</h1>
                    {renderContent()}
                </div>
            </main>
            <Footer />
        </div>
    );
}
