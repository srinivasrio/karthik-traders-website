'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

export default function FloatingCart() {
  const { cartCount } = useCart();
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

          if (y < 40) {
            setNavSmall(false);
          } else if (diff > 3 && y > 50) {
            setNavSmall(true);
          } else if (diff < -8) {
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

  // Hide on cart or checkout pages or when reveal menu is open
  if (menuOpen || cartCount === 0 || pathname === '/cart' || pathname === '/bulk-orders') {
    return null;
  }

  return (
    <Link
      href="/cart"
      aria-label={`Shopping cart with ${cartCount} items`}
      style={{
        bottom: navSmall ? '68px' : '88px',
        transition: 'bottom 0.44s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s ease',
      }}
      className="lg:hidden fixed right-4 z-[56] w-[54px] h-[54px] rounded-full bg-[#0D2A5E] text-white grid place-items-center shadow-[0_14px_30px_-10px_rgba(13,42,94,0.6)] active:scale-95 group"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6" />
        <circle cx="9" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
      </svg>
      <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#C5BAFF] text-[#0A1F5C] text-[11px] font-extrabold grid place-items-center border-2 border-white shadow-sm">
        {cartCount}
      </span>
    </Link>
  );
}
