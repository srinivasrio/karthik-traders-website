"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FloatingCart from "@/components/layout/FloatingCart";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isCompareRoute = pathname === '/compare';

    // Admin routes get a clean layout without site chrome
    if (isAdminRoute) {
        return <>{children}</>;
    }

    // Regular pages render immediately with Header, Footer, and page content without blocking on Auth initialization
    return (
        <>
            <Header />
            <main className={`min-h-screen ${isCompareRoute ? 'pb-0' : 'pb-16 md:pb-0'}`}>
                {children}
            </main>
            {!isCompareRoute && <Footer />}
            {!isCompareRoute && <MobileBottomNav />}
            {!isCompareRoute && <FloatingCart />}
        </>
    );
}
