'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navTabs = [
  {
    name: 'Home',
    href: '/',
    id: 'home',
    renderIcon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'Aerators',
    href: '/aerator-sets',
    id: 'aerators',
    renderIcon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.17-6.83-2.83 2.83m-8 8-2.83 2.83m0-13.66 2.83 2.83m8 8 2.83 2.83" />
      </svg>
    ),
  },
  {
    name: 'Products',
    href: '/products',
    id: 'products',
    renderIcon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="7" x="3" y="3" rx="1.5" />
        <rect width="7" height="7" x="14" y="3" rx="1.5" />
        <rect width="7" height="7" x="14" y="14" rx="1.5" />
        <rect width="7" height="7" x="3" y="14" rx="1.5" />
      </svg>
    ),
  },
  {
    name: 'Spares',
    href: '/spares',
    id: 'spares',
    renderIcon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: 'Long Arm',
    href: '/long-arm',
    id: 'long-arm',
    renderIcon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19L19 5" />
        <path d="M15 5h4v4" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="5" r="2" />
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [navSmall, setNavSmall] = useState(false);
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

  // Super smooth scroll detection with requestAnimationFrame & gentle hysteresis
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    if (window.scrollY > 50) {
      setNavSmall(true);
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const diff = y - lastY;

          // Always expand when near top of page
          if (y < 40) {
            setNavSmall(false);
          }
          // Smoothly reduce when scrolling down past 50px
          else if (diff > 3 && y > 50) {
            setNavSmall(true);
          }
          // Smoothly expand when intentionally scrolling up
          else if (diff < -8) {
            setNavSmall(false);
          }

          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getActiveIndex = () => {
    if (pathname === '/') return 0;
    if (pathname.startsWith('/aerator-sets')) return 1;
    if (pathname.startsWith('/products')) return 2;
    if (pathname.startsWith('/spares')) return 3;
    if (pathname.startsWith('/long-arm')) return 4;
    return -1;
  };

  const activeIndex = getActiveIndex();

  if (menuOpen) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      style={{
        width: navSmall ? 'calc(100% - 130px)' : 'calc(100% - 24px)',
        maxWidth: navSmall ? '248px' : '440px',
        height: navSmall ? '46px' : '62px',
        transform: 'translate3d(-50%, 0, 0)',
        boxShadow: 'none',
        willChange: 'width, max-width, height, transform',
        transition:
          'width 0.44s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.44s cubic-bezier(0.16, 1, 0.3, 1), height 0.44s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.44s ease',
      }}
      className="lg:hidden fixed bottom-3 left-1/2 z-[56] rounded-full bg-white/95 backdrop-blur-2xl border border-[#D5E3F5] shadow-none grid grid-cols-5 font-poppins p-1 overflow-hidden"
    >
      {/* Sliding Active Pill Indicator - GPU hardware accelerated without layout lag */}
      {activeIndex >= 0 && (
        <div className="absolute inset-1 pointer-events-none" aria-hidden="true">
          <span
            className="absolute top-0 bottom-0 rounded-full bg-[#1450C8] shadow-none"
            style={{
              width: '20%',
              left: 0,
              boxShadow: 'none',
              transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
              transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      )}

      {navTabs.map((tab, idx) => {
        const isActive = activeIndex === idx;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            prefetch={true}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center justify-center rounded-full z-10 transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-[#5B6880] hover:text-[#0B1A33]'
            }`}
          >
            {/* Nav Icon with transform centering */}
            <span
              aria-hidden="true"
              className="flex items-center justify-center flex-none"
              style={{
                width: '20px',
                height: '20px',
                transform: navSmall ? 'translate3d(0, 0, 0) scale(1.05)' : 'translate3d(0, -6px, 0) scale(0.96)',
                transition: 'transform 0.44s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {tab.renderIcon()}
            </span>

            {/* Nav Label - Absolute anchored, fades & glides without reflowing icon */}
            <span
              style={{
                opacity: navSmall ? 0 : 1,
                transform: navSmall ? 'translate3d(0, 6px, 0) scale(0.7)' : 'translate3d(0, 0, 0) scale(1)',
                pointerEvents: 'none',
                transition:
                  'opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.44s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="absolute bottom-1 left-0 right-0 text-center text-[10px] leading-tight font-bold tracking-tight overflow-hidden whitespace-nowrap block"
            >
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
