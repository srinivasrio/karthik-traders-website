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
    const { loading } = useAuth();

    // Show loading screen while auth is initializing
    if (loading) {
        return <SimpleLoadingScreen />;
    }

    // Admin routes get a clean layout without site chrome
    if (isAdminRoute) {
        return <>{children}</>;
    }

    // Regular pages get the full site layout
    return (
        <>
            <Header />
            <main className="min-h-screen pb-16 md:pb-0">
                {children}
            </main>
            <Footer />
            <MobileBottomNav />
            <FloatingCart />
        </>
    );
}
