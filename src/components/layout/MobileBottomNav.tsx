'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navTabs = [
  { name: 'Home', href: '/', id: 'home', icon: '/assets/nav-home.png' },
  { name: 'Aerators', href: '/aerator-sets', id: 'aerators', icon: '/assets/nav-aerators.png' },
  { name: 'Products', href: '/products', id: 'products', icon: '/assets/nav-products.png' },
  { name: 'Spares', href: '/spares', id: 'spares', icon: '/assets/nav-spares.png' },
  { name: 'Long Arm', href: '/long-arm', id: 'long-arm', icon: '/assets/nav-long-arm.png' },
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
              className="block flex-none"
              style={{
                width: '20px',
                height: '20px',
                transform: navSmall ? 'translate3d(0, 0, 0) scale(1.02)' : 'translate3d(0, -5px, 0) scale(0.96)',
                backgroundColor: 'currentColor',
                WebkitMask: `url(${tab.icon}) center/contain no-repeat`,
                mask: `url(${tab.icon}) center/contain no-repeat`,
                transition: 'transform 0.44s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

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
