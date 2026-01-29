'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative min-h-[100svh] bg-gradient-to-b from-sky-100 via-sky-50 to-white overflow-hidden">
            {/* Hero Image Container - Mobile First */}
            <div className="relative w-full pt-16 md:pt-20">
                {/* Hero Image */}
                <div className="relative w-full aspect-[4/5] sm:aspect-[3/2] md:aspect-[16/9] max-h-[70vh]">
                    <Image
                        src="/images/hero-aerator.png"
                        alt="Paddle Wheel Aerator in Water - Sea Boss & Aqualion"
                        fill
                        priority
                        className="object-cover object-center"
                        sizes="100vw"
                    />
                    {/* Light gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>
            </div>

            {/* Content Overlay - Positioned at bottom on Mobile */}
            <div className="relative -mt-20 md:-mt-32 z-10">
                <div className="container-custom px-4 md:px-6">
                    <div
                        className={`max-w-lg mx-auto md:mx-0 text-center md:text-left transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                            }`}
                    >
                        {/* Tagline Badge - Liquid Glass */}
                        {/* Direct Call Buttons - Compact */}
                        {/* Direct Call Buttons - Prominent (Compact) */}
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-6 mt-6">
                            <a href="tel:+919963840058" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 hover:-translate-y-0.5">
                                <span className="text-base">📱</span>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Sales</span>
                                    <span className="text-sm font-bold">Karthik</span>
                                </div>
                            </a>
                            <a href="tel:+919177657576" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-600 text-white shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 hover:-translate-y-0.5">
                                <span className="text-base">📞</span>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Support</span>
                                    <span className="text-sm font-bold">Hazarathaiah</span>
                                </div>
                            </a>
                        </div>

                        {/* Main Heading */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-deep-blue-900 mb-4 leading-tight">
                            Premium and budget
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-aqua-500 to-aqua-600 animate-pulse-highlight">Aerator Solutions</span>
                        </h1>

                        {/* Subtext */}
                        <p className="text-deep-blue-800/80 text-sm md:text-base mb-8 max-w-md mx-auto md:mx-0 font-medium">
                            We provide complete paddle wheel aerators, motors, gearboxes & spares for shrimp and fish farms across India.
                        </p>

                        {/* Single Primary CTA (Mobile) or Two CTAs (Desktop) */}
                        <div className="flex flex-row items-center justify-center md:justify-start gap-3 w-full md:w-auto">
                            <Link
                                href="/aerator-sets"
                                className="flex-1 md:flex-none btn btn-primary btn-lg btn-ripple shadow-glow-aqua text-sm md:text-base px-2 md:px-6 justify-center"
                            >
                                Shop Aerator Sets
                            </Link>
                            <Link
                                href="/compare"
                                className="flex-1 md:flex-none btn btn-outline btn-lg bg-white/50 backdrop-blur-sm border-aqua-300 text-aqua-700 hover:bg-aqua-50 text-sm md:text-base px-2 md:px-6 justify-center"
                            >
                                Compare Models
                            </Link>
                        </div>

                        {/* Direct Call Buttons (Mobile Focused) - Side by Side */}

                    </div>
                </div>
            </div>

            {/* Brand Pills Removed as requested */}

            {/* Trust Indicators - Compact */}
            <div className="py-4 bg-white border-t border-steel-100">
                <div className="container-custom px-4">
                    <div className="flex items-center justify-center gap-6 md:gap-12 text-center">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🛡️</span>
                            <span className="text-xs md:text-sm text-steel-600 font-medium">1 Year Warranty</span>
                        </div>
                        <div className="w-px h-4 bg-steel-200"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔧</span>
                            <span className="text-xs md:text-sm text-steel-600 font-medium">Spares Available</span>
                        </div>
                        <div className="w-px h-4 bg-steel-200 hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-lg">🚚</span>
                            <span className="text-xs md:text-sm text-steel-600 font-medium">Pan India Delivery</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
