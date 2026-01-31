'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import { supabase } from '@/lib/supabase';


export default function ContactPage() {
    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Spacer to account for fixed header */}
            <div className="h-16 md:h-20" />

            <MobileGestureLayout>
                <div className="container-custom py-6">
                    {/* Back Button */}
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-aqua-600 hover:text-aqua-800 mb-6 font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    {/* Contact Form & Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-3xl font-bold text-deep-blue-900 mb-2"
                            >
                                Contact Us
                            </motion.h1>
                            <p className="text-steel-600 text-base mb-6">
                                Looking for bulk quantities or have a specific requirement? We're here to help. Reach out to us directly via phone or visit our location.
                            </p>
                        </div>

                        {/* Contact Details Cards */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Phone Numbers */}
                            <div className="bg-white p-5 rounded-xl border border-steel-100 shadow-sm">
                                <h3 className="text-lg font-bold text-deep-blue-900 mb-3 flex items-center gap-2">
                                    <span>📞</span> Phone
                                </h3>
                                <div className="space-y-3">
                                    <a href="tel:+919963840058" className="flex items-center justify-between p-3 rounded-lg bg-steel-50 hover:bg-aqua-50 transition-colors group">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-steel-500 font-medium">Karthik</span>
                                            <span className="text-deep-blue-900 font-bold font-mono">+91 99638 40058</span>
                                        </div>
                                        <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </span>
                                    </a>
                                    <a href="tel:+919177657576" className="flex items-center justify-between p-3 rounded-lg bg-steel-50 hover:bg-aqua-50 transition-colors group">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-steel-500 font-medium">Hazarathaiah</span>
                                            <span className="text-deep-blue-900 font-bold font-mono">+91 91776 57576</span>
                                        </div>
                                        <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </span>
                                    </a>
                                </div>
                            </div>

                            {/* Social & Address */}
                            <div className="bg-white p-5 rounded-xl border border-steel-100 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-deep-blue-900 mb-4 flex items-center gap-2">
                                        Connect
                                    </h3>
                                    <div className="flex gap-4 mb-8">
                                        <a
                                            href="https://www.instagram.com/karthik_traders_01?igsh=MXIxOWh4MGIzNnhlZg=="
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-pink-500/20 group"
                                            title="Instagram"
                                        >
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                            </svg>
                                        </a>
                                        <a
                                            href="https://www.facebook.com/share/1E2YvYdWZZ/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 rounded-xl bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20 group"
                                            title="Facebook"
                                        >
                                            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-deep-blue-900 mb-1">Address</h3>
                                    <p className="text-sm text-steel-600 leading-relaxed">
                                        Opp. Madhura Sweets Line, Near MRF Tyres Line,<br />
                                        Subedar Pet,<br />
                                        Nellore, Andhra Pradesh 524001
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Google Map Section */}
                    <div className="bg-white rounded-xl border border-steel-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-steel-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-deep-blue-900 flex items-center gap-2">
                                <span>📍</span> Our Location
                            </h2>
                            <a
                                href="https://share.google/KMiK7tY8aneqBFtPU"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-aqua-600 hover:underline flex items-center gap-1"
                            >
                                Open in Maps
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>

                        <div className="relative w-full h-[300px] md:h-[400px] bg-steel-50">
                            <iframe
                                src="https://maps.google.com/maps?q=Karthik+Traders+Aquaculture+Nellore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                title="Karthik Traders Location"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="absolute inset-0 w-full h-full"
                            ></iframe>
                        </div>

                        <div className="p-3 bg-aqua-50/50 text-center">
                            <p className="text-xs text-deep-blue-800 font-medium">
                                Visit our location or find directions using Google Maps.
                            </p>
                        </div>
                    </div>
                </div>
            </MobileGestureLayout>
        </div>
    );
}
