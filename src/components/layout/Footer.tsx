'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const footerLinks = {
    products: [
        { name: 'Aerator Sets', href: '/aerator-sets' },
        { name: 'Motors', href: '/products' },
        { name: 'Gearboxes', href: '/products' },
        { name: 'Spares', href: '/spares' },
        { name: 'Long Arm Systems', href: '/long-arm' },
    ],
    brands: [
        { name: 'Aqualion Premium', href: '/aerator-sets?brand=aqualion' },
        { name: 'Sea Boss', href: '/aerator-sets?brand=seaboss' },
    ],
    support: [
        { name: 'Bulk Orders', href: '/#contact' },
        { name: 'Compare Products', href: '/compare' },
        { name: 'Dealer Enquiry', href: '/#contact' },
        { name: 'Warranty Info', href: '#' },
    ],
    contact: [
        { name: 'Karthik: 9963840058', href: 'tel:+919963840058' },
        { name: 'Hazarathaiah: 9177657576', href: 'tel:+919177657576' },
        // Map link handled conditionally in component
        { name: 'Instagram', href: 'https://www.instagram.com/karthik_traders_01?igsh=MXIxOWh4MGIzNnhlZg==' },
        { name: 'Facebook', href: 'https://www.facebook.com/share/1E2YvYdWZZ/' },
    ],
};

export default function Footer() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    return (
        <footer className="relative bg-[#C2E2FA] text-deep-blue-900 overflow-hidden">
            {/* Background Glow - Subtle Aqua/White */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

            {/* Wave Decoration - Liquid White to Light Blue */}
            <div className="relative h-16 bg-gradient-to-b from-white to-[#C2E2FA]">
                <svg
                    className="absolute bottom-0 left-0 right-0 w-full h-16 text-[#C2E2FA]"
                    viewBox="0 0 1440 64"
                    fill="currentColor"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0 32C240 64 480 0 720 32C960 64 1200 0 1440 32V64H0V32Z"
                    />
                </svg>
            </div>

            <div className="container-custom pt-12 pb-32 md:py-16 relative z-10">
                {/* Main Footer Content */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand Section */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src="/images/logo.png"
                                alt="Karthik Traders"
                                className="h-10 w-auto"
                            />
                            <div>
                                <h3 className="font-bold text-lg text-deep-blue-900">Karthik Traders</h3>
                                <p className="text-sm text-deep-blue-700">Aquaculture Aerators &amp; Spare Parts</p>
                            </div>
                        </div>
                        <p className="text-deep-blue-800/80 text-sm mb-6 max-w-xs leading-relaxed font-medium">
                            India&apos;s trusted supplier of premium aquaculture equipment.
                            Serving shrimp &amp; fish farms with quality aerators and spares.
                        </p>
                        {/* Brand Badges */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-amber-500/30 backdrop-blur-sm">
                                <img src="/images/logos/aqualion-logo.svg" alt="Aqualion" className="h-8 w-auto" />
                                <span className="text-amber-700 text-sm font-bold">Aqualion</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-aqua-600/30 backdrop-blur-sm">
                                <img src="/images/logos/seaboss-logo.svg" alt="Sea Boss" className="h-8 w-auto" />
                                <span className="text-deep-blue-700 text-sm font-bold">Sea Boss</span>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <h4 className="font-bold text-deep-blue-950 mb-4">Products</h4>
                        <ul className="space-y-2">
                            {footerLinks.products.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-deep-blue-800 hover:text-aqua-700 text-sm transition-colors block hover:translate-x-1 duration-300 font-medium"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Brands */}
                    <div>
                        <h4 className="font-bold text-deep-blue-950 mb-4">Our Brands</h4>
                        <ul className="space-y-2">
                            {footerLinks.brands.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-deep-blue-800 hover:text-aqua-700 text-sm transition-colors block hover:translate-x-1 duration-300 font-medium"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold text-deep-blue-950 mb-4">Support</h4>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-deep-blue-800 hover:text-aqua-700 text-sm transition-colors block hover:translate-x-1 duration-300 font-medium"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-bold text-deep-blue-950 mb-4">Contact</h4>
                        <ul className="space-y-2">
                            {footerLinks.contact.filter(link => link.name !== 'Instagram' && link.name !== 'Facebook').map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-deep-blue-800 hover:text-aqua-700 text-sm transition-colors block hover:translate-x-1 duration-300 font-medium"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        {/* Social Media Icons */}
                        <div className="flex items-center gap-4 mt-4">
                            {/* Instagram */}
                            <a
                                href="https://www.instagram.com/karthik_traders_01?igsh=MXIxOWh4MGIzNnhlZg=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group transition-transform hover:scale-110 duration-300"
                                aria-label="Instagram"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-8 h-8"
                                    fill="none"
                                >
                                    <defs>
                                        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#FFDC80" />
                                            <stop offset="25%" stopColor="#F77737" />
                                            <stop offset="50%" stopColor="#E1306C" />
                                            <stop offset="75%" stopColor="#C13584" />
                                            <stop offset="100%" stopColor="#833AB4" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient)" />
                                    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
                                    <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
                                </svg>
                            </a>
                            {/* Facebook */}
                            <a
                                href="https://www.facebook.com/share/1E2YvYdWZZ/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group transition-transform hover:scale-110 duration-300"
                                aria-label="Facebook"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-8 h-8"
                                    fill="#1877F2"
                                >
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-deep-blue-900/10">
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">
                            🛡️
                        </div>
                        <div>
                            <p className="text-sm font-bold text-deep-blue-900">1 Year Warranty</p>
                            <p className="text-xs text-deep-blue-700">On all aerator sets</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">
                            🔧
                        </div>
                        <div>
                            <p className="text-sm font-bold text-deep-blue-900">Genuine Spares</p>
                            <p className="text-xs text-deep-blue-700">Always available</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">
                            💎
                        </div>
                        <div>
                            <p className="text-sm font-bold text-deep-blue-900">Transparent Pricing</p>
                            <p className="text-xs text-deep-blue-700">No hidden costs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">
                            🚚
                        </div>
                        <div>
                            <p className="text-sm font-bold text-deep-blue-900">Pan India Delivery</p>
                            <p className="text-xs text-deep-blue-700">To your farm</p>
                        </div>
                    </div>
                </div>

                {/* Brand & Map Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-t border-deep-blue-900/10">
                    {/* About Us */}
                    <div className="lg:col-span-2">
                        <h4 className="font-bold text-deep-blue-950 mb-4">About Us</h4>
                        <p className="text-sm text-deep-blue-800/80 leading-relaxed mb-4">
                            Karthik Traders is a well-established and trusted name in the aquaculture industry, with over 10 years of experience. We supply high-quality aquaculture aerators and spare parts, serving fish and shrimp farmers with reliable solutions.
                        </p>
                        <Link href="/about-us" className="text-aqua-600 font-bold hover:text-aqua-700 text-sm inline-flex items-center group">
                            Read More
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    {/* Quick Link Pages */}
                    <div>
                        <h4 className="font-bold text-deep-blue-950 mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><Link href="/about-us" className="text-deep-blue-800 hover:text-aqua-700 text-sm">About Us</Link></li>
                            <li><Link href="/contact" className="text-deep-blue-800 hover:text-aqua-700 text-sm">Contact Us</Link></li>
                            <li><Link href="/refund-policy" className="text-deep-blue-800 hover:text-aqua-700 text-sm">Refund & Cancellation Policy</Link></li>
                            <li><Link href="/privacy-policy" className="text-deep-blue-800 hover:text-aqua-700 text-sm">Privacy Policy</Link></li>
                            <li><Link href="/terms-conditions" className="text-deep-blue-800 hover:text-aqua-700 text-sm">Terms & Conditions</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-deep-blue-900/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-deep-blue-700/80 text-sm text-center md:text-left font-medium">
                        © {new Date().getFullYear()} Karthik Traders. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2">
                        <Link href="/privacy-policy" className="text-deep-blue-700 hover:text-aqua-700 text-sm transition-colors font-medium">
                            Privacy Policy
                        </Link>
                        <Link href="/terms-conditions" className="text-deep-blue-700 hover:text-aqua-700 text-sm transition-colors font-medium">
                            Terms & Conditions
                        </Link>
                        <span className="hidden md:inline text-deep-blue-300">|</span>
                        <span className="text-deep-blue-700/80 text-sm font-medium">
                            Developed by{' '}
                            <a
                                href="https://www.iamsrinivas.tech"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-deep-blue-900 hover:text-aqua-700 transition-colors font-bold"
                            >
                                Srinivas Kumar
                            </a>
                        </span>
                    </div>
                </div>
            </div>
        </footer >
    );
}
