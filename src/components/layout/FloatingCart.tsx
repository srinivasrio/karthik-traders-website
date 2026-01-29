'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { useCart } from '@/context/CartContext';

export default function FloatingCart() {
    const { cartCount } = useCart();
    const controls = useAnimation();

    // Micro-bounce effect when count changes
    useEffect(() => {
        if (cartCount > 0) {
            controls.start({
                scale: [1, 1.2, 1],
                transition: { duration: 0.3 }
            });
        }
    }, [cartCount, controls]);

    if (cartCount === 0) return null;

    return (
        <AnimatePresence>
            <Link href="/cart">
                <motion.button
                    key="cart-button"
                    layoutId="cart-container"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    className="fixed z-[9999] flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-aqua-400 to-aqua-500 shadow-[0_4px_20px_rgba(0,180,216,0.4)] text-white overflow-visible"
                    style={{
                        bottom: '76px',
                        right: '16px',
                        pointerEvents: 'auto',
                        touchAction: 'manipulation'
                    }}
                    whileTap={{ scale: 0.9 }}
                >
                    {/* Ring Pulse Animation */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-white/40"
                        animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    />

                    <svg className="w-6 h-6 drop-shadow-md relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>

                    {/* Badge with micro-bounce */}
                    <motion.span
                        animate={controls}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20"
                    >
                        {cartCount}
                    </motion.span>
                </motion.button>
            </Link>
        </AnimatePresence>
    );
}
