'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BenefitItem {
  num: number;
  title: string;
  detail: string;
}

interface BrandModalData {
  name: string;
  badge: string;
  heading: string;
  subtitle: string;
  logo: string;
  headerBg: string;
  headerBorder: string;
  accentColor: string;
  numBadgeBg: string;
  numBadgeText: string;
  href: string;
  benefits: BenefitItem[];
}

const BRAND_BENEFITS: Record<'aqualion' | 'seaboss', BrandModalData> = {
  aqualion: {
    name: 'Aqua Lion',
    badge: 'PREMIUM QUALITY',
    heading: 'Why Choose Aqua Lion?',
    subtitle: 'Best for maximum performance, long life & commercial shrimp farming',
    logo: '/images/logos/aqualion-logo.svg',
    headerBg: 'bg-gradient-to-br from-[#FFF7ED] via-[#FFEDD5] to-[#FFE4C4]',
    headerBorder: 'border-[#FFD7A8]',
    accentColor: '#8A4B00',
    numBadgeBg: 'bg-[#FEF3C7]',
    numBadgeText: 'text-[#92400E]',
    href: '/aerator-sets?brand=aqualion',
    benefits: [
      {
        num: 1,
        title: 'Higher Oxygen',
        detail: '3.5–4.0 kg O₂/hr.',
      },
      {
        num: 2,
        title: 'SS 304 Frame',
        detail: 'Superior corrosion resistance.',
      },
      {
        num: 3,
        title: 'Thick Frame',
        detail: 'Heavy-duty 3 mm construction.',
      },
      {
        num: 4,
        title: 'Heavy Floats',
        detail: '7 kg UV-stabilized HDPE.',
      },
      {
        num: 5,
        title: 'Low Amp Draw',
        detail: 'Energy-efficient 2HP motor.',
      },
      {
        num: 6,
        title: '24/7 Duty',
        detail: 'Designed for continuous operation.',
      },
      {
        num: 7,
        title: 'Wide Circulation',
        detail: '35–40 m effective range.',
      },
      {
        num: 8,
        title: 'Precision Gearbox',
        detail: 'Reduced operational wear.',
      },
      {
        num: 9,
        title: 'High-Density Ready',
        detail: 'Ideal for intensive farming.',
      },
      {
        num: 10,
        title: 'Long-Term Value',
        detail: 'Built for durability.',
      },
    ],
  },
  seaboss: {
    name: 'Sea Boss',
    badge: 'BUDGET + HIGH PERFORMANCE',
    heading: 'Why Choose Sea Boss?',
    subtitle: 'Best for budget, ROI & standard aquaculture ponds',
    logo: '/images/logos/seaboss-logo.svg',
    headerBg: 'bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-[#BAE6FD]/70',
    headerBorder: 'border-[#BAE6FD]',
    accentColor: '#0369A1',
    numBadgeBg: 'bg-[#E0F2FE]',
    numBadgeText: 'text-[#0369A1]',
    href: '/aerator-sets?brand=seaboss',
    benefits: [
      {
        num: 1,
        title: 'Budget-Friendly',
        detail: 'Starts at ₹23,999.',
      },
      {
        num: 2,
        title: 'Reliable Aeration',
        detail: '2.3–3.0 kg O₂/hr.',
      },
      {
        num: 3,
        title: 'Lower Investment',
        detail: 'Affordable upfront cost.',
      },
      {
        num: 4,
        title: 'Easy Handling',
        detail: 'Lighter frame and floats.',
      },
      {
        num: 5,
        title: 'SS 202 Frame',
        detail: 'Practical everyday performance.',
      },
      {
        num: 6,
        title: '6.5 kg Floats',
        detail: 'Reliable pond buoyancy.',
      },
      {
        num: 7,
        title: 'Gearbox Options',
        detail: 'A2 Worm or A3 Bevel.',
      },
      {
        num: 8,
        title: 'S1 Duty Motor',
        detail: 'Designed for continuous operation.',
      },
      {
        num: 9,
        title: 'IP55 Protection',
        detail: 'Added motor protection.',
      },
      {
        num: 10,
        title: 'Warranty Option',
        detail: '1-year extended replacement add-on.',
      },
    ],
  },
};

export default function BrandsSection() {
  const [activeBrand, setActiveBrand] = useState<'aqualion' | 'seaboss' | null>(null);

  // Manage body scroll and hide mobile bottom nav / cart while modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveBrand(null);
      }
    };

    if (activeBrand) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      // Dispatch event to hide mobile bottom nav & floating cart
      window.dispatchEvent(new CustomEvent('kt-menu-state', { detail: { open: true } }));
    } else {
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('kt-menu-state', { detail: { open: false } }));
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.dispatchEvent(new CustomEvent('kt-menu-state', { detail: { open: false } }));
    };
  }, [activeBrand]);

  const activeData = activeBrand ? BRAND_BENEFITS[activeBrand] : null;

  return (
    <section id="brands" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24 scroll-mt-24">
      <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase mb-4">
        OUR BRANDS
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Aqualion Card */}
        <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#FFF4E3] border border-[#FFDFB0] p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#FFE3B8]/60 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-2.5 min-w-0">
              {/* Increased Logo Size */}
              <div className="h-24 sm:h-28 md:h-32 flex items-center">
                <img
                  src="/images/logos/aqualion-logo.svg"
                  alt="Aqualion"
                  className="h-full w-auto max-w-[240px] sm:max-w-[290px] object-contain object-left scale-105 origin-left"
                />
              </div>
              <span className="px-3.5 py-1 rounded-full bg-white text-[#8A4B00] text-xs font-black shadow-2xs tracking-wider border border-[#FFDFB0]">
                PREMIUM
              </span>
            </div>
            <img
              src="/assets/hero-aerator-card-t.png"
              alt="Aqualion Aerator"
              className="relative w-36 sm:w-48 h-auto object-contain shrink-0 -mr-2 -mt-2 drop-shadow-md"
            />
          </div>

          <h3 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1A33] font-poppins">
            Aqualion Premium
          </h3>

          {/* Action buttons: side by side with reduced mobile sizing */}
          <div className="relative grid grid-cols-2 gap-2 sm:gap-3 w-full mt-auto pt-2">
            <button
              type="button"
              onClick={() => setActiveBrand('aqualion')}
              className="h-10 sm:h-11 px-2.5 sm:px-4 rounded-full bg-white border border-[#FFDFB0] text-[#8A4B00] inline-flex items-center justify-center font-extrabold text-xs sm:text-sm hover:bg-[#FFE3B8] transition-colors cursor-pointer shadow-2xs text-center"
            >
              Why Aqua Lion?
            </button>
            <Link
              href="/aerator-sets?brand=aqualion"
              className="h-10 sm:h-11 px-2.5 sm:px-4 rounded-full bg-[#C4D9FF] text-[#0B1A33] inline-flex items-center justify-center font-extrabold text-xs sm:text-sm hover:bg-[#24365A] hover:text-white transition-colors text-center"
            >
              Shop Aqualion →
            </Link>
          </div>
        </div>

        {/* Sea Boss Card */}
        <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#E8F9FF] border border-[#C4D9FF] p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-[#C4D9FF]/50 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-2.5 min-w-0">
              {/* Increased Logo Size */}
              <div className="h-24 sm:h-28 md:h-32 flex items-center">
                <img
                  src="/images/logos/seaboss-logo.svg"
                  alt="Sea Boss"
                  className="h-full w-auto max-w-[240px] sm:max-w-[290px] object-contain object-left scale-105 origin-left"
                />
              </div>
              <span className="px-3.5 py-1 rounded-full bg-white text-[#0B5C86] text-xs font-black shadow-2xs tracking-wider border border-[#C4D9FF]">
                HIGH PERFORMANCE
              </span>
            </div>
            <img
              src="/assets/hero-aerator-card-t.png"
              alt="Sea Boss Aerator"
              className="relative w-36 sm:w-48 h-auto object-contain shrink-0 -mr-2 -mt-2 drop-shadow-md"
            />
          </div>

          <h3 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1A33] font-poppins">
            Sea Boss
          </h3>

          {/* Action buttons: side by side with reduced mobile sizing */}
          <div className="relative grid grid-cols-2 gap-2 sm:gap-3 w-full mt-auto pt-2">
            <button
              type="button"
              onClick={() => setActiveBrand('seaboss')}
              className="h-10 sm:h-11 px-2.5 sm:px-4 rounded-full bg-white border border-[#C4D9FF] text-[#0B5C86] inline-flex items-center justify-center font-extrabold text-xs sm:text-sm hover:bg-[#DDF3FF] transition-colors cursor-pointer shadow-2xs text-center"
            >
              Why Sea Boss?
            </button>
            <Link
              href="/aerator-sets?brand=seaboss"
              className="h-10 sm:h-11 px-2.5 sm:px-4 rounded-full bg-[#C4D9FF] text-[#0B1A33] inline-flex items-center justify-center font-extrabold text-xs sm:text-sm hover:bg-[#24365A] hover:text-white transition-colors text-center"
            >
              Shop Sea Boss →
            </Link>
          </div>
        </div>
      </div>

      {/* Brand Benefits Modal - z-[120] to guarantee it is above Header (z-[70]) and MobileBottomNav (z-[56]) */}
      <AnimatePresence>
        {activeData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5">
            {/* Subtle Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0B1A33]/70 backdrop-blur-md"
              onClick={() => setActiveBrand(null)}
            />

            {/* Modal Dialog Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="brand-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-[94vw] sm:max-w-xl md:max-w-2xl max-h-[86vh] sm:max-h-[90vh] overflow-hidden bg-white rounded-[22px] sm:rounded-[30px] shadow-2xl border border-slate-100 flex flex-col z-10 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header: Clean logo directly rendered with NO layout background box */}
              <div className={`p-4 sm:p-5 sm:px-7 border-b ${activeData.headerBg} ${activeData.headerBorder} flex items-start justify-between gap-3 shrink-0`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                  {/* Logo without any box background */}
                  <div className="h-9 sm:h-11 w-auto flex items-center shrink-0">
                    <img
                      src={activeData.logo}
                      alt={activeData.name}
                      className="h-full w-auto max-w-[130px] sm:max-w-[160px] object-contain object-left"
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-[10px] sm:text-xs font-black tracking-widest uppercase block leading-none mb-1"
                      style={{ color: activeData.accentColor }}
                    >
                      {activeData.badge}
                    </span>
                    <h3
                      id="brand-modal-title"
                      className="text-lg sm:text-2xl font-extrabold text-[#0B1A33] tracking-tight font-poppins leading-tight"
                    >
                      {activeData.heading}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#475569] font-medium leading-normal mt-0.5">
                      {activeData.subtitle}
                    </p>
                  </div>
                </div>

                {/* Close Button (×) */}
                <button
                  type="button"
                  onClick={() => setActiveBrand(null)}
                  aria-label="Close"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-[#0B1A33] flex items-center justify-center font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <XMarkIcon className="w-5 h-5 text-[#0B1A33]" />
                </button>
              </div>

              {/* 10 Key Benefits Grid - Numbered points only, NO icons */}
              <div className="p-3.5 sm:p-5 sm:px-7 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {activeData.benefits.map((b) => (
                    <div
                      key={b.num}
                      className="flex items-start gap-2.5 p-2 sm:p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-100 hover:border-slate-200 hover:bg-[#F1F5F9]/70 transition-colors"
                    >
                      {/* Number Badge */}
                      <span
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg ${activeData.numBadgeBg} ${activeData.numBadgeText} text-[10px] sm:text-xs font-black flex items-center justify-center shrink-0 mt-0.5 border border-white/60 shadow-2xs`}
                      >
                        {b.num}
                      </span>

                      {/* Title & Detail */}
                      <div className="min-w-0 flex-1 text-xs sm:text-sm leading-snug">
                        <span className="font-extrabold text-[#0B1A33]">
                          {b.title}:
                        </span>{' '}
                        <span className="text-[#475569] font-medium">
                          {b.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 sm:px-7 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveBrand(null)}
                  className="h-9 sm:h-10 px-4 rounded-full text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0B1A33] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={activeData.href}
                  onClick={() => setActiveBrand(null)}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-xs sm:text-sm hover:bg-[#24365A] hover:text-white transition-colors inline-flex items-center justify-center shadow-xs"
                >
                  Shop {activeData.name} Sets →
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
