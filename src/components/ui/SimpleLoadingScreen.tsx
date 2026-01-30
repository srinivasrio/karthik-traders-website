'use client';

export default function SimpleLoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm transition-opacity duration-300">
            {/* Logo with Pulse Animation */}
            <div className="mb-8 animate-pulse">
                <img
                    src="/images/logo.png"
                    alt="Karthik Traders"
                    className="h-24 md:h-32 w-auto object-contain"
                />
            </div>

            {/* Loading Text with Dots */}
            <div className="flex items-center gap-1">
                <span className="text-xl md:text-2xl font-bold text-deep-blue-900 tracking-wider">
                    Loading
                </span>
                <div className="flex gap-1 mt-2.5 ml-1">
                    <div className="w-2 h-2 bg-aqua-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-aqua-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-aqua-600 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}
