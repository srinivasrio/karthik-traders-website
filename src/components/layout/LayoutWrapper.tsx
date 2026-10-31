"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import FloatingCart from "@/components/layout/FloatingCart";
import { useAuth } from "@/context/AuthContext";
import SimpleLoadingScreen from "@/components/ui/SimpleLoadingScreen";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isCompareRoute = pathname === '/compare';
    const { loading } = useAuth();

    // Show loading screen while auth is initializing
    if (loading) {
        return <SimpleLoadingScreen />;
    }

    // Admin routes get a clean layout without site chrome
    if (isAdminRoute) {
        return <>{children}</>;
    }

    // Regular pages get the full site layout; compare page has standalone bottom actions and clean layout
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
