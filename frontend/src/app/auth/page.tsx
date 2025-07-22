// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '@/lib/auth';
// Sửa đổi import để dùng onSnapshot
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

// --- Icons (giữ nguyên) ---
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,36.626,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

// --- Kiểu dữ liệu (giữ nguyên) ---
interface UserProfile {
    username: string;
    gmail: string;
    credit: number;
}

export default function Home() {
    const { user, loading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // [THAY ĐỔI] Lắng nghe dữ liệu profile thời gian thực
    useEffect(() => {
        // Nếu có user, bắt đầu lắng nghe thay đổi
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            
            // onSnapshot sẽ kích hoạt mỗi khi dữ liệu của user thay đổi
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                } else {
                    console.log("Tài liệu người dùng không tồn tại.");
                }
            });

            // Dọn dẹp listener khi component unmount hoặc user thay đổi
            return () => unsubscribe();
        } else {
            // Reset profile khi user đăng xuất
            setUserProfile(null);
        }
    }, [user]); // Phụ thuộc vào `user`

    // --- Component LoginContent (giữ nguyên) ---
    const LoginContent = () => (
        <div className="w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bắt đầu hành trình</h1>
            <p className="text-gray-500 mb-8">Đăng nhập để khám phá và sáng tạo không giới hạn.</p>
            <button
                onClick={signInWithGoogle}
                className="w-full inline-flex justify-center items-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
                <GoogleIcon />
                Đăng nhập bằng Google
            </button>
        </div>
    );

    // --- Component UserProfileContent (giữ nguyên) ---
    const UserProfileContent = () => {
        if (!user) return null;

        return (
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg text-center">
            {user.photoURL && (
                <div className="relative w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-purple-200">
                    <Image
                        src={user.photoURL}
                        alt="User Avatar"
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{user.displayName}</h1>
            <p className="text-gray-500 mb-4">{user.email}</p>

            <div className="bg-purple-50 text-purple-700 font-bold text-lg rounded-lg py-2 px-4 my-6">
                {/* Hiển thị '...' khi userProfile chưa có dữ liệu */}
                Credit: {userProfile ? userProfile.credit : '...'}
            </div>

            <button
                onClick={signOutUser}
                className="w-full py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
                Đăng xuất
            </button>
        </div>
    );
    };

    // --- Return chính (giữ nguyên) ---
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow grid grid-cols-1 md:grid-cols-2">
                {/* --- Cột bên trái: Background --- */}
                <div className="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                    <div className="max-w-md text-center">
                        <h2 className="text-4xl font-bold mb-4">CaseSurf</h2>
                        <p className="text-lg text-purple-200">
                            Nền tảng phân tích và sáng tạo kịch bản video ngắn, giúp bạn tạo ra những nội dung triệu view.
                        </p>
                    </div>
                </div>

                {/* --- Cột bên phải: Nội dung chính --- */}
                <div className="flex items-center justify-center p-8">
                    {loading ? (
                        <p>Đang tải...</p>
                    ) : user ? (
                        <UserProfileContent />
                    ) : (
                        <LoginContent />
                    )}
                </div>
            </main>
        </div>
    );
}