// components/Navbar.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth';
import Buttonv1 from './Buttonv1';

// Import các thành phần cần thiết từ Firebase
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// --- Icons ---
const CoinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
        <path fill="#FBBE24" stroke="#FBBF24" strokeWidth="0.5" d="M10 16.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#A16207">C</text>
    </svg>
);

const LibraryIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5"}>
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
    </svg>
);


// Kiểu dữ liệu cho profile người dùng trên Firestore
interface UserProfile {
  credit: number;
}

export default function Navbar() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                } else {
                    console.log("No such user profile!");
                }
            });
            return () => unsubscribe();
        } else {
            setUserProfile(null);
        }
    }, [user]);

    const handleNavigation = (path: string) => {
        router.push(path);
        setIsDropdownOpen(false);
    };

    const handleSignOut = () => {
        signOutUser();
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderUserSection = () => {
        if (loading) {
            return <div className="w-28 h-10 bg-slate-200 rounded-full animate-pulse"></div>;
        }

        if (user) {
            return (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleNavigation('/payment')}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <CoinIcon className="w-5 h-5 text-yellow-500" />
                        <span>{userProfile ? userProfile.credit : '...'}</span>
                    </button>

                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="cursor-pointer block rounded-full overflow-hidden border-2 border-transparent hover:border-purple-500 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                            <Image
                                src={user.photoURL || '/images/default_avatar.jpg'}
                                alt="User"
                                width={40}
                                height={40}
                                className="object-cover"
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-60 bg-white rounded-lg shadow-xl py-2 z-50 border border-slate-100">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="font-semibold text-slate-800 truncate">{user.displayName}</p>
                                    <p className="text-sm text-slate-500 truncate">{user.email}</p>
                                </div>
                                <div className="py-1">
                                    <a
                                        href="#"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        onClick={(e) => { e.preventDefault(); handleNavigation('/personal'); }}
                                    >
                                        <LibraryIcon className="w-5 h-5 text-slate-500" />
                                        <span>My Library</span>
                                    </a>
                                </div>
                                <div className="py-1">
                                    <a
                                        href="#"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                        onClick={(e) => { e.preventDefault(); handleNavigation('/auth'); }}
                                    >
                                        <ProfileIcon className="w-5 h-5 text-slate-500" />
                                        <span>Profile</span>
                                    </a>
                                </div>

                                <div className="border-t border-slate-100 py-1">
                                    <a
                                        href="#"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                                    >
                                        <LogoutIcon className="w-5 h-5" />
                                        <span>Sign Out</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-3">
                <Buttonv1 onClick={() => handleNavigation('/auth')} >
                    Sign In
                </Buttonv1>
            </div>
        );
    };

    return (
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40 h-20">
            <div className='container mx-auto flex items-center justify-between h-full px-4'>
                <div className="flex items-center gap-10">
                    <div className="text-white text-2xl font-bold cursor-pointer" onClick={() => handleNavigation('/')}>
                        <Image src="/images/logo.svg" alt="Logo" width={140} height={35} className="h-9 w-auto" />
                    </div>
                    <div className='hidden md:flex items-center space-x-8'>
                        <button
                            className="text-slate-600 hover:text-purple-600 font-semibold cursor-pointer transition-colors text-sm"
                            onClick={() => handleNavigation('/library')}
                        >
                            TikTok Library
                        </button>
                        <button
                            className="text-slate-600 hover:text-purple-600 font-semibold transition-colors cursor-pointer text-sm"
                            onClick={() => handleNavigation('/research')}
                        >
                            Research
                        </button>
                        <button
                            className="text-slate-600 hover:text-purple-600 font-semibold transition-colors cursor-pointer text-sm"
                            onClick={() => handleNavigation('/payment')}
                        >
                            Payment
                        </button>
                        
                    </div>
                </div>
                
                <div className='ml-auto'>
                    {renderUserSection()}
                </div>
            </div>
        </nav>
    );
}
