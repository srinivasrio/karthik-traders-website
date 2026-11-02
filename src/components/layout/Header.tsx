'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { aeratorSets, motors, allGearboxes as gearboxes, allSpares as spares, longArmProducts } from '@/data/products';
import { CONTACT_INFO, formatPrice } from '@/data/kt-ui';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAcctOpen, setIsAcctOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);

  const { user, profile, logout } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll shrink / shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = (open?: boolean) => {
    const nextState = open !== undefined ? open : !isMenuOpen;
    setIsMenuOpen(nextState);
    if (nextState) {
      setIsSearchOpen(false);
      setIsAcctOpen(false);
    }
    if (typeof window !== 'undefined') {
      document.body.style.overflow = nextState ? 'hidden' : '';
      window.dispatchEvent(new CustomEvent('kt-menu-state', { detail: { open: nextState } }));
    }
  };

  // Keyboard shortcuts (Cmd+K for search, Esc to close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        toggleMenu(false);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAcctOpen(false);
        toggleMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsAcctOpen(false);
    if (typeof window !== 'undefined') {
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('kt-menu-state', { detail: { open: false } }));
    }
  }, [pathname]);

  // Cart bump effect on cart change
  useEffect(() => {
    if (cartCount > 0) {
      setCartBump(true);
      const timer = setTimeout(() => setCartBump(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  // Combined product catalog for live search
  const allProducts = [
    ...aeratorSets,
    ...motors,
    ...gearboxes,
    ...spares,
    ...longArmProducts,
  ];

  const searchResults = searchQuery.trim()
    ? allProducts
        .filter((p) =>
          (p.name + ' ' + (p.brand || '') + ' ' + (p.category || ''))
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase())
        )
        .slice(0, 8)
    : [];

  const handleSmoothNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMenuOpen(false);
    if (href.startsWith('/#')) {
      e.preventDefault();
      const id = href.replace('/#', '');
      if (pathname === '/') {
        const el = document.getElementById(id);
        if (el) {
          const headerHeight = typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 72;
          const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } else {
        router.push(href);
      }
    }
  };

  const isAdmin =
    profile?.role === 'admin' ||
    user?.user_metadata?.role === 'admin' ||
    user?.email?.includes('admin') ||
    ['+918688566023', '+916301183738', '+919515816084', '8688566023', '6301183738', '9515816084'].includes(
      (profile?.mobile || user?.phone || '').replace(/\s+/g, '')
    );
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <>
      <div className={pathname === '/' ? 'hidden' : pathname === '/compare' ? 'h-[52px] sm:h-[72px]' : 'h-[60px] sm:h-[72px]'} />
      <header
        className={`fixed top-0 left-0 right-0 z-[70] transition-all duration-300 font-manrope ${
          pathname === '/compare'
            ? 'bg-transparent md:bg-[#FBFBFB]/92 md:backdrop-blur-md border-b-0 md:border-b md:border-[#E3E8F0]'
            : isScrolled
            ? 'bg-[#FBFBFB]/92 backdrop-blur-md shadow-sm border-b border-[#E3E8F0]'
            : 'bg-[#FBFBFB]/85 backdrop-blur-md border-b border-[#E3E8F0]/70'
        }`}
      >
        {/* Mobile View specifically for /compare page matching reference image */}
        {pathname === '/compare' && (
          <div className="md:hidden max-w-[1320px] mx-auto h-[52px] px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/aerator-sets');
                }
              }}
              className="w-9 h-9 -ml-1 flex items-center justify-center text-[#0B1A33] active:scale-95"
              aria-label="Go back"
            >
              <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="font-poppins font-black text-lg sm:text-xl text-[#0B1A33] tracking-tight">
              Compare Aerators
            </h1>
            <div className="w-8" />
          </div>
        )}

        <div className={`${pathname === '/compare' ? 'hidden md:flex' : 'flex'} max-w-[1320px] mx-auto h-[60px] sm:h-[72px] px-4 sm:px-6 lg:px-8 items-center justify-between gap-4`}>
          {/* Logo & Brand Name */}
          <Link
            href="/"
            aria-label="Karthik Traders home"
            className="flex items-center gap-2 sm:gap-2.5 flex-none group text-decoration-none"
            onClick={(e) => handleSmoothNav(e, '/')}
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-none">
              <Image
                src="/assets/logo-emblem.png"
                alt="Karthik Traders emblem"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-poppins font-extrabold text-base sm:text-xl lg:text-2xl tracking-tight text-[#0A1F5C] whitespace-nowrap leading-none">
              KARTHIK TRADERS
            </span>
          </Link>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 font-semibold text-sm text-[#334155]">
            <Link href="/" className="hover:text-[#1D64EC] transition-colors">
              Home
            </Link>
            <Link href="/aerator-sets" className="hover:text-[#1D64EC] transition-colors">
              Aerators
            </Link>
            <Link href="/spares" className="hover:text-[#1D64EC] transition-colors">
              Spare Parts
            </Link>
            <div className="relative py-1">
              <Link
                href="/compare"
                className={pathname === '/compare' ? 'text-[#1D64EC] font-bold' : 'hover:text-[#1D64EC] transition-colors'}
              >
                Compare
              </Link>
              {pathname === '/compare' && (
                <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#1D64EC] rounded-full" />
              )}
            </div>
            <Link href="/#about" className="hover:text-[#1D64EC] transition-colors">
              About
            </Link>
            <Link href="/#contact" className="hover:text-[#1D64EC] transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Action Icons, Auth & Desktop/Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Desktop Compare Search & Cart Icons matching reference image */}
            {pathname === '/compare' ? (
              <div className="hidden sm:flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search products"
                  className="w-10 h-10 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] flex items-center justify-center transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>

                <Link
                  href="/cart"
                  aria-label="View cart"
                  className="w-10 h-10 rounded-full bg-[#1D64EC] hover:bg-[#1554C8] text-white flex items-center justify-center shadow-md shadow-blue-500/25 relative transition-all active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6" />
                    <circle cx="9" cy="20" r="1.3" fill="currentColor" />
                    <circle cx="17" cy="20" r="1.3" fill="currentColor" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            ) : null}

            {/* Desktop Cart Button (For non-compare routes) */}
            {pathname !== '/compare' && (
              <Link
                href="/cart"
                aria-label="View shopping cart"
                className="hidden sm:flex items-center gap-2 h-10 px-3.5 rounded-full border border-[#E3E8F0] bg-white text-[#0B1A33] font-bold text-xs md:text-sm hover:bg-[#E8F9FF] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6" />
                  <circle cx="9" cy="20" r="1.3" />
                  <circle cx="17" cy="20" r="1.3" />
                </svg>
                <span>Cart</span>
                <span
                  className={`min-w-5 h-5 px-1.5 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-[11px] grid place-items-center transition-transform duration-200 ${
                    cartBump ? 'scale-125' : 'scale-100'
                  }`}
                >
                  {cartCount}
                </span>
              </Link>
            )}

            {/* Admin Panel Button (ONLY for verified admins) */}
            {isAdmin && pathname !== '/compare' && (
              <Link
                href="/admin"
                aria-label="Navigate to Admin Panel"
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-linear-to-r from-purple-700 via-indigo-600 to-indigo-700 text-white font-extrabold text-xs md:text-sm hover:from-purple-800 hover:to-indigo-800 shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span>Admin Panel</span>
              </Link>
            )}

            {/* User Account / Login State & Menu (hidden on /compare to match reference) */}
            {pathname !== '/compare' && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAcctOpen(!isAcctOpen)}
                      className="h-10 pl-1.5 pr-3 rounded-full border border-[#E3E8F0] bg-white flex items-center gap-2 font-bold text-xs text-[#0B1A33] hover:bg-[#E8F9FF] transition-all cursor-pointer"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#C5BAFF] text-[#0B1A33] font-extrabold text-xs grid place-items-center">
                        {userInitials}
                      </span>
                      <span className="hidden md:inline max-w-[100px] truncate">
                        {profile?.full_name?.split(' ')[0] || 'Account'}
                      </span>
                      <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {/* Account Dropdown */}
                    {isAcctOpen && (
                      <div className="absolute right-0 top-12 w-52 bg-white border border-[#E3E8F0] rounded-2xl shadow-xl p-1.5 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                          <div className="text-xs font-bold text-[#0B1A33] truncate">
                            {profile?.full_name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate font-mono">
                            {profile?.mobile || user.phone || (user.email && !user.email.endsWith('@karthiktraders.com') ? user.email : '')}
                          </div>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setIsAcctOpen(false)}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-[#0B1A33] hover:bg-[#E8F9FF] transition-colors"
                        >
                          Dashboard & Orders
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsAcctOpen(false)}
                            className="px-3 py-2 rounded-xl text-xs font-bold text-[#4338CA] bg-[#F1EEFF] hover:bg-[#E0D8FF] transition-colors flex items-center justify-between"
                          >
                            <span>Admin Panel</span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#C5BAFF] text-[#0B1A33]">
                              ADMIN
                            </span>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAcctOpen(false);
                            setIsLogoutModalOpen(true);
                          }}
                          className="text-left px-3 py-2 rounded-xl text-xs font-bold text-[#B4123A] hover:bg-[#FFF1F4] transition-colors cursor-pointer"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex items-center h-10 px-5 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-xs hover:bg-[#24365A] hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    Login
                  </Link>
                )}

                {/* Menu Button (Desktop & Mobile with 3 Animated Hamburger Lines) */}
                <button
                  type="button"
                  onClick={() => toggleMenu()}
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                  className="w-10 h-10 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 group"
                >
                  <span className="flex flex-col justify-between items-center w-4 h-3.5 relative">
                    <span
                      className={`w-4 h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                        isMenuOpen ? 'rotate-45 translate-y-[6px]' : ''
                      }`}
                    />
                    <span
                      className={`w-4 h-0.5 bg-current rounded-full transition-all duration-200 ${
                        isMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                      }`}
                    />
                    <span
                      className={`w-4 h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                        isMenuOpen ? '-rotate-45 -translate-y-[6px]' : ''
                      }`}
                    />
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Reveal Animation Menu Panel (Desktop & Mobile) */}
      <div
        data-menu-panel="1"
        aria-hidden={!isMenuOpen}
        className={`fixed inset-x-0 top-[60px] sm:top-[72px] bottom-0 z-[65] bg-[#FBFBFB] overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.25,0.85,0.3,1)] ${
          isMenuOpen
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{
          clipPath: isMenuOpen
            ? 'circle(2400px at calc(100% - 60px) 36px)'
            : 'circle(0px at calc(100% - 60px) 36px)',
          willChange: 'clip-path',
        }}
      >
        <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-32 sm:pb-24">
          {/* Panel Header Bar */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#E3E8F0]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1450C8] animate-pulse flex-none" />
              <span className="text-xs font-extrabold tracking-widest text-[#5B6880] uppercase truncate">
                Store Menu
              </span>
            </div>

            {/* Login / Admin Button at Top Right inside Menu Section (Mobile & Desktop) */}
            <div className="flex items-center gap-2 flex-none ml-auto">
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="h-9 px-3 rounded-full bg-linear-to-r from-purple-700 to-indigo-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm hover:opacity-95"
                >
                  <svg className="w-3.5 h-3.5 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Admin</span>
                </Link>
              )}
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="h-9 px-4 rounded-full bg-[#1450C8] text-white font-extrabold text-xs inline-flex items-center gap-2 hover:bg-[#0F42A8] transition-colors shadow-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 grid place-items-center text-[10px]">
                    {userInitials}
                  </span>
                  <span>Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="h-9 px-4 sm:px-5 rounded-full bg-[#1450C8] text-white font-extrabold text-xs inline-flex items-center gap-1.5 hover:bg-[#0F42A8] transition-colors shadow-sm"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>

          {/* Menu Body: Options List on Left & Call Buttons on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-6">
            {/* Options List matching image (without descriptions) */}
            <div
              className={`lg:col-span-7 flex flex-col gap-2 transition-all duration-500 ease-out ${
                isMenuOpen ? 'opacity-100 translate-y-0 delay-100' : 'opacity-0 translate-y-4'
              }`}
            >
              {[
                { name: 'Aerator Sets', href: '/aerator-sets' },
                { name: 'Motors', href: '/products?category=motors' },
                { name: 'Gearboxes', href: '/products?category=gearboxes' },
                { name: 'Spares & Fittings', href: '/spares' },
                { name: 'Long Arm Systems', href: '/long-arm' },
                { name: 'Compare Aerators', href: '/compare', badge: 'Compare' },
              ].map((item) => {
                const isActive =
                  (item.href === '/aerator-sets' && pathname.startsWith('/aerator-sets')) ||
                  (item.href === '/spares' && pathname.startsWith('/spares')) ||
                  (item.href === '/long-arm' && pathname.startsWith('/long-arm')) ||
                  (item.href === '/compare' && pathname === '/compare');

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleSmoothNav(e, item.href)}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all group flex items-center justify-between ${
                      isActive
                        ? 'bg-[#EBF7FF] text-[#1450C8]'
                        : 'hover:bg-[#EBF7FF] text-[#0B1A33] hover:text-[#1450C8]'
                    }`}
                  >
                    <span className="font-extrabold text-base sm:text-lg font-poppins">
                      {item.name}
                    </span>

                    {item.badge ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#C5BAFF] text-[#0B1A33] shadow-2xs">
                        <span className="text-[10px]">★</span>
                        <span>{item.badge}</span>
                      </span>
                    ) : (
                      <span
                        className={`text-base transition-all ${
                          isActive
                            ? 'text-[#1450C8] translate-x-0.5'
                            : 'text-slate-300 group-hover:text-[#1450C8] group-hover:translate-x-1'
                        }`}
                      >
                        →
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Direct Farmer Helplines & Call Buttons */}
            <div
              className={`lg:col-span-5 flex flex-col gap-3.5 transition-all duration-500 ease-out ${
                isMenuOpen ? 'opacity-100 translate-y-0 delay-150' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#E3E8F0]">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5B6880]">
                  Farmer Support & Orders
                </span>
                <span className="text-[10px] font-mono font-bold text-[#8A4B00] bg-[#FFF1D6] px-2 py-0.5 rounded-full">
                  Direct Dial
                </span>
              </div>

              {/* Sales Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#C4D9FF] shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#5B6880] uppercase tracking-wider">
                    Sales & Wholesale
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E8F9FF] text-[#1450C8]">
                    Sets & Motors
                  </span>
                </div>
                <div className="font-extrabold text-base text-[#0B1A33]">Karthik</div>
                <div className="font-mono text-xs font-bold text-[#1450C8]">+91 86885 66023</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <a
                    href={CONTACT_INFO.sales.tel}
                    className="h-9 rounded-full bg-[#1450C8] hover:bg-[#0F42A8] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Call Sales</span>
                  </a>
                  <a
                    href={CONTACT_INFO.sales.wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 rounded-full bg-[#E3F7EE] hover:bg-[#D0F2E3] text-[#0B7A4B] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Spares Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#C4D9FF] shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#5B6880] uppercase tracking-wider">
                    Spares & Service
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E8F9FF] text-[#1450C8]">
                    Technical
                  </span>
                </div>
                <div className="font-extrabold text-base text-[#0B1A33]">Hazarathaiah</div>
                <div className="font-mono text-xs font-bold text-[#1450C8]">+91 91776 57576</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <a
                    href={CONTACT_INFO.support.tel}
                    className="h-9 rounded-full bg-[#1450C8] hover:bg-[#0F42A8] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Call Tech</span>
                  </a>
                  <a
                    href={CONTACT_INFO.support.wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 rounded-full bg-[#E3F7EE] hover:bg-[#D0F2E3] text-[#0B7A4B] font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                  >
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Timings */}
              <div className="p-3.5 rounded-2xl bg-[#F0F4FA] border border-[#E3E8F0] flex flex-col gap-1 text-xs">
                <span className="font-extrabold text-[#0B1A33]">Store Hours</span>
                <span className="text-[#5B6880] font-medium leading-relaxed">
                  Mon – Sat: 8:00 AM – 8:00 PM <br />
                  Sun: 8:00 AM – 2:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[80] bg-[#0B1A33]/30 backdrop-blur-sm flex justify-center p-4 pt-20 animate-in fade-in duration-200"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl self-start bg-[#FBFBFB] rounded-3xl border border-[#E3E8F0] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E3E8F0]">
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search aerators, motors, gearboxes, spares…"
                className="flex-1 bg-transparent border-0 outline-none text-[#0B1A33] text-base placeholder-gray-400 font-medium"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="border border-[#E3E8F0] bg-white rounded-lg font-mono text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-3 flex flex-col gap-1">
              {searchResults.length > 0 ? (
                searchResults.map((r) => {
                  const cat = (r.category || '').toLowerCase();
                  const href = cat.includes('aerator')
                    ? `/aerator-sets/${r.slug}`
                    : cat.includes('spare')
                    ? `/spares/${r.slug}`
                    : cat.includes('long-arm')
                    ? `/long-arm/${r.slug}`
                    : `/products/${r.slug}`;

                  return (
                    <Link
                      key={r.slug}
                      href={href}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#E8F9FF] transition-colors text-[#0B1A33]"
                    >
                      <span className="w-10 h-10 rounded-xl bg-[#E8F9FF] text-[#1450C8] font-bold text-xs grid place-items-center flex-none">
                        {r.brand?.slice(0, 3).toUpperCase() || 'KT'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-[#0B1A33] truncate">{r.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{r.category} · {r.brand}</div>
                      </div>
                      <span className="font-extrabold text-sm text-[#0B1A33]">
                        {formatPrice(r.salePrice)}
                      </span>
                    </Link>
                  );
                })
              ) : searchQuery.trim() ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No products match &ldquo;{searchQuery}&rdquo;. Call{' '}
                  <a href="tel:+919177657576" className="text-[#1450C8] font-bold">
                    +91 91776 57576
                  </a>{' '}
                  for custom or unlisted spares.
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">
                  Type to search across all 40+ products, motors and genuine spares.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[90] bg-[#0B1A33]/40 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#FBFBFB] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FFE4EA] text-[#B4123A] grid place-items-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h11" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-[#0B1A33] mb-1 font-poppins">
              Log out of Karthik Traders?
            </h3>
            <p className="text-xs text-[#5B6880] mb-5 leading-relaxed">
              Your cart items remain saved on this device.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="h-10 px-4 rounded-full border border-[#D5DCE8] bg-white font-extrabold text-xs text-[#0B1A33] hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setIsLogoutModalOpen(false);
                }}
                className="h-10 px-5 rounded-full bg-[#D61F4A] hover:bg-[#B4123A] text-white font-extrabold text-xs cursor-pointer shadow-xs"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
