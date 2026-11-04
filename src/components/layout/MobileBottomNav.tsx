'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navTabs = [
  {
    name: 'Home',
    href: '/',
    id: 'home',
    normalIcon: '/icons/menu/home.png',
    colorIcon: '/icons/menu/home-color.png',
  },
  {
    name: 'Aerators',
    href: '/aerator-sets',
    id: 'aerators',
    normalIcon: '/icons/menu/aerators.png',
    colorIcon: '/icons/menu/aerators-color.png',
  },
  {
    name: 'Products',
    href: '/products',
    id: 'products',
    normalIcon: '/icons/menu/products.png',
    colorIcon: '/icons/menu/products.png',
  },
  {
    name: 'Spares',
    href: '/spares',
    id: 'spares',
    normalIcon: '/icons/menu/spares.png',
    colorIcon: '/icons/menu/spares-color.png',
  },
  {
    name: 'Long Arm',
    href: '/long-arm',
    id: 'long-arm',
    normalIcon: '/icons/menu/long-arm.png',
    colorIcon: '/icons/menu/long-arm-color.png',
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenu = (e: any) => {
      if (e?.detail?.open !== undefined) {
        setMenuOpen(e.detail.open);
      }
    };
    window.addEventListener('kt-menu-state', handleMenu);
    window.addEventListener('kt:menu-toggle', handleMenu);
    return () => {
      window.removeEventListener('kt-menu-state', handleMenu);
      window.removeEventListener('kt:menu-toggle', handleMenu);
    };
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
        transform: 'translate3d(-50%, 0, 0)',
        touchAction: 'manipulation',
      }}
      className="lg:hidden fixed bottom-3 left-1/2 z-[56] w-[calc(100%-24px)] max-w-[440px] h-[58px] rounded-full bg-white/95 backdrop-blur-xl border border-[#D5E3F5] shadow-[0_10px_30px_rgba(11,26,51,0.12)] grid grid-cols-5 font-poppins p-1 overflow-hidden"
    >
      {/* Sliding Active Pill Indicator */}
      {activeIndex >= 0 && (
        <div className="absolute inset-1 pointer-events-none" aria-hidden="true">
          <span
            className="absolute top-0 bottom-0 rounded-full bg-[#1450C8] shadow-none"
            style={{
              width: '20%',
              left: 0,
              transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
              transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
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
            className={`relative flex flex-col items-center justify-center rounded-full z-10 transition-colors duration-200 select-none cursor-pointer py-1 ${
              isActive ? 'text-white' : 'text-[#3D4A63] hover:text-[#0B1A33]'
            }`}
          >
            {/* Nav Icon Container */}
            <span
              aria-hidden="true"
              className="flex items-center justify-center flex-none w-5 h-5 -mt-0.5"
            >
              {isActive ? (
                /* When ACTIVATED (clicked): Show normal icon masked in clean white on top of active blue pill */
                <span
                  style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#ffffff',
                    maskImage: `url("${tab.normalIcon}")`,
                    WebkitMaskImage: `url("${tab.normalIcon}")`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                  }}
                />
              ) : (
                /* When NOT ACTIVATED: Show colored icon */
                <img
                  src={tab.colorIcon}
                  alt={tab.name}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain select-none pointer-events-none"
                />
              )}
            </span>

            {/* Nav Label */}
            <span
              className={`text-center text-[10px] leading-tight font-extrabold tracking-tight overflow-hidden whitespace-nowrap block mt-0.5 pointer-events-none ${
                isActive ? 'text-white font-black' : 'text-[#475569]'
              }`}
            >
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
