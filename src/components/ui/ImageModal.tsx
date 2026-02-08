'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
    isOpen: boolean;
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export default function ImageModal({ isOpen, images, initialIndex, onClose }: ImageModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [scale, setScale] = useState(1);

    // Reset index when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setScale(1);
        }
    }, [isOpen, initialIndex]);

    // Handle initial open scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setScale(1);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length <= 1) return;
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
        setScale(1);
    };

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setScale(prev => prev === 1 ? 2.5 : 1);
    };

    // Close on backdrop click unless zooming
    const handleBackdropClick = () => {
        if (scale === 1) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleBackdropClick}
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md"
                >
                    {/* Close Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[110] bg-white/10 hover:bg-white/20 rounded-full transition-all"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Navigation Buttons (Desktop/Large Screens) */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-[110] bg-white/10 hover:bg-white/20 rounded-full transition-all items-center justify-center"
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={nextImage}
                                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-[110] bg-white/10 hover:bg-white/20 rounded-full transition-all items-center justify-center"
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {/* Image Container */}
                    <div className="relative w-full h-full flex items-center justify-center p-0 md:p-4 overflow-hidden">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0.5, scale: 0.95 }}
                            animate={{ opacity: 1, scale: scale }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onClick={toggleZoom}
                            className={`relative w-full h-full max-w-7xl max-h-[90vh] transition-cursor ${scale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            // Drag logic for swipe on mobile if zoomed out
                            drag={scale === 1 && images.length > 1 ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = offset.x;
                                if (swipe < -50) nextImage();
                                else if (swipe > 50) prevImage();
                            }}
                        >
                            <Image
                                src={images[currentIndex]}
                                alt={`Zoomed Image ${currentIndex + 1}`}
                                fill
                                className="object-contain select-none pointer-events-none"
                                quality={100}
                                priority
                                sizes="100vw"
                            />
                        </motion.div>
                    </div>

                    {/* Bottom Controls / Indicator */}
                    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-[110] pointer-events-none">
                        {/* Dots Indicator */}
                        {images.length > 1 && (
                            <div className="flex gap-2 pointer-events-auto bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                {images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentIndex(idx);
                                            setScale(1);
                                        }}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                                    />
                                ))}
                            </div>
                        )}
                        <p className="text-white/60 text-xs font-medium tracking-wide uppercase">
                            {scale === 1 ? 'Tap/Click to Zoom' : 'Tap/Click to Reset'}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
