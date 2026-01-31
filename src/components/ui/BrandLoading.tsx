'use client';

import React from 'react';

interface BrandLoadingProps {
    message?: string;
}

export default function BrandLoading({ message = "Updating Latest Prices..." }: BrandLoadingProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md">
            {/* Animated Ring Container */}
            <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                {/* Background Ring */}
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full opacity-30"></div>

                {/* Spinning Gradient Ring */}
                <div className="absolute inset-0 border-4 border-transparent border-t-aqua-500 border-r-aqua-400 rounded-full animate-spin"></div>

                {/* Logo in Center */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <img
                        src="/images/logo.png"
                        alt="Karthik Traders"
                        className="w-full h-full object-contain animate-pulse duration-[2000ms]"
                    />
                </div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-center space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                    {message}
                </h2>
                <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-aqua-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-aqua-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-aqua-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}
