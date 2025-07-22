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

// Import Icon (ví dụ)
// import { CoinIcon } from './icons/CoinIcon';

// --- Icon (Tạm thời đặt ở đây cho tiện) ---
const CoinIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
        <path fill="#FBBE24" stroke="#FBBF24" strokeWidth="0.5" d="M10 16.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" />
        <path fill="#F59E0B" d="M10 3a1 1 0 011 1v.535a1 1 0 01-2 0V4a1 1 0 011-1zM10 15a1 1 0 01-1 1h-.535a1 1 0 110-2H9a1 1 0 011 1zM12.828 5.464a1 1 0 011.414 0l.379.379a1 1 0 010 1.414l-1.06 1.061a1 1 0 11-1.414-1.414l.707-.707a1 1 0 01.732-1.732zM5.464 12.828a1 1 0 010-1.414l1.06-1.061a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.732-.732z" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">C</text>
    </svg>
);


// Kiểu dữ liệu cho profile người dùng trên Firestore
interface UserProfile {
  credit: number;
  // các trường khác nếu có
}

export default function Navbar() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // State cho dữ liệu credit
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Lắng nghe thay đổi dữ liệu người dùng (bao gồm credit) trong thời gian thực
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            
            // onSnapshot sẽ lắng nghe mọi thay đổi trên document này
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data() as UserProfile);
                } else {
                    console.log("No such user profile!");
                }
            });

            // Hủy lắng nghe khi component unmount hoặc user thay đổi
            return () => unsubscribe();
        } else {
            // Reset profile khi người dùng đăng xuất
            setUserProfile(null);
        }
    }, [user]);

    const handleNavigation = (path: string) => {
        router.push(path);
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const renderUserSection = () => {
        if (loading) {
            return <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>;
        }

        if (user) {
            return (
                <div className="flex items-center gap-4">
                    {/* Nút Credit */}
                    <button
                        onClick={() => handleNavigation('/payment')}
                        className="flex cursor-pointer items-center gap-2 px-3 py-2 bg-yellow-400 text-yellow-900 font-bold rounded-full shadow-md hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105"
                    >
                        <CoinIcon className="w-5 h-5" />
                        <span>{userProfile ? userProfile.credit : '...'}</span>
                    </button>

                    {/* Dropdown Avatar */}
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="cursor-pointer block rounded-full overflow-hidden border-2 border-transparent hover:border-blue-400 transition-colors">
                            <Image
                                src={user.photoURL || '/images/default-avatar.png'}
                                alt="User Avatar"
                                width={40}
                                height={40}
                                className="object-cover"
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 text-gray-800">
                                <div className="px-4 py-2 border-b border-gray-200">
                                    <p className="font-bold truncate">{user.displayName}</p>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                <a
                                    href="#"
                                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                                    onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                                >
                                    Đăng xuất
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return <Buttonv1 onClick={() => handleNavigation('/auth')}>Login</Buttonv1>;
    };

    return (
        <nav className="bg-gray-800 p-4 h-20 shadow-md">
            <div className='container mx-auto flex items-center h-full'>
                <div className="text-white text-2xl font-bold cursor-pointer" onClick={() => handleNavigation('/')}>
                    <Image src="/images/logo.svg" alt="Logo" width={160} height={40} className="h-10 w-auto" />
                </div>
                <div className='flex space-x-6 ml-10'>
                    <button
                        className="text-gray-300 hover:text-white font-medium cursor-pointer transition-colors"
                        onClick={() => handleNavigation('/library')}
                    >
                        TikTok Library
                    </button>
                    <button
                        className="text-gray-300 hover:text-white font-medium transition-colors cursor-pointer"
                        onClick={() => handleNavigation('/research')}
                    >
                        Research
                    </button>
                </div>
                <div className='ml-auto'>
                    {renderUserSection()}
                </div>
            </div>
        </nav>
    );
}