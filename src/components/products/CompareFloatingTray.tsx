'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CompareFloatingTray() {
  const [compareCount, setCompareCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenu = (e: any) => {
      if (e?.detail?.open !== undefined) {
        setMenuOpen(e.detail.open);
      }
    };
    window.addEventListener('kt-menu-state', handleMenu);
    return () => window.removeEventListener('kt-menu-state', handleMenu);
  }, []);

  const updateCount = () => {
    try {
      const stored = localStorage.getItem('kt_compare');
      if (stored) {
        const list = JSON.parse(stored);
        setCompareCount(Array.isArray(list) ? list.length : 0);
      } else {
        setCompareCount(0);
      }
    } catch {
      setCompareCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('kt-store', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('kt-store', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  if (menuOpen || compareCount === 0) return null;

  return (
    <Link
      href="/compare"
      aria-label={`${compareCount} products in comparison. Compare models`}
      className="fixed left-4 bottom-24 md:left-8 md:bottom-6 z-40 h-12.5 px-6 rounded-full bg-gradient-to-r from-[#C5BAFF] to-[#C4D9FF] text-[#0B1A33] inline-flex items-center gap-3 font-extrabold text-sm sm:text-base shadow-xl shadow-[#4338CA]/25 hover:brightness-105 transition-all animate-[ktPop_0.35s_cubic-bezier(.3,1.5,.5,1)]"
    >
      <span className="font-poppins">Compare</span>
      <span className="min-w-7 h-7 px-2 rounded-full bg-[#0B1A33] text-white inline-grid place-items-center text-xs font-mono font-extrabold">
        {compareCount}
      </span>
    </Link>
  );
}
