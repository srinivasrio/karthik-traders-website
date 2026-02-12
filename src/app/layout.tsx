import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

import ScrollToTop from "@/components/ui/ScrollToTop";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Karthik Traders | Premium Aquaculture Equipment - Aqualion & Sea Boss",
  description: "India's trusted supplier of paddle wheel aerators, motors, gearboxes, and spares for shrimp & fish farms. Shop Aqualion premium and Sea Boss budget-friendly aquaculture equipment.",
  keywords: "paddle wheel aerator, aquaculture equipment, shrimp farming, fish farming, aerator motor, gearbox, HDPE float, India",
  authors: [{ name: "Karthik Traders" }],
  creator: "Karthik Traders",
  publisher: "Karthik Traders",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Karthik Traders | Premium Aquaculture Equipment",
    description: "Shop paddle wheel aerators, motors, gearboxes, and spares for shrimp & fish farms.",
    url: "https://karthiktraders.com",
    siteName: "Karthik Traders",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karthik Traders | Premium Aquaculture Equipment",
    description: "Shop paddle wheel aerators, motors, gearboxes, and spares for shrimp & fish farms.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: '/favicon-v3.png',
    apple: '/favicon-v3.png',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`} suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
