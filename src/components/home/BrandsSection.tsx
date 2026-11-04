'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CubeIcon,
  SunIcon,
  BoltIcon,
  ClockIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  StarIcon,
  BanknotesIcon,
  TagIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

interface BenefitItem {
  num: number;
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
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
  iconBg: string;
  iconColor: string;
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
    iconBg: 'bg-[#FFF2DE]',
    iconColor: 'text-[#D97706]',
    numBadgeBg: 'bg-[#FEF3C7]',
    numBadgeText: 'text-[#92400E]',
    href: '/aerator-sets?brand=aqualion',
    benefits: [
      {
        num: 1,
        title: 'Higher Oxygen',
        detail: '3.5–4.0 kg O₂/hr.',
        icon: SparklesIcon,
      },
      {
        num: 2,
        title: 'SS 304 Frame',
        detail: 'Superior corrosion resistance.',
        icon: ShieldCheckIcon,
      },
      {
        num: 3,
        title: 'Thick Frame',
        detail: 'Heavy-duty 3 mm construction.',
        icon: CubeIcon,
      },
      {
        num: 4,
        title: 'Heavy Floats',
        detail: '7 kg UV-stabilized HDPE.',
        icon: SunIcon,
      },
      {
        num: 5,
        title: 'Low Amp Draw',
        detail: 'Energy-efficient 2HP motor.',
        icon: BoltIcon,
      },
      {
        num: 6,
        title: '24/7 Duty',
        detail: 'Designed for continuous operation.',
        icon: ClockIcon,
      },
      {
        num: 7,
        title: 'Wide Circulation',
        detail: '35–40 m effective range.',
        icon: ArrowsPointingOutIcon,
      },
      {
        num: 8,
        title: 'Precision Gearbox',
        detail: 'Reduced operational wear.',
        icon: Cog6ToothIcon,
      },
      {
        num: 9,
        title: 'High-Density Ready',
        detail: 'Ideal for intensive farming.',
        icon: ChartBarIcon,
      },
      {
        num: 10,
        title: 'Long-Term Value',
        detail: 'Built for durability.',
        icon: StarIcon,
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
    iconBg: 'bg-[#E0F2FE]',
    iconColor: 'text-[#0284C7]',
    numBadgeBg: 'bg-[#E0F2FE]',
    numBadgeText: 'text-[#0369A1]',
    href: '/aerator-sets?brand=seaboss',
    benefits: [
      {
        num: 1,
        title: 'Budget-Friendly',
        detail: 'Starts at ₹23,999.',
        icon: BanknotesIcon,
      },
      {
        num: 2,
        title: 'Reliable Aeration',
        detail: '2.3–3.0 kg O₂/hr.',
        icon: SparklesIcon,
      },
      {
        num: 3,
        title: 'Lower Investment',
        detail: 'Affordable upfront cost.',
        icon: TagIcon,
      },
      {
        num: 4,
        title: 'Easy Handling',
        detail: 'Lighter frame and floats.',
        icon: ArrowUpTrayIcon,
      },
      {
        num: 5,
        title: 'SS 202 Frame',
        detail: 'Practical everyday performance.',
        icon: ShieldCheckIcon,
      },
      {
        num: 6,
        title: '6.5 kg Floats',
        detail: 'Reliable pond buoyancy.',
        icon: CheckCircleIcon,
      },
      {
        num: 7,
        title: 'Gearbox Options',
        detail: 'A2 Worm or A3 Bevel.',
        icon: Cog6ToothIcon,
      },
      {
        num: 8,
        title: 'S1 Duty Motor',
        detail: 'Designed for continuous operation.',
        icon: ClockIcon,
      },
      {
        num: 9,
        title: 'IP55 Protection',
        detail: 'Added motor protection.',
        icon: ShieldCheckIcon,
      },
      {
        num: 10,
        title: 'Warranty Option',
        detail: '1-year extended replacement add-on.',
        icon: CheckBadgeIcon,
      },
    ],
  },
};

export default function BrandsSection() {
  const [activeBrand, setActiveBrand] = useState<'aqualion' | 'seaboss' | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveBrand(null);
      }
    };
    if (activeBrand) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
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
        <div className="relative rounded-[32px] bg-[#FFF4E3] border border-[#FFDFB0] p-6 sm:p-9 flex flex-col gap-6 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
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
              <span className="px-3.5 py-1 rounded-full bg-white text-[#8A4B00] text-xs font-black shadow-2xs tracking-wider border border-[#FFDFB0]">
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

          <div className="relative flex flex-wrap items-center gap-3 mt-auto pt-2">
            <button
              type="button"
              onClick={() => setActiveBrand('aqualion')}
              className="h-11 px-5 rounded-full bg-white border border-[#FFDFB0] text-[#8A4B00] inline-flex items-center gap-2 font-extrabold text-sm hover:bg-[#FFE3B8] transition-colors cursor-pointer shadow-2xs"
            >
              <SparklesIcon className="w-4 h-4 text-[#D97706]" />
              Why Aqua Lion?
            </button>
            <Link
              href="/aerator-sets?brand=aqualion"
              className="h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] inline-flex items-center font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
            >
              Shop Aqualion →
            </Link>
          </div>
        </div>

        {/* Sea Boss Card */}
        <div className="relative rounded-[32px] bg-[#E8F9FF] border border-[#C4D9FF] p-6 sm:p-9 flex flex-col gap-6 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
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
              <span className="px-3.5 py-1 rounded-full bg-white text-[#0B5C86] text-xs font-black shadow-2xs tracking-wider border border-[#C4D9FF]">
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

          <div className="relative flex flex-wrap items-center gap-3 mt-auto pt-2">
            <button
              type="button"
              onClick={() => setActiveBrand('seaboss')}
              className="h-11 px-5 rounded-full bg-white border border-[#C4D9FF] text-[#0B5C86] inline-flex items-center gap-2 font-extrabold text-sm hover:bg-[#DDF3FF] transition-colors cursor-pointer shadow-2xs"
            >
              <SparklesIcon className="w-4 h-4 text-[#0B5C86]" />
              Why Sea Boss?
            </button>
            <Link
              href="/aerator-sets?brand=seaboss"
              className="h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] inline-flex items-center font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
            >
              Shop Sea Boss →
            </Link>
          </div>
        </div>
      </div>

      {/* Brand Benefits Modal */}
      <AnimatePresence>
        {activeData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            {/* Subtle Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0B1A33]/60 backdrop-blur-sm"
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
              className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden bg-white rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-100 flex flex-col z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-5 sm:p-6 sm:px-8 border-b ${activeData.headerBg} ${activeData.headerBorder} flex items-start justify-between gap-4 shrink-0`}>
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-xs border border-white/80 flex items-center justify-center p-2 shrink-0">
                    <img
                      src={activeData.logo}
                      alt={activeData.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-[11px] sm:text-xs font-black tracking-widest uppercase block mb-0.5"
                      style={{ color: activeData.accentColor }}
                    >
                      {activeData.badge}
                    </span>
                    <h3
                      id="brand-modal-title"
                      className="text-xl sm:text-2xl font-extrabold text-[#0B1A33] tracking-tight font-poppins leading-tight"
                    >
                      {activeData.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] font-medium line-clamp-2 mt-0.5">
                      {activeData.subtitle}
                    </p>
                  </div>
                </div>

                {/* Close Button (×) */}
                <button
                  type="button"
                  onClick={() => setActiveBrand(null)}
                  aria-label="Close"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#0B1A33] flex items-center justify-center font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <XMarkIcon className="w-5 h-5 text-[#0B1A33]" />
                </button>
              </div>

              {/* 10 Key Benefits Grid */}
              <div className="p-4 sm:p-6 sm:px-8 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {activeData.benefits.map((b) => {
                    const Icon = b.icon;
                    return (
                      <div
                        key={b.num}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-slate-200 hover:bg-[#F1F5F9]/60 transition-colors"
                      >
                        {/* Number Badge & Icon */}
                        <div className={`w-9 h-9 rounded-xl ${activeData.iconBg} ${activeData.iconColor} flex items-center justify-center shrink-0 relative shadow-2xs`}>
                          <Icon className="w-5 h-5" />
                          <span
                            className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full ${activeData.numBadgeBg} ${activeData.numBadgeText} text-[10px] font-black flex items-center justify-center border border-white`}
                          >
                            {b.num}
                          </span>
                        </div>

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
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 sm:px-8 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveBrand(null)}
                  className="h-10 px-5 rounded-full text-xs sm:text-sm font-bold text-[#64748B] hover:text-[#0B1A33] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={activeData.href}
                  onClick={() => setActiveBrand(null)}
                  className="h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-xs sm:text-sm hover:bg-[#24365A] hover:text-white transition-colors inline-flex items-center justify-center shadow-xs"
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
