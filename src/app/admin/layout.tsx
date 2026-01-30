"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    HomeIcon,
    ShoppingBagIcon,
    UsersIcon,
    CubeIcon,
    CogIcon,
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    UserIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

const navigation = [
    { name: 'Overview', href: '/admin', icon: HomeIcon },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
    { name: 'Products', href: '/admin/products', icon: CubeIcon },
    { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!loading && mounted) {
            if (!user) {
                router.push('/login');
            } else if (profile && profile.role !== 'admin') {
                router.push('/dashboard');
            }
        }
    }, [user, profile, loading, router, mounted]);

    if (loading || !mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600"></div>
            </div>
        );
    }

    if (!user || !profile || profile.role !== 'admin') {
        // If user exists but profile is explicitly loading/missing, show loading
        if (user && !profile) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600"></div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-50 h-full w-56 bg-white shadow-lg transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200">
                    <h1 className="text-xs font-bold text-slate-800 whitespace-nowrap">Admin Panel</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1 rounded hover:bg-slate-100"
                    >
                        <XMarkIcon className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                                    flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap
                                    ${isActive
                                        ? 'bg-aqua-50 text-aqua-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                                `}
                            >
                                <item.icon className={`mr-2 h-4 w-4 ${isActive ? 'text-aqua-600' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sign Out */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="mr-2 h-4 w-4 text-slate-400" />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to logout?')) {
                                logout();
                            }
                        }}
                        className="flex items-center w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                    >
                        <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4 text-slate-400" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="md:ml-56">
                {/* Top header */}
                <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200">
                    <div className="flex items-center justify-between h-14 px-4 md:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                        >
                            <Bars3Icon className="h-5 w-5 text-slate-600" />
                        </button>
                        <div className="flex items-center space-x-4 ml-auto">
                            <Link
                                href="/admin/settings"
                                className="flex items-center gap-1 text-xs text-slate-600 hover:text-aqua-600 transition-colors mr-2"
                            >
                                <UserIcon className="h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                            <span className="text-xs text-slate-600 whitespace-nowrap">
                                Welcome, <span className="font-medium text-slate-800">{profile?.full_name || 'Admin'}</span>
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
