'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reviews } from '@/data/reviews';

export default function ReviewsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    useEffect(() => {
        timeoutRef.current = setTimeout(nextSlide, 5000);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex]);

    return (
        <section id="reviews" className="py-16 bg-white overflow-hidden">
            <div className="container-custom px-4">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex justify-center mb-4"
                    >
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200 shadow-sm">
                            ⭐ Google Reviews
                        </span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl md:text-3xl font-bold text-deep-blue-900"
                    >
                        What Our Customers Say
                    </motion.h2>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Main Slider */}
                    <div className="relative py-10 min-h-[400px]">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 50, position: 'absolute' }}
                                animate={{ opacity: 1, x: 0, position: 'relative' }}
                                exit={{ opacity: 0, x: -50, position: 'absolute' }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="bg-gradient-to-br from-white to-cyan-50 rounded-2xl p-8 md:p-10 border border-cyan-100 shadow-[0_10px_40px_rgba(6,182,212,0.15)] mx-4 md:mx-12 cursor-grab active:cursor-grabbing w-full left-0 right-0 top-0"
                            >
                                {/* Quote Icon */}
                                <div className="absolute top-6 right-8 text-6xl text-cyan-200 serif font-bold opacity-30">
                                    &rdquo;
                                </div>

                                <a
                                    href={reviews[currentIndex].sourceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left h-full"
                                >
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        {reviews[currentIndex].image ? (
                                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white">
                                                <img
                                                    src={reviews[currentIndex].image}
                                                    alt={reviews[currentIndex].name}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {reviews[currentIndex].name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 z-10 w-full">
                                        {/* Stars */}
                                        <div className="flex justify-center md:justify-start gap-1 mb-3 text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-5 h-5 ${i < reviews[currentIndex].rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>

                                        {/* Review Text */}
                                        <p className="text-deep-blue-900 text-lg md:text-xl font-medium leading-relaxed mb-4 group-hover:text-deep-blue-700 transition-colors">
                                            "{reviews[currentIndex].text}"
                                        </p>

                                        {/* Author */}
                                        <div>
                                            <h4 className="font-bold text-deep-blue-900 flex items-center justify-center md:justify-start gap-2">
                                                {reviews[currentIndex].name}
                                                <svg className="w-4 h-4 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </h4>
                                            <p className="text-xs text-steel-500">Verified Customer</p>
                                        </div>
                                    </div>
                                </a>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white border border-steel-100 shadow-md text-deep-blue-900 hover:bg-steel-50 transition-colors z-20 hidden md:block"
                            aria-label="Previous review"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white border border-steel-100 shadow-md text-deep-blue-900 hover:bg-steel-50 transition-colors z-20 hidden md:block" // Hidden on mobile for swipe focus
                            aria-label="Next review"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-4">
                        {reviews.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-deep-blue-900 w-8' : 'bg-steel-200 hover:bg-steel-300'}`}
                                aria-label={`Go to review ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
