'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CONTACT_INFO } from '@/data/kt-ui';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const fishes = [
    {
      src: '/images/fishes/fish-1.svg',
      w: 72,
      h: 44,
      mobW: 48,
      mobH: 29,
      left: '8%',
      mobLeft: '6%',
      delay: '0s',
      dur: '3.8s',
      land: '180px',
      mobLand: '110px',
      height: '-70px',
      mobHeight: '-50px',
      desktopOnly: false,
    },
    {
      src: '/images/fishes/fish-2.svg',
      w: 88,
      h: 35,
      mobW: 58,
      mobH: 23,
      left: '32%',
      mobLeft: '38%',
      delay: '-1.8s',
      dur: '4.3s',
      land: '200px',
      mobLand: '120px',
      height: '-78px',
      mobHeight: '-55px',
      desktopOnly: false,
    },
    {
      src: '/images/fishes/fish-1.svg',
      w: 64,
      h: 39,
      mobW: 44,
      mobH: 27,
      left: '58%',
      mobLeft: '70%',
      delay: '-0.9s',
      dur: '3.6s',
      land: '165px',
      mobLand: '105px',
      height: '-65px',
      mobHeight: '-46px',
      desktopOnly: false,
    },
    {
      src: '/images/fishes/fish-2.svg',
      w: 80,
      h: 32,
      mobW: 52,
      mobH: 21,
      left: '80%',
      mobLeft: '80%',
      delay: '-2.7s',
      dur: '4.1s',
      land: '190px',
      mobLand: '115px',
      height: '-74px',
      mobHeight: '-52px',
      desktopOnly: true,
    },
  ];

  const columns = [
    {
      title: 'SHOP',
      links: [
        { label: 'Aerator Sets', href: '/aerator-sets' },
        { label: 'Motors & Gearboxes', href: '/products' },
        { label: 'Spares', href: '/spares' },
        { label: 'Long Arm Systems', href: '/long-arm' },
        { label: 'Compare Models', href: '/compare' },
      ],
    },
    {
      title: 'HELP & SUPPORT',
      links: [
        { label: 'Our Brands', href: '/#brands' },
        { label: 'Bulk Orders', href: '/#bulk' },
        { label: 'Dealer Enquiry', href: '/contact#enquiry' },
        { label: 'Warranty Policy', href: '/terms-conditions#warranty' },
        { label: 'Visit Store (Nellore)', href: '/#address' },
      ],
    },
    {
      title: 'CONNECT',
      links: [
        { label: 'Call: +91 86885 66023', href: 'tel:+918688566023' },
        { label: 'Technical: +91 91776 57576', href: 'tel:+919177657576' },
        { label: 'WhatsApp Chat', href: 'https://wa.me/918688566023', external: true },
        { label: 'Instagram', href: CONTACT_INFO.instagram, external: true },
        { label: 'Facebook', href: CONTACT_INFO.facebook, external: true },
      ],
    },
    {
      title: 'COMPANY & LEGAL',
      links: [
        { label: 'About Us', href: '/about-us' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Refund & Cancellation', href: '/refund-policy' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms & Conditions', href: '/terms-conditions' },
      ],
    },
  ];

  return (
    <footer className="relative mt-16 md:mt-28 bg-[#E8F9FF] text-[#0B1A33] font-manrope overflow-hidden">
      {/* Top Transition Curve */}
      <svg
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="absolute -top-[1px] left-0 w-full h-10 sm:h-12 block z-[1] pointer-events-none"
        aria-hidden="true"
      >
        <path
          d="M0 0h1440v16c-120 18-240 26-360 16S840 8 720 14 480 40 360 36 120 14 0 22z"
          fill="#FBFBFB"
        />
        <path
          d="M0 32c120-10 240-10 360 4s240 22 360 10 240-28 360-24 240 16 360 12"
          fill="none"
          stroke="#BAE6FD"
          strokeWidth="1.5"
        />
      </svg>

      {/* Interactive Water Surface & Jumping Dolphin Fish Stage */}
      <div
        className="absolute left-0 right-0 top-0 h-52 sm:h-60 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Deep Water Layer (Back Wave) */}
        <svg
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-[200%] h-24 sm:h-28 pointer-events-none z-0"
          style={{ animation: 'ktFlow 24s linear 0s infinite' }}
        >
          <path
            d="M0 60C240 20 480 20 720 60S1200 100 1440 60C1680 20 1920 20 2160 60S2640 100 2880 60V120H0Z"
            fill="#0284C7"
            opacity="0.45"
          />
        </svg>

        {/* Mid Water Layer (Flowing Wave) */}
        <svg
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-[200%] h-20 sm:h-24 pointer-events-none z-[5]"
          style={{ animation: 'ktFlowR 18s linear -4s infinite' }}
        >
          <path
            d="M0 60C240 20 480 20 720 60S1200 100 1440 60C1680 20 1920 20 2160 60S2640 100 2880 60V120H0Z"
            fill="#0EA5E9"
            opacity="0.55"
          />
        </svg>

        {/* PROMINENT JUMPING DOLPHIN FISH LAYER (z-20: IN FRONT OF WAVES) */}
        <div className="absolute left-0 right-0 bottom-10 h-0 pointer-events-none z-20">
          {fishes.map((f, i) => (
            <div
              key={i}
              className={`absolute top-0 w-0 h-0 pointer-events-none ${f.desktopOnly ? 'hidden md:block' : ''}`}
              style={{
                left: f.left,
                ['--jump-dist' as any]: f.land,
                ['--jump-height' as any]: f.height,
                ['--jump-dist-mob' as any]: f.mobLand,
                ['--jump-height-mob' as any]: f.mobHeight,
              }}
            >
              {/* Splash Ring A (Breach Point) */}
              <span
                className="absolute -left-[18px] sm:-left-[24px] -top-1.5 w-[36px] sm:w-[48px] h-3 sm:h-3.5 rounded-full border-2 border-white/95 bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.8)] backdrop-blur-xs opacity-0 z-30"
                style={{
                  animation: `ktSplashA ${f.dur} ease-out ${f.delay} infinite`,
                }}
              />
              {/* Water Spray Droplet A */}
              <span
                className="absolute -left-1 -top-2 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white shadow-xs opacity-0 z-30"
                style={{
                  animation: `ktSplashDropA ${f.dur} ease-out ${f.delay} infinite`,
                }}
              />

              {/* Splash Ring B (Landing Re-entry Point) */}
              <span
                className="absolute -top-1.5 w-[40px] sm:w-[52px] h-3 sm:h-3.5 rounded-full border-2 border-white/95 bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.8)] backdrop-blur-xs opacity-0 z-30"
                style={{
                  left: `calc(var(--jump-dist, ${f.land}) - 20px)`,
                  animation: `ktSplashB ${f.dur} ease-out ${f.delay} infinite`,
                }}
              />
              {/* Water Spray Droplet B */}
              <span
                className="absolute -top-2 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-white shadow-xs opacity-0 z-30"
                style={{
                  left: `var(--jump-dist, ${f.land})`,
                  animation: `ktSplashDropB ${f.dur} ease-out ${f.delay} infinite`,
                }}
              />

              {/* Dolphin Trajectory: X (Forward) -> Y (Parabolic height) -> R (Rotation arch) */}
              <div
                className="absolute left-0 top-0 w-0 h-0 opacity-0"
                style={{
                  animation: `ktJX ${f.dur} linear ${f.delay} infinite`,
                  willChange: 'transform, opacity',
                }}
              >
                <div
                  className="absolute left-0 top-0 w-0 h-0"
                  style={{
                    animation: `ktJY ${f.dur} linear ${f.delay} infinite`,
                    willChange: 'transform',
                  }}
                >
                  <div
                    className="absolute left-0 top-0 w-0 h-0"
                    style={{
                      animation: `ktJR ${f.dur} linear ${f.delay} infinite`,
                      willChange: 'transform',
                    }}
                  >
                    <img
                      src={f.src}
                      alt="Jumping Fish"
                      className="select-none pointer-events-none max-w-none"
                      style={{
                        position: 'absolute',
                        width: `${f.w}px`,
                        height: `${f.h}px`,
                        maxWidth: 'none',
                        minWidth: `${f.mobW}px`,
                        left: `-${f.w / 2}px`,
                        top: `-${f.h / 2}px`,
                        transform: 'scaleX(-1)', // flips SVG so nose points in jump direction (right)
                        filter: 'drop-shadow(0 8px 10px rgba(2, 44, 84, 0.28))',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Foreground Water Lip (Surf Edge) */}
        <svg
          viewBox="0 0 2880 60"
          preserveAspectRatio="none"
          className="absolute left-0 bottom-0 w-[200%] h-12 sm:h-14 pointer-events-none z-25"
          style={{ animation: 'ktFlow 12s linear -2s infinite' }}
        >
          <path
            d="M0 30C240 10 480 10 720 30S1200 50 1440 30C1680 10 1920 10 2160 30S2640 50 2880 30V60H0Z"
            fill="#38BDF8"
            opacity="0.7"
          />
        </svg>

        <div className="absolute left-0 right-0 bottom-0 h-4 bg-gradient-to-b from-[#38BDF8]/40 to-[#E8F9FF] z-25" />
      </div>

      {/* Main Footer Container */}
      <div className="relative max-w-[1320px] mx-auto pt-52 sm:pt-60 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-9 lg:gap-8">
          {/* Brand Info (2 columns wide) */}
          <div className="lg:col-span-2 flex flex-col gap-4 max-w-sm">
            <Link
              href="/"
              aria-label="Karthik Traders home"
              className="flex items-center gap-3 text-decoration-none"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-none">
                <Image
                  src="/assets/logo-emblem.png"
                  alt="Karthik Traders emblem"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-poppins font-extrabold text-lg sm:text-xl text-[#0A1F5C] tracking-tight whitespace-nowrap">
                KARTHIK TRADERS
              </span>
            </Link>

            {/* Authorized Brands Card */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
                Official Authorized Brands
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/aerator-sets?brand=aqualion"
                  title="Shop Aqualion Aerators"
                  className="h-12 px-3 py-1.5 rounded-2xl bg-white border border-[#FFDFB0] shadow-xs hover:shadow-md hover:border-[#E8A317] transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <img
                    src="/images/logos/aqualion-logo.svg"
                    alt="Aqualion"
                    className="h-8 w-auto object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#8A4B00] leading-none">Aqualion</span>
                    <span className="text-[9px] font-bold text-[#B87000] uppercase tracking-wide mt-0.5">Premium</span>
                  </div>
                </Link>

                <Link
                  href="/aerator-sets?brand=seaboss"
                  title="Shop Sea Boss Aerators"
                  className="h-12 px-3 py-1.5 rounded-2xl bg-white border border-[#C4D9FF] shadow-xs hover:shadow-md hover:border-[#1450C8] transition-all flex items-center gap-2.5 group cursor-pointer"
                >
                  <img
                    src="/images/logos/seaboss-logo.svg"
                    alt="Sea Boss"
                    className="h-8 w-auto object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-[#0B5C86] leading-none">Sea Boss</span>
                    <span className="text-[9px] font-bold text-[#1450C8] uppercase tracking-wide mt-0.5">High Power</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Original Social Media Icons */}
            <div className="flex items-center gap-3.5 pt-2">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/karthik_traders_01?igsh=MXIxOWh4MGIzNnhlZg=="
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-transform hover:scale-110 duration-200"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
                  <defs>
                    <linearGradient id="instagram-gradient-kt" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FFDC80" />
                      <stop offset="25%" stopColor="#F77737" />
                      <stop offset="50%" stopColor="#E1306C" />
                      <stop offset="75%" stopColor="#C13584" />
                      <stop offset="100%" stopColor="#833AB4" />
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient-kt)" />
                  <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" fill="none" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/1E2YvYdWZZ/"
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-transform hover:scale-110 duration-200"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/918688566023"
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-transform hover:scale-110 duration-200"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#25D366">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.183 8.183 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.188 8.188 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24h.02zm-3.56 3.84c-.2-.01-.43.08-.58.26-.23.27-.86.84-.86 2.05s.88 2.38 1 2.55c.13.16 1.71 2.67 4.18 3.7.59.25 1.05.39 1.41.51.59.19 1.13.16 1.56.1.47-.07 1.45-.59 1.66-1.16.2-.57.2-1.06.14-1.16-.06-.1-.23-.17-.48-.29-.26-.13-1.45-.71-1.68-.79-.22-.09-.39-.13-.55.13-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.26-.02-.4.11-.53.11-.11.26-.29.39-.44.13-.14.17-.24.26-.4.09-.16.04-.3-.02-.43-.07-.12-.55-1.33-.76-1.82-.2-.48-.42-.41-.58-.42l-.49-.01z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <span className="text-[11px] font-extrabold tracking-wider text-[#5B6880] uppercase mb-1">
                {col.title}
              </span>
              {col.links.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-[13px] font-bold text-[#0B1A33] hover:text-[#1450C8] transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-xs sm:text-[13px] font-bold text-[#0B1A33] hover:text-[#1450C8] transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </div>

        {/* Trust Indicators Row */}
        <div className="mt-12 pt-8 border-t border-[#C4D9FF]/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/60 border border-[#C4D9FF]/40">
            <span className="text-xl">🛡️</span>
            <span className="font-extrabold text-xs text-[#0B1A33]">1 Year Warranty</span>
            <span className="text-[10.5px] text-[#5B6880]">On aerator motors & gearboxes</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/60 border border-[#C4D9FF]/40">
            <span className="text-xl">🔧</span>
            <span className="font-extrabold text-xs text-[#0B1A33]">Genuine Spares</span>
            <span className="text-[10.5px] text-[#5B6880]">Always ready in stock</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/60 border border-[#C4D9FF]/40">
            <span className="text-xl">💎</span>
            <span className="font-extrabold text-xs text-[#0B1A33]">Transparent Pricing</span>
            <span className="text-[10.5px] text-[#5B6880]">Direct wholesale rates</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/60 border border-[#C4D9FF]/40">
            <span className="text-xl">🚚</span>
            <span className="font-extrabold text-xs text-[#0B1A33]">Pan India Delivery</span>
            <span className="text-[10.5px] text-[#5B6880]">Reliable farm dispatch</span>
          </div>
        </div>

        {/* Bottom Legal & Attribution */}
        <div className="mt-10 py-6 border-t border-[#C4D9FF] flex flex-wrap gap-4 items-center justify-between text-xs text-[#3D4A63]">
          <div>
            © {currentYear} Karthik Traders. All rights reserved. Opp. Madhura Sweets Line, Subedar Pet, Nellore.
          </div>
          <div>
            Developed by{' '}
            <a
              href="https://www.iamsrinivas.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-[#1450C8] hover:underline"
            >
              Srinivas Kumar
            </a>
          </div>
        </div>

        {/* Space for mobile bottom bar */}
        <div className="h-24 lg:h-6" />
      </div>
    </footer>
  );
}
