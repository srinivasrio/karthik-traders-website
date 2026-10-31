'use client';

import Link from 'next/link';
import Image from 'next/image';

interface CategoryItem {
  title: string;
  sub: string;
  href: string;
  img: string;
  bg: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    title: 'Aerator Sets',
    sub: '1HP · 2HP · 3HP complete units',
    href: '/aerator-sets',
    img: '/assets/hero-aerator-card-t.png',
    bg: '#E8F9FF',
  },
  {
    title: 'Motors',
    sub: '3-Phase ISO · Single-Phase heavy duty',
    href: '/products?category=motors',
    img: '/assets/cat-motor-t.png',
    bg: '#C4D9FF',
  },
  {
    title: 'Gear Boxes',
    sub: 'A3 Bevel · PN Bevel · Worm 1:14',
    href: '/products?category=gearboxes',
    img: '/assets/cat-gearbox-t.png',
    bg: '#EFEBFF',
  },
  {
    title: 'Spares',
    sub: 'Floats, fans, doms, frames, rods, kits',
    href: '/spares',
    img: '/images/categories/spares_cat.png',
    bg: '#EFEBFF',
  },
  {
    title: 'Long Arm',
    sub: 'Dual-shaft gearboxes & fittings',
    href: '/long-arm',
    img: '/images/categories/long_arm_cat.png',
    bg: '#E8F9FF',
  },
  {
    title: 'Bulk Orders',
    sub: 'Farm clusters & dealer pricing',
    href: '#bulk',
    img: '/assets/logo-trim.png',
    bg: '#C4D9FF',
  },
];

export default function CategorySection() {
  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase mb-2">
            SHOP BY CATEGORY
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1A33] tracking-tight font-poppins">
            Aerators & Genuine Aquaculture Spares
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group relative flex flex-col rounded-[24px] sm:rounded-[28px] overflow-hidden text-[#0B1A33] min-h-[220px] sm:min-h-[260px] transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-md border border-black/5"
            style={{ backgroundColor: c.bg }}
          >
            {/* Image Container */}
            <div className="relative flex-1 min-h-[110px] sm:min-h-[140px] m-2 sm:m-3 rounded-[18px] sm:rounded-[20px] overflow-hidden bg-transparent flex items-center justify-center p-3">
              <img
                src={c.img}
                alt={c.title}
                className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                  c.title === 'Spares' ? 'rounded-2xl' : ''
                }`}
                loading="lazy"
              />
            </div>

            {/* Title & Action */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
              <div className="min-w-0 flex-1">
                <span className="block text-sm sm:text-base font-extrabold tracking-tight truncate text-[#0B1A33] font-poppins">
                  {c.title}
                </span>
                <span className="hidden sm:block text-[11px] text-[#5B6880] truncate font-medium">
                  {c.sub}
                </span>
              </div>
              <span className="w-8 h-8 rounded-full bg-[#C4D9FF] text-[#0B1A33] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
