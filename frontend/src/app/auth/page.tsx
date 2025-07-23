'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signOutUser } from '@/lib/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Thêm import

// --- Icons ---
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,36.626,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

// --- Kiểu dữ liệu ---
interface UserProfile {
    username: string;
    gmail: string;
    credit: number;
}

export default function Home() {
    const router = useRouter(); // Thêm router để điều hướng
    const { user, loading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                } else {
                    console.log("User document does not exist.");
                }
            });
            return () => unsubscribe();
        } else {
            setUserProfile(null);
        }
    }, [user]);

    // --- Component Nội dung Đăng nhập ---
    const LoginContent = () => (
        <div className="w-full max-w-md mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200 text-center">
            <Image src="/images/logo.svg" alt="CaseSurf Logo" width={180} height={45} className="mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
            <p className="text-slate-500 mb-8">Sign in to continue your journey to viral success.</p>
            <button
                onClick={signInWithGoogle}
                className="cursor-pointer w-full inline-flex justify-center items-center gap-3 py-3 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
                <GoogleIcon />
                Sign in with Google
            </button>
        </div>
    );

    // --- Component Nội dung Hồ sơ Người dùng ---
    const UserProfileContent = () => {
        if (!user) return null;

        return (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
            {user.photoURL && (
                <Image
                    src={user.photoURL}
                    alt="User Avatar"
                    width={96}
                    height={96}
                    className="rounded-full mx-auto mb-4 border-4 border-purple-200"
                />
            )}
            <h1 className="text-2xl font-bold text-slate-800">Welcome, {user.displayName}!</h1>
            <p className="text-slate-500 mb-6">{user.email}</p>

            <div className="bg-slate-100 border border-slate-200 rounded-lg py-3 px-4 my-6">
                <span className="text-slate-600">Available Credits: </span>
                <span className="font-bold text-purple-700 text-lg">
                    {userProfile ? userProfile.credit : '...'}
                </span>
            </div>

            <button
                onClick={() => router.push('/library')}
                className="cursor-pointer w-full mb-3 py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
                Go to Your Library
            </button>

            <button
                onClick={signOutUser}
                className="cursor-pointer w-full py-2 px-4 bg-transparent text-slate-500 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
                Sign Out
            </button>
        </div>
    );
    };

    // --- Giao diện chính ---
    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-grow flex items-center justify-center p-4">
                {loading ? (
                    <p>Loading...</p> // Bạn có thể thay thế bằng một spinner
                ) : user ? (
                    <UserProfileContent />
                ) : (
                    <LoginContent />
                )}
            </main>
        </div>
    );
}
