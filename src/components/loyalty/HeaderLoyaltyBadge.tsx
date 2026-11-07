'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLoyalty } from '@/context/LoyaltyContext';

interface HeaderLoyaltyBadgeProps {
  variant?: 'header' | 'admin' | 'menu';
  className?: string;
  showRupeeOnDesktop?: boolean;
}

export default function HeaderLoyaltyBadge({
  variant = 'header',
  className = '',
  showRupeeOnDesktop = true,
}: HeaderLoyaltyBadgeProps) {
  const { user } = useAuth();
  const { points, rupeeValue, loading } = useLoyalty();
  const [showTooltip, setShowTooltip] = useState(false);

  // If not logged in, do not render points badge
  if (!user) {
    return null;
  }

  const destinationHref = variant === 'admin' ? '/admin/loyalty' : '/dashboard?tab=loyalty';

  // Format currency
  const formattedRupee = `₹${rupeeValue.toFixed(2)}`;

  if (variant === 'menu') {
    return (
      <Link
        href={destinationHref}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-amber-500/15 via-amber-400/20 to-yellow-500/15 border border-amber-300/80 text-amber-900 font-extrabold text-xs shadow-2xs hover:bg-amber-100 hover:border-amber-400 transition-all active:scale-95 ${className}`}
      >
        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-amber-950 text-[10px] shadow-2xs">
          🪙
        </span>
        <span className="font-mono">{points.toLocaleString()}</span>
        <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">pts</span>
        <span className="text-[10px] text-amber-700/80 font-medium">({formattedRupee})</span>
      </Link>
    );
  }

  if (variant === 'admin') {
    return (
      <div className="relative inline-flex items-center">
        <Link
          href="/admin/loyalty"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`group inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-xs hover:bg-amber-100 hover:border-amber-300 transition-all shadow-2xs cursor-pointer ${className}`}
          title="Loyalty Points Management"
        >
          <span className="flex items-center justify-center text-xs">
            🪙
          </span>
          <span className="font-mono text-[11px] font-black text-amber-900">
            {points.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-700 font-bold hidden sm:inline">pts</span>
        </Link>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full mt-1.5 right-0 z-50 w-48 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] animate-in fade-in zoom-in-95 pointer-events-none">
            <div className="font-bold flex items-center justify-between text-amber-300">
              <span>Loyalty Points</span>
              <span>{points} pts</span>
            </div>
            <div className="text-slate-300 text-[10px] mt-0.5">
              Approx. Value: <strong className="text-white">{formattedRupee}</strong>
            </div>
            <div className="text-[9px] text-slate-400 mt-1 border-t border-slate-800 pt-1">
              Click to open Loyalty Manager
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default 'header' variant for Public / Customer Header
  return (
    <div className="relative inline-flex items-center">
      <Link
        href={destinationHref}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group inline-flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2 sm:px-3 rounded-full bg-linear-to-r from-amber-50 via-amber-100/70 to-yellow-50 border border-amber-300/90 hover:border-amber-400 hover:bg-amber-100/80 text-amber-950 font-extrabold text-xs shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer flex-none ${className}`}
        aria-label={`${points} loyalty points worth ${formattedRupee}`}
      >
        {/* Animated Gold Coin Icon */}
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-linear-to-b from-amber-300 to-amber-500 text-amber-950 shadow-2xs group-hover:scale-110 transition-transform flex-none">
          <svg
            className="w-3.5 h-3.5 text-amber-950"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="7" fill="#FBBF24" />
            <path
              d="M12 7v10M9 9.5c0-.83.67-1.5 1.5-1.5h3c.83 0 1.5.67 1.5 1.5 0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5.67-1.5 1.5 0 .83.67 1.5 1.5 1.5h3c.83 0 1.5-.67 1.5-1.5"
              stroke="#78350F"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </span>

        {/* Points Counter */}
        <span className="font-mono font-extrabold text-xs sm:text-sm text-amber-950 tracking-tight">
          {points.toLocaleString()}
        </span>

        {/* "pts" label (hidden on tiny screens < 360px, visible on all normal views) */}
        <span className="hidden min-[360px]:inline text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">
          pts
        </span>

        {/* Desktop Rupee Value Pill */}
        {showRupeeOnDesktop && (
          <span className="hidden md:inline-flex text-[11px] font-semibold text-amber-800/90 pl-1 border-l border-amber-300/80">
            {formattedRupee}
          </span>
        )}
      </Link>

      {/* Floating Hover Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-52 p-3 bg-[#0B1A33] text-white rounded-2xl shadow-xl border border-slate-700/50 text-xs animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <span>🪙</span> Loyalty Points
            </span>
            <span className="font-mono font-extrabold text-amber-300">
              {points.toLocaleString()} pts
            </span>
          </div>
          <div className="pt-1.5 flex justify-between items-center text-[11px]">
            <span className="text-slate-300">Discount Value:</span>
            <span className="font-extrabold text-emerald-400">{formattedRupee}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Redeem points at checkout or click to view history in your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}

