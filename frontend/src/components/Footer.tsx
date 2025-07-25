'use client';

import React from 'react';
import Image from 'next/image';

// --- SVG Icons (Không thay đổi) ---
const TwitterIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    </svg>
);
const GithubIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.164 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
    </svg>
);

// --- Dữ liệu điều hướng ---
// Tách dữ liệu ra khỏi JSX giúp dễ dàng quản lý và cập nhật liên kết.
const navigation = {
    product: [
        { name: 'Features', href: '#' },
        { name: 'Pricing', href: '#' },
        { name: 'Research Tool', href: '/research' },
    ],
    company: [
        { name: 'About Us', href: '#' },
        { name: 'Contact', href: '#' },
        { name: 'Careers', href: '#' },
    ],
    legal: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
    ],
    social: [
        { name: 'Twitter', href: '#', icon: TwitterIcon },
        { name: 'GitHub', href: '#', icon: GithubIcon },
    ],
};

export const Footer = () => {
    return (
        <footer className="bg-slate-900 text-white" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">
                Footer
            </h2>
            <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    {/* Cột 1: Logo và Mô tả */}
                    <div className="space-y-8">
                        <Image src="/images/logo.svg" alt="CaseSurf Logo" width={140} height={35} unoptimized />
                        <p className="text-sm leading-6 text-gray-300">
                           The platform for analyzing and creating short video scripts, helping you produce viral content.
                        </p>
                        <div className="flex space-x-6">
                            {navigation.social.map((item) => (
                                <a key={item.name} href={item.href} className="text-gray-500 hover:text-indigo-400 transition-colors duration-300">
                                    <span className="sr-only">{item.name}</span>
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    {/* Cột 2 & 3: Các liên kết */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 xl:col-span-2 xl:mt-0">
                        <div className="md:col-span-1">
                            <h3 className="text-sm font-semibold leading-6 text-white">Product</h3>
                            <ul role="list" className="mt-6 space-y-4">
                                {navigation.product.map((item) => (
                                    <li key={item.name}>
                                        <a href={item.href} className="text-sm leading-6 text-gray-300 hover:text-indigo-400 transition-colors duration-300">
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold leading-6 text-white">Company</h3>
                            <ul role="list" className="mt-6 space-y-4">
                                {navigation.company.map((item) => (
                                    <li key={item.name}>
                                        <a href={item.href} className="text-sm leading-6 text-gray-300 hover:text-indigo-400 transition-colors duration-300">
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-8 md:mt-0">
                            <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                            <ul role="list" className="mt-6 space-y-4">
                                {navigation.legal.map((item) => (
                                    <li key={item.name}>
                                        <a href={item.href} className="text-sm leading-6 text-gray-300 hover:text-indigo-400 transition-colors duration-300">
                                            {item.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Phần bản quyền ở dưới cùng */}
                <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
                    <p className="text-xs leading-5 text-gray-400">
                        &copy; {new Date().getFullYear()} CaseSurf. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};