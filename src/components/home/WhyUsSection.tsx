'use client';

import { useState, useEffect } from 'react';

interface Pillar {
  title: string;
  sub: string;
  icon: string;
  bg1: string;
  bg2: string;
  line: string;
  ink: string;
}

const PILLARS: Pillar[] = [
  {
    title: '1 Year Warranty',
    sub: '',
    icon: '/assets/icon-warranty.svg',
    bg1: '#E8F9FF',
    bg2: '#CFEFFA',
    line: '#BBE6F5',
    ink: '#0B5C86',
  },
  {
    title: 'Genuine Spares',
    sub: '',
    icon: '/assets/icon-spares.png',
    bg1: '#EAF0FC',
    bg2: '#AFC8F7',
    line: '#A4C3F5',
    ink: '#1D4ED8',
  },
  {
    title: 'Direct Wholesale Rates',
    sub: '',
    icon: '/assets/icon-support.svg',
    bg1: '#EDFDF5',
    bg2: '#C7EED6',
    line: '#A7E6BE',
    ink: '#047857',
  },
  {
    title: 'Pan-India Delivery',
    sub: '',
    icon: '/assets/icon-delivery.svg',
    bg1: '#F4F0FF',
    bg2: '#DDD6FF',
    line: '#CBC1F7',
    ink: '#6D28D9',
  },
];

export default function WhyUsSection() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PILLARS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase">
            WHY KARTHIK TRADERS
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW: 4-Column Grid (>= 1024px) */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-5">
        {PILLARS.map((p, i) => (
          <div
            key={p.title}
            className="group relative rounded-[30px] p-7 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1.5 shadow-xs hover:shadow-md border"
            style={{
              background: `linear-gradient(160deg, ${p.bg1} 0%, ${p.bg2} 100%)`,
              borderColor: p.line,
            }}
          >
            {/* Animated Icon */}
            <div>
              <span className="w-20 h-20 rounded-2xl bg-white/70 backdrop-blur-xs inline-flex items-center justify-center p-3 shadow-xs animate-[ktFloatY_4s_ease-in-out_infinite]">
                <img
                  src={p.icon}
                  alt={p.title}
                  className="w-full h-full object-contain"
                />
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-extrabold text-[#0B1A33] tracking-tight font-poppins leading-tight">
                {p.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE VIEW: 1-Card Swipeable Carousel with Dot Indicators (< 1024px) */}
      <div className="lg:hidden">
        <div
          className="relative overflow-hidden rounded-[28px]"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any)._startX = touch.clientX;
          }}
          onTouchEnd={(e) => {
            const startX = (e.currentTarget as any)._startX || 0;
            const diff = e.changedTouches[0].clientX - startX;
            if (Math.abs(diff) > 40) {
              if (diff < 0) {
                setActiveIdx((prev) => (prev + 1) % PILLARS.length);
              } else {
                setActiveIdx((prev) => (prev - 1 + PILLARS.length) % PILLARS.length);
              }
            }
          }}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIdx * 100}%)` }}
          >
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className="flex-[0_0_100%] min-w-0 p-6 rounded-[28px] flex flex-col justify-between gap-5 border shadow-sm"
                style={{
                  background: `linear-gradient(160deg, ${p.bg1} 0%, ${p.bg2} 100%)`,
                  borderColor: p.line,
                  minHeight: '220px',
                }}
              >
                <div>
                  <span className="w-16 h-16 rounded-2xl bg-white/80 inline-flex items-center justify-center p-2.5 shadow-xs">
                    <img
                      src={p.icon}
                      alt={p.title}
                      className="w-full h-full object-contain"
                    />
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xl font-extrabold text-[#0B1A33] tracking-tight font-poppins leading-tight">
                    {p.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center items-center gap-2 mt-4">
          {PILLARS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIdx(i)}
              aria-label={`Show pillar ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                activeIdx === i ? 'w-7 bg-[#1450C8]' : 'w-2 bg-[#C4D9FF]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
