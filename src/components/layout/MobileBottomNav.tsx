'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const mobileNavItems = [
    {
        name: 'Home',
        href: '/',
        iconSrc: '/icons/menu/home.png',
    },
    {
        name: 'Aerators',
        href: '/aerator-sets',
        iconSrc: '/icons/menu/aerators.png',
    },
    {
        name: 'Products',
        href: '/products',
        iconSrc: '/icons/menu/spares.png',
    },
    {
        name: 'Spares',
        href: '/spares',
        iconSrc: '/icons/menu/products.png',
    },
    {
        name: 'Long Arm',
        href: '/long-arm',
        iconSrc: '/icons/menu/long-arm.png',
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(href);
    };

    const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (pathname === '/') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 w-full z-[100] bg-white/95 backdrop-blur-md border-t border-aqua-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
            style={{ bottom: '0px' }}
        >
            <div className="flex items-center justify-around h-16">
                {mobileNavItems.map((item) => {
                    const active = isActive(item.href);
                    const isHome = item.href === '/';

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={isHome ? handleHomeClick : undefined}
                            className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] relative transition-colors duration-300 ${active ? 'text-aqua-600' : 'text-steel-400'
                                }`}
                        >
                            {/* Traveling Active Background - iOS Liquid Style */}
                            {active && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-1 bg-aqua-200 rounded-2xl -z-10 shadow-[0_0_15px_rgba(78,215,241,0.4)] border border-aqua-300/30"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            {/* Icon with Liquid Glass Animation */}
                            <motion.div
                                whileTap={{ scale: 0.85, rotate: -3 }}
                                animate={{
                                    y: active ? -2 : 0,
                                    scale: active ? 1.05 : 1,
                                    filter: active ? 'drop-shadow(0 2px 4px rgba(78, 215, 241, 0.3))' : 'none'
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-all duration-300`}
                            >
                                <div className="relative w-6 h-6">
                                    <Image
                                        src={item.iconSrc}
                                        alt={item.name}
                                        fill
                                        className={`object-contain transition-all duration-300 ${active ? 'brightness-110 saturate-100' : 'grayscale brightness-90 opacity-60'}`}
                                    />
                                </div>
                                <span className={`text-[10px] font-extrabold tracking-wide transition-colors duration-300 ${active ? 'text-deep-blue-800' : 'text-steel-400'}`}>
                                    {item.name}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
