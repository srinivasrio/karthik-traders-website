'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BrandInfo {
  title: string;
  tier: string;
  bg: string;
  fg: string;
  href: string;
  blocks: { k: string; v: string }[];
}

const BRAND_DATA: Record<'aqualion' | 'seaboss', BrandInfo> = {
  aqualion: {
    title: 'Aqualion',
    tier: 'PREMIUM QUALITY',
    bg: '#FFF1D6',
    fg: '#8A4B00',
    href: '/aerator-sets?brand=aqualion',
    blocks: [
      {
        k: 'MANUFACTURING SPECS',
        v: 'Equipped with 100% copper-wound ISO certified motors, precision Bevel A3 gearboxes, SS 304 CR frames, and Virgin HDPE UV-stabilized floats for extreme pond longevity.',
      },
      {
        k: '1 YEAR WARRANTY',
        v: 'All Aqualion aerators carry a comprehensive 1 Year Warranty covering manufacturing defects on motor and gearbox.',
      },
      {
        k: 'COMPLETE PACKAGING',
        v: 'Complete sets ship factory-inspected with waterproof dom motor cover, SS fan rods, installation kit box, and synthetic EP 140 gear oil.',
      },
      {
        k: 'TESTED FOR AP & TS PONDS',
        v: 'Designed specifically for high-salinity aquaculture ponds across Andhra Pradesh, Tamil Nadu, and Gujarat shrimp belts.',
      },
    ],
  },
  seaboss: {
    title: 'Sea Boss',
    tier: 'BUDGET + HIGH PERFORMANCE',
    bg: '#DDF3FF',
    fg: '#0B5C86',
    href: '/aerator-sets?brand=seaboss',
    blocks: [
      {
        k: 'POWERFUL AERATION',
        v: 'Delivers high DO (Dissolved Oxygen) transfer rates with high-torque motors engineered for 24/7 continuous duty cycles in high stocking density shrimp ponds.',
      },
      {
        k: 'MODELS & CAPACITIES',
        v: 'Available in 2HP 4-Paddle and 3HP 6-Paddle configurations with heavy-duty cast iron or ductile gearboxes.',
      },
      {
        k: '1 YEAR REPLACEMENT WARRANTY',
        v: 'Complete peace of mind with 1 full year replacement warranty on core mechanicals and electrical components.',
      },
      {
        k: 'GENUINE SPARES GUARANTEE',
        v: 'Every spare part—floats, fans, rods, doms, bush stands—is stocked in our Nellore warehouse with same-day dispatch.',
      },
    ],
  },
};

export default function BrandsSection() {
  const [activeBrand, setActiveBrand] = useState<'aqualion' | 'seaboss' | null>(null);

  const bm = activeBrand ? BRAND_DATA[activeBrand] : null;

  return (
    <section id="brands" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24 scroll-mt-24">
      <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase mb-4">
        OUR BRANDS
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Aqualion Card */}
        <div className="relative rounded-[32px] bg-[#FFF4E3] border border-[#FFDFB0] p-6 sm:p-9 flex flex-col gap-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#FFE3B8]/60 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-3 min-w-0">
              <div className="h-20 sm:h-24 md:h-28 flex items-center">
                <img
                  src="/images/logos/aqualion-logo.svg"
                  alt="Aqualion"
                  className="h-full w-auto max-w-[220px] object-contain object-left"
                />
              </div>
              <span className="px-3.5 py-1 rounded-full bg-white text-[#8A4B00] text-xs font-black shadow-xs tracking-wider border border-[#FFDFB0]">
                PREMIUM
              </span>
            </div>
            <img
              src="/assets/hero-aerator-card-t.png"
              alt="Aqualion Aerator"
              className="relative w-40 sm:w-48 h-auto object-contain shrink-0 -mr-2 -mt-2 drop-shadow-md"
            />
          </div>

          <h3 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1A33] font-poppins">
            Aqualion Premium
          </h3>

          <div className="relative flex flex-wrap gap-2 text-xs sm:text-sm font-bold text-[#0B1A33]">
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#E3E8F0] shadow-2xs">
              ISO certified motor
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#E3E8F0] shadow-2xs">
              SS 304 CR frame
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#E3E8F0] shadow-2xs text-emerald-700 font-semibold">
              ★ 1 Year Warranty
            </span>
          </div>

          <div className="relative flex flex-wrap gap-3 mt-auto pt-2">
            <Link
              href="/aerator-sets?brand=aqualion"
              className="h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] inline-flex items-center font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
            >
              Shop Aqualion →
            </Link>
            <button
              type="button"
              onClick={() => setActiveBrand('aqualion')}
              className="h-11 px-5 rounded-full bg-transparent border border-[#D5DCE8] text-[#0B1A33] font-bold text-sm hover:bg-[#FFF1D6] transition-colors cursor-pointer"
            >
              Brand info
            </button>
          </div>
        </div>

        {/* Sea Boss Card */}
        <div className="relative rounded-[32px] bg-[#E8F9FF] border border-[#C4D9FF] p-6 sm:p-9 flex flex-col gap-5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#C4D9FF]/50 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-3 min-w-0">
              <div className="h-20 sm:h-24 md:h-28 flex items-center">
                <img
                  src="/images/logos/seaboss-logo.svg"
                  alt="Sea Boss"
                  className="h-full w-auto max-w-[220px] object-contain object-left"
                />
              </div>
              <span className="px-3.5 py-1 rounded-full bg-white text-[#0B5C86] text-xs font-black shadow-xs tracking-wider border border-[#C4D9FF]">
                HIGH PERFORMANCE
              </span>
            </div>
            <img
              src="/assets/hero-aerator-card-t.png"
              alt="Sea Boss Aerator"
              className="relative w-40 sm:w-48 h-auto object-contain shrink-0 -mr-2 -mt-2 drop-shadow-md"
            />
          </div>

          <h3 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1A33] font-poppins">
            Sea Boss
          </h3>

          <div className="relative flex flex-wrap gap-2 text-xs sm:text-sm font-bold text-[#0B1A33]">
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#C4D9FF] shadow-2xs">
              2HP 4-Paddle
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#C4D9FF] shadow-2xs">
              3HP 6-Paddle
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-[#C4D9FF] shadow-2xs text-[#0B5C86]">
              1 Year Replacement
            </span>
          </div>

          <div className="relative flex flex-wrap gap-3 mt-auto pt-2">
            <Link
              href="/aerator-sets?brand=seaboss"
              className="h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] inline-flex items-center font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
            >
              Shop Sea Boss →
            </Link>
            <button
              type="button"
              onClick={() => setActiveBrand('seaboss')}
              className="h-11 px-5 rounded-full bg-transparent border border-[#9FBFE8] text-[#0B1A33] font-bold text-sm hover:bg-white transition-colors cursor-pointer"
            >
              Brand info
            </button>
          </div>
        </div>
      </div>

      {/* Brand Info Modal */}
      {bm && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1A33]/50 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setActiveBrand(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FBFBFB] rounded-[28px] shadow-2xl border border-white animate-[ktUp_0.35s_both]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="p-6 sm:p-7 flex justify-between items-start gap-4 rounded-t-[28px]"
              style={{ backgroundColor: bm.bg }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 shadow-sm border border-white flex items-center justify-center p-2 shrink-0">
                  <img
                    src={activeBrand === 'aqualion' ? '/images/logos/aqualion-logo.svg' : '/images/logos/seaboss-logo.svg'}
                    alt={bm.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span
                    className="text-xs font-extrabold tracking-widest uppercase block mb-1"
                    style={{ color: bm.fg }}
                  >
                    {bm.tier}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] tracking-tight font-poppins">
                    {bm.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveBrand(null)}
                aria-label="Close"
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#0B1A33] flex items-center justify-center font-bold text-lg shadow-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 flex flex-col gap-5">
              {bm.blocks.map((b) => (
                <div key={b.k} className="flex flex-col gap-1.5">
                  <span className="text-xs font-extrabold tracking-wider text-[#5B6880] uppercase">
                    {b.k}
                  </span>
                  <p className="text-sm sm:text-base leading-relaxed text-[#0B1A33] font-medium">
                    {b.v}
                  </p>
                </div>
              ))}

              <div className="pt-2">
                <Link
                  href={bm.href}
                  onClick={() => setActiveBrand(null)}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
                >
                  Shop {bm.title} Sets →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
