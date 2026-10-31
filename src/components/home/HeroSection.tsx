'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SlideToCall from '@/components/ui/SlideToCall';

export default function HeroSection() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Call slider state for mobile
  const [callDrag1, setCallDrag1] = useState(0);
  const [callDrag2, setCallDrag2] = useState(0);

  const productSlides = [
    {
      tag: 'AERATOR SETS',
      t1: 'Complete',
      t2: 'Aerators',
      href: '/aerator-sets',
      img: '/assets/hero-aerator-card-t.png',
    },
    {
      tag: 'MOTORS',
      t1: 'Heavy Duty',
      t2: 'Motors',
      href: '/products?category=motors',
      img: '/assets/cat-motor-t.png',
    },
    {
      tag: 'GEARBOXES',
      t1: 'Precision',
      t2: 'Gearboxes',
      href: '/products?category=gearboxes',
      img: '/assets/cat-gearbox-t.png',
    },
  ];

  // Auto-advance slides every 4.5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % productSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, productSlides.length]);

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % productSlides.length);
  };

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + productSlides.length) % productSlides.length);
  };

  return (
    <section className="relative w-full overflow-hidden font-poppins">
      {/* =========================================================================
          DESKTOP HERO (Hidden on mobile < 1024px)
          ========================================================================= */}
      <div className="hidden lg:block relative w-full bg-[#FBFBFB]">
        {/* Full 16:9 Hero Stage with Image as Full Background (Arranged like Mobile View) */}
        <div className="relative w-full aspect-[16/9] max-h-[820px] overflow-hidden">
          {/* Background Image: High-res desktop pond & aerator photograph */}
          <Image
            src="/assets/hero-pond-desktop.jpg"
            alt="Aquaculture aerator pond during sunrise"
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 100vw, 1920px"
          />

          {/* Sculpted Aquatic Wave Ribbon (Same as mobile, scaled for desktop) */}
          <div className="absolute right-0 top-[14%] xl:top-[16%] w-[220px] xl:w-[260px] 2xl:w-[290px] z-10">
            {/* Dynamic Sculpted Marine Wave Contour with Edge Highlight */}
            <svg
              viewBox="0 0 190 240"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none filter drop-shadow-[-10px_16px_28px_rgba(10,35,115,0.36)]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="desktopHeroWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1A6CF0" />
                  <stop offset="55%" stopColor="#1252C7" />
                  <stop offset="100%" stopColor="#0A368F" />
                </linearGradient>
              </defs>
              <path
                d="M190 0 L42 0 C22 0 8 14 5 34 C1 60 16 82 16 98 C16 114 2 136 5 162 C7 182 20 205 20 220 C20 232 30 240 45 240 L190 240 Z"
                fill="url(#desktopHeroWaveGrad)"
              />
              <path
                d="M42 0 C22 0 8 14 5 34 C1 60 16 82 16 98 C16 114 2 136 5 162 C7 182 20 205 20 220 C20 232 30 240 45 240"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Content inside Aquatic Wave Ribbon */}
            <div className="relative z-10 py-5 xl:py-6 pl-7 xl:pl-9 pr-3 xl:pr-4 flex flex-col gap-3.5 xl:gap-4 text-white translate-x-2">
              {/* Row 1: Better Water Quality */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#4B8BE8]/50">
                <span className="w-10 xl:w-11 h-10 xl:h-11 rounded-full border border-[#8EC2FF] bg-[#1E62D0] grid place-items-center flex-none shadow-xs">
                  <svg className="w-5 xl:w-5.5 h-5 xl:h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.5 7.5 9.5 0-3 .5-5.5 2.5-7.5s4.5-2.5 7.5-2.5C20.5 7 16.5 2 12 2Z" />
                    <path d="M8 16l8-8" />
                  </svg>
                </span>
                <span className="text-xs xl:text-sm font-bold leading-tight text-white tracking-tight">
                  Better Water<br />Quality
                </span>
              </div>

              {/* Row 2: Healthier Growth */}
              <div className="flex items-center gap-3 pb-3 border-b border-[#4B8BE8]/50">
                <span className="w-10 xl:w-11 h-10 xl:h-11 rounded-full border border-[#8EC2FF] bg-[#1E62D0] grid place-items-center flex-none shadow-xs">
                  <svg className="w-5 xl:w-5.5 h-5 xl:h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V8" />
                    <path d="M12 20V12" />
                    <path d="M6 20v-4" />
                  </svg>
                </span>
                <span className="text-xs xl:text-sm font-bold leading-tight text-white tracking-tight">
                  Healthier<br />Growth
                </span>
              </div>

              {/* Row 3: Reliable Products & Support */}
              <div className="flex items-center gap-3">
                <span className="w-10 xl:w-11 h-10 xl:h-11 rounded-full border border-[#8EC2FF] bg-[#1E62D0] grid place-items-center flex-none shadow-xs">
                  <svg className="w-5 xl:w-5.5 h-5 xl:h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
                  </svg>
                </span>
                <span className="text-xs xl:text-sm font-bold leading-tight text-white tracking-tight">
                  Reliable Products<br />& Support
                </span>
              </div>
            </div>
          </div>

          {/* Hero Content Overlay: Headline */}
          <div className="absolute left-[4.5%] top-[14%] xl:top-[16%] z-10 max-w-[46%] xl:max-w-[44%] flex flex-col items-start">
            <h1 className="font-poppins font-black text-[54px] xl:text-[76px] 2xl:text-[84px] leading-[0.92] tracking-tight text-[#0A1330] m-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">
              Stronger<br />Ponds<br />
              <span className="text-[#0B4FC7] drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">Brighter<br />Future</span>
            </h1>
          </div>

          {/* Direct Call Cards (Bottom of Hero Image, same arrangement as mobile) */}
          <div className="absolute left-[4.5%] bottom-[5%] z-20 flex gap-4 items-stretch">
            <a
              href="tel:+918688566023"
              className="flex items-center gap-3 py-2.5 px-5 rounded-full bg-[#128C4A] text-white shadow-[0_14px_28px_-14px_rgba(18,140,74,0.7)] hover:bg-[#0E7A40] transition-all active:scale-95 group"
            >
              <span className="w-9 h-9 rounded-full bg-white/20 grid place-items-center flex-none">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                </svg>
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm xl:text-base">Karthik · Sales</span>
                <span className="text-xs font-mono opacity-90">+91 86885 66023</span>
              </div>
            </a>

            <a
              href="tel:+919177657576"
              className="flex items-center gap-3 py-2.5 px-5 rounded-full bg-[#128C4A] text-white shadow-[0_14px_28px_-14px_rgba(18,140,74,0.7)] hover:bg-[#0E7A40] transition-all active:scale-95 group"
            >
              <span className="w-9 h-9 rounded-full bg-white/20 grid place-items-center flex-none">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                </svg>
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-sm xl:text-base">Hazarathaiah · Support</span>
                <span className="text-xs font-mono opacity-90">+91 91776 57576</span>
              </div>
            </a>
          </div>
        </div>

        {/* Desktop Product Carousel Card (Positioned below hero stage like mobile) */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div
            className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#EEF6FD] to-[#E2EEFA] border border-[#D5E6F8] shadow-[0_20px_50px_-24px_rgba(10,31,92,0.18)] p-0 pb-10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{
                width: `${productSlides.length * 100}%`,
                transform: `translateX(-${(slideIndex * 100) / productSlides.length}%)`,
              }}
            >
              {productSlides.map((slide, idx) => (
                <div
                  key={idx}
                  style={{ width: `${100 / productSlides.length}%` }}
                  className="shrink-0 min-w-0 p-8 pb-4 grid grid-cols-2 items-center gap-8 box-border"
                >
                  <div className="flex flex-col items-start gap-3 pl-4">
                    <span className="text-xs font-extrabold tracking-widest text-[#1468E0] flex items-center gap-2">
                      {slide.tag}
                      <span className="w-10 h-[1.5px] bg-[#1468E0]" />
                    </span>
                    <h2 className="font-poppins font-extrabold text-3xl xl:text-4xl text-[#141B6E] leading-tight m-0">
                      {slide.t1}<br />{slide.t2}
                    </h2>
                    <Link
                      href={slide.href}
                      className="mt-3 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1450C8] text-white font-semibold text-sm hover:bg-[#0F42A8] transition-colors"
                    >
                      <span>View Category</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M4 12h16M14 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                  <div className="relative h-44 xl:h-52">
                    <Image
                      src={slide.img}
                      alt={`${slide.t1} ${slide.t2}`}
                      fill
                      className="object-contain filter drop-shadow-[0_14px_18px_rgba(10,31,92,0.16)]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Controls & Dots */}
            <div className="absolute left-0 right-0 bottom-3 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handlePrevSlide}
                aria-label="Previous slide"
                className="w-7 h-7 rounded-full border border-[#C4D9FF] bg-white text-[#0A1F5C] grid place-items-center hover:bg-gray-50 cursor-pointer shadow-xs"
              >
                ‹
              </button>
              {productSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    slideIndex === i ? 'w-7 bg-[#1450C8]' : 'w-2 bg-[#C4D9FF]'
                  }`}
                />
              ))}
              <button
                type="button"
                onClick={handleNextSlide}
                aria-label="Next slide"
                className="w-7 h-7 rounded-full border border-[#C4D9FF] bg-white text-[#0A1F5C] grid place-items-center hover:bg-gray-50 cursor-pointer shadow-xs"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE HERO (< 1024px)
          ========================================================================= */}
      <div className="lg:hidden relative w-full bg-[#FBFBFB]">
        {/* Full-Ratio Hero Stage (9:16 Aspect Ratio) with Image as Background */}
        <div className="relative w-full aspect-[576/1024] overflow-hidden">
          {/* Background Image: Preserves exact aspect ratio without cropping or zooming */}
          <Image
            src="/assets/hero-pond-mobile.jpg"
            alt="Aquaculture aerator pond during sunrise"
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 576px"
          />

          {/* Sculpted Aquatic Wave Ribbon (Redesigned from half-oval to dynamic marine wave) */}
          <div className="absolute right-0 top-[20%] sm:top-[21%] w-[164px] sm:w-[182px] z-10">
            {/* Dynamic Sculpted Marine Wave Contour with Edge Highlight */}
            <svg
              viewBox="0 0 190 240"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none filter drop-shadow-[-8px_14px_24px_rgba(10,35,115,0.36)]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="mobileHeroWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1A6CF0" />
                  <stop offset="55%" stopColor="#1252C7" />
                  <stop offset="100%" stopColor="#0A368F" />
                </linearGradient>
              </defs>
              {/* Sculpted Multi-Wave Contour */}
              <path
                d="M190 0 L42 0 C22 0 8 14 5 34 C1 60 16 82 16 98 C16 114 2 136 5 162 C7 182 20 205 20 220 C20 232 30 240 45 240 L190 240 Z"
                fill="url(#mobileHeroWaveGrad)"
              />
              {/* Luminous Specular Wave Rim Highlight */}
              <path
                d="M42 0 C22 0 8 14 5 34 C1 60 16 82 16 98 C16 114 2 136 5 162 C7 182 20 205 20 220 C20 232 30 240 45 240"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Content inside Aquatic Wave Ribbon (Text style unchanged) */}
            <div className="relative z-10 py-3.5 sm:py-4.5 pl-5 sm:pl-6 pr-1 sm:pr-1.5 flex flex-col gap-2 sm:gap-2.5 text-white translate-x-1.5 sm:translate-x-2">
              {/* Row 1: Better Water Quality */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#4B8BE8]/50">
                <span className="w-7 h-7 rounded-full border border-[#60A5FA] bg-[#1E62D0] grid place-items-center flex-none shadow-xs">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.5 7.5 9.5 0-3 .5-5.5 2.5-7.5s4.5-2.5 7.5-2.5C20.5 7 16.5 2 12 2Z" />
                    <path d="M8 16l8-8" />
                  </svg>
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold leading-[1.14] text-white tracking-tight">
                  Better Water<br />Quality
                </span>
              </div>

              {/* Row 2: Healthier Growth */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#4B8BE8]/50">
                <span className="w-7 h-7 rounded-full border border-[#60A5FA] bg-[#1E62D0] grid place-items-center flex-none shadow-xs">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 20V8" />
                    <path d="M12 20V12" />
                    <path d="M6 20v-4" />
                  </svg>
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold leading-[1.14] text-white tracking-tight">
                  Healthier<br />Growth
                </span>
              </div>

              {/* Row 3: Reliable Products & Support */}
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full border border-[#60A5FA] bg-[#1E62D0] grid place-items-center flex-none shadow-xs">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
                  </svg>
                </span>
                <span className="text-[9.5px] sm:text-[10.5px] font-bold leading-[1.14] text-white tracking-tight">
                  Reliable Products<br />& Support
                </span>
              </div>
            </div>
          </div>

          {/* Hero Content Overlay: Larger Headline moved downside */}
          <div className="relative z-10 px-5 pt-[140px] sm:pt-[160px] flex flex-col items-start max-w-[50%] sm:max-w-[53%]">
            <h1 className="font-poppins font-black text-[46px] sm:text-[54px] leading-[0.90] tracking-tight text-[#0A1330] m-0 drop-shadow-[0_1px_3px_rgba(255,255,255,0.85)]">
              Stronger<br />Ponds<br />
              <span className="text-[#0B4FC7]">Brighter<br />Future</span>
            </h1>
          </div>

          {/* Direct Call Cards (Overlayed on bottom of hero image) */}
          <div className="absolute left-3.5 right-3.5 bottom-3.5 z-10 flex flex-col gap-2.5">
            <SlideToCall
              label="Slide to Call Karthik · Sales"
              phone="+918688566023"
              delayIndex={0}
            />
            <SlideToCall
              label="Slide to Call Hazarathaiah · Support"
              phone="+919177657576"
              delayIndex={1}
            />
          </div>
        </div>

        {/* Mobile Product Carousel Card */}
        <div className="px-4 mt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EEF6FD] to-[#E2EEFA] border border-[#D5E6F8] p-0 pb-8">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                width: `${productSlides.length * 100}%`,
                transform: `translateX(-${(slideIndex * 100) / productSlides.length}%)`,
              }}
            >
              {productSlides.map((slide, idx) => (
                <div
                  key={idx}
                  style={{ width: `${100 / productSlides.length}%` }}
                  className="shrink-0 min-w-0 p-4 pb-2 grid grid-cols-2 items-center gap-2 box-border"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-extrabold tracking-widest text-[#1468E0]">
                      {slide.tag}
                    </span>
                    <h2 className="font-poppins font-extrabold text-lg text-[#141B6E] leading-tight m-0">
                      {slide.t1}<br />{slide.t2}
                    </h2>
                    <Link
                      href={slide.href}
                      className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1450C8] text-white font-semibold text-xs"
                    >
                      <span>View</span>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 12h16M14 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                  <div className="relative h-24">
                    <Image
                      src={slide.img}
                      alt={`${slide.t1} ${slide.t2}`}
                      fill
                      className="object-contain filter drop-shadow-md"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Dots */}
            <div className="absolute left-0 right-0 bottom-2 flex items-center justify-center gap-1.5">
              {productSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    slideIndex === i ? 'w-5 bg-[#1450C8]' : 'w-1.5 bg-[#C4D9FF]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
