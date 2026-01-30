'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Aerator Sets', href: '/aerator-sets' },
    { name: 'Products', href: '/products' },
    { name: 'Spares', href: '/spares' },
    { name: 'Long Arm', href: '/long-arm' },
    { name: 'Compare', href: '/compare' },
    { name: 'Reviews', href: '/#reviews' },
    { name: 'Address', href: '/#address' },
];

export default function Header() {
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const { user, logout, profile } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        // Get cart count from localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartCount(cart.length);

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Listen for cart updates
    useEffect(() => {
        const handleCartUpdate = () => {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            setCartCount(cart.length);
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.05
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        setIsDesktopMenuOpen(false);
        setIsMobileMenuOpen(false);

        if (href.startsWith('/#')) {
            const elementId = href.replace('/#', '');
            if (pathname === '/') {
                const element = document.getElementById(elementId);
                if (element) {
                    const headerOffset = 80;
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            } else {
                router.push(href);
            }
        } else {
            router.push(href);
        }
    };

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isScrolled
                ? 'bg-white/90 backdrop-blur-md shadow-glass border-b border-aqua-100/50'
                : 'bg-transparent'
                }`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo - Fixed Alignment */}
                    {/* Logo - Left Aligned */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0 lg:w-auto relative z-10">
                        <img
                            src="/images/logo.png"
                            alt="Karthik Traders Logo"
                            className="h-12 md:h-14 w-auto group-hover:scale-105 transition-transform duration-300 object-contain"
                        />
                    </Link>

                    {/* Business Name - Center Aligned */}
                    <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group w-full max-w-[65%] md:max-w-none z-0">
                        <h1 className="font-black uppercase leading-none tracking-wide text-black transition-colors whitespace-nowrap" style={{ fontSize: 'clamp(20px, 3.5vw, 30px)' }}>
                            KARTHIK TRADERS
                        </h1>
                        <p className="font-bold tracking-wide text-black mt-0.5 whitespace-nowrap" style={{ fontSize: 'clamp(8.5px, 1.5vw, 13.5px)' }}>
                            Aquaculture Aerators & Spare Parts
                        </p>
                    </Link>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-4 relative z-20">


                        {/* Desktop Menu Button */}
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2.5 rounded-full border border-red-200 text-red-600 font-medium text-base hover:bg-red-50 transition-colors"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="px-3 py-1.5 rounded-full bg-aqua-600 text-white font-bold text-xs hover:bg-aqua-700 transition-colors shadow-sm"
                            >
                                Login
                            </Link>
                        )}
                        <div className="relative">
                            <button
                                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${isDesktopMenuOpen
                                    ? 'bg-deep-blue-900 text-white border-deep-blue-900'
                                    : 'bg-white text-deep-blue-900 border-steel-200 hover:border-deep-blue-900'}`}
                            >
                                <span className="font-medium text-sm">Menu</span>
                                <div className={`flex flex-col gap-1 transition-transform ${isDesktopMenuOpen ? 'rotate-180' : ''}`}>
                                    <span className={`w-4 h-0.5 rounded-full transition-all ${isDesktopMenuOpen ? 'bg-white rotate-45 translate-y-1.5' : 'bg-current'}`}></span>
                                    <span className={`w-4 h-0.5 rounded-full transition-all ${isDesktopMenuOpen ? 'opacity-0' : 'bg-current'}`}></span>
                                    <span className={`w-4 h-0.5 rounded-full transition-all ${isDesktopMenuOpen ? 'bg-white -rotate-45 -translate-y-1.5' : 'bg-current'}`}></span>
                                </div>
                            </button>

                            {/* Desktop Menu Dropdown */}
                            <AnimatePresence>
                                {isDesktopMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-12 right-0 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 overflow-hidden"
                                    >
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="show"
                                            exit="exit"
                                            className="flex flex-col gap-1"
                                        >
                                            {navigation.map((item) => (
                                                <motion.a
                                                    key={item.name}
                                                    href={item.href}
                                                    variants={itemVariants}
                                                    onClick={(e) => handleNavigation(e, item.href)}
                                                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors cursor-pointer border ${pathname === item.href
                                                        ? 'bg-aqua-50 text-aqua-700 border-aqua-100'
                                                        : 'text-black border-steel-100 hover:bg-steel-50 hover:text-deep-blue-900'
                                                        }`}
                                                >
                                                    {item.name}
                                                </motion.a>
                                            ))}

                                            {user ? (
                                                <>
                                                    <motion.a
                                                        href="/dashboard"
                                                        variants={itemVariants}
                                                        onClick={(e) => handleNavigation(e, '/dashboard')}
                                                        className="block px-4 py-3 rounded-xl text-base font-medium text-steel-600 hover:bg-steel-50 hover:text-deep-blue-900 cursor-pointer"
                                                    >
                                                        Dashboard
                                                    </motion.a>
                                                    {profile?.role === 'admin' && (
                                                        <motion.a
                                                            href="/admin"
                                                            variants={itemVariants}
                                                            onClick={(e) => handleNavigation(e, '/admin')}
                                                            className="block px-4 py-3 rounded-xl text-sm font-medium text-purple-600 hover:bg-purple-50 cursor-pointer"
                                                        >
                                                            Admin Panel
                                                        </motion.a>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-px bg-gray-100 my-1"></div>
                                                    <motion.a
                                                        href="/login"
                                                        variants={itemVariants}
                                                        onClick={(e) => handleNavigation(e, '/login')}
                                                        className="block px-4 py-3 rounded-xl text-sm font-medium text-aqua-600 hover:bg-aqua-50 cursor-pointer"
                                                    >
                                                        Login / Signup
                                                    </motion.a>
                                                </>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Mobile Menu & Login Actions */}
                    <div className="flex items-center gap-2 lg:hidden ml-auto">


                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-1.5 rounded-full transition-all ${isScrolled
                                ? 'bg-steel-100 text-deep-blue-800 hover:bg-steel-200'
                                : 'bg-white/20 text-deep-blue-900 hover:bg-white/30 backdrop-blur-md'
                                }`}
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 bg-black/20 z-[-1]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="lg:hidden absolute top-[calc(100%+0.5rem)] left-3 right-3 bg-white shadow-2xl rounded-2xl border border-steel-100 overflow-hidden"
                            >
                                <nav className="p-2">
                                    {/* Navigation Links - Compact Grid */}
                                    <motion.div
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-2 gap-1"
                                    >
                                        {navigation.map((item) => (
                                            <motion.a
                                                key={item.name}
                                                href={item.href}
                                                variants={itemVariants}
                                                onClick={(e) => handleNavigation(e, item.href)}
                                                className={`flex items-center justify-center px-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${pathname === item.href
                                                    ? 'bg-aqua-50 text-aqua-600 border-aqua-100 shadow-sm'
                                                    : 'text-black border-steel-100 hover:bg-steel-50 hover:text-deep-blue-900'
                                                    }`}
                                            >
                                                {item.name}
                                            </motion.a>
                                        ))}
                                        {profile?.role === 'admin' && (
                                            <motion.a
                                                href="/admin"
                                                variants={itemVariants}
                                                onClick={(e) => handleNavigation(e, '/admin')}
                                                className="flex items-center justify-center px-1 py-2 rounded-lg text-sm font-semibold text-purple-600 bg-purple-50 border border-purple-100 shadow-sm cursor-pointer col-span-2"
                                            >
                                                Admin Panel
                                            </motion.a>
                                        )}
                                    </motion.div>


                                    {/* Auth Actions in Menu */}
                                    <div className="mt-1 pt-1 border-t border-steel-50 grid grid-cols-2 gap-1">
                                        {user ? (
                                            <>
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center justify-center px-2 py-2 rounded-lg text-sm font-semibold text-aqua-600 bg-aqua-50 hover:bg-aqua-100 transition-colors"
                                                >
                                                    Dashboard
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                    className="flex items-center justify-center px-2 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    Logout
                                                </button>
                                            </>
                                        ) : (
                                            <Link
                                                href="/login"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="col-span-2 flex items-center justify-center py-2 text-sm font-black text-aqua-600 hover:text-aqua-700 transition-colors uppercase tracking-widest"
                                            >
                                                Login / Signup
                                            </Link>
                                        )}
                                    </div>

                                    {/* CTA */}
                                    {profile?.role !== 'admin' && (
                                        <div className="mt-1 pt-1 border-t border-steel-50">
                                            <Link
                                                href="/#contact"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center justify-center w-full py-3 rounded-xl text-base font-bold text-black bg-[#4ED7F1] hover:bg-[#38C8E8] shadow-sm transition-colors border border-[#4ED7F1]"
                                            >
                                                Request Bulk Quote
                                            </Link>
                                        </div>
                                    )}
                                </nav>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div >

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={logout}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmText="Sign Out"
                isDestructive={true}
            />
        </header >
    );
}
