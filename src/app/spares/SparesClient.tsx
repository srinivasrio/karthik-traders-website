'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import ProductGrid from '@/components/products/ProductGrid';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import CompareFloatingTray from '@/components/products/CompareFloatingTray';

type CategoryFilter = 'all' | 'motor-cover' | 'float' | 'fan' | 'frame' | 'rod' | 'kit-box';

interface SparesClientProps {
  initialProducts: Product[];
}

const SPARES_CATEGORIES: { id: CategoryFilter; label: string; activeBg: string }[] = [
  { id: 'all', label: 'All Spares', activeBg: '#0B1A33' },
  { id: 'motor-cover', label: 'Doms & Covers', activeBg: '#EA580C' },
  { id: 'float', label: 'Floats', activeBg: '#0284C7' },
  { id: 'fan', label: 'Fans', activeBg: '#16A34A' },
  { id: 'frame', label: 'Frames', activeBg: '#7C3AED' },
  { id: 'rod', label: 'Fan Rods', activeBg: '#2563EB' },
  { id: 'kit-box', label: 'Kit Boxes', activeBg: '#DB2777' },
];

export default function SparesClient({ initialProducts }: SparesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-low');
  const [inStockOnly, setInStockOnly] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; bg: string } | null>(null);

  const { products: liveProducts } = useLiveProducts(initialProducts, {
    skipLoading: true,
  });

  useEffect(() => {
    const cat = searchParams.get('category');
    if (
      cat &&
      ['motor-cover', 'float', 'fan', 'frame', 'rod', 'kit-box'].includes(cat)
    ) {
      setCategory(cat as CategoryFilter);
    } else {
      setCategory('all');
    }
  }, [searchParams]);

  useEffect(() => {
    const activeBtn = btnRefs.current[category];
    const activeTab = SPARES_CATEGORIES.find((t) => t.id === category);
    if (activeBtn && activeTab) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        bg: activeTab.activeBg,
      });
      if (containerRef.current) {
        containerRef.current.scrollTo({
          left: Math.max(0, activeBtn.offsetLeft - 32),
          behavior: 'smooth',
        });
      }
    }
  }, [category]);

  const handleCategorySelect = (cat: CategoryFilter) => {
    setCategory(cat);
    const targetBtn = btnRefs.current[cat];
    if (targetBtn && containerRef.current) {
      containerRef.current.scrollTo({
        left: Math.max(0, targetBtn.offsetLeft - 32),
        behavior: 'smooth',
      });
    }
    const params = new URLSearchParams(window.location.search);
    if (cat === 'all') params.delete('category');
    else params.set('category', cat);
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  };

  const isSpareCategory = (cat: string) =>
    ['motor-cover', 'float', 'fan', 'frame', 'rod', 'kit-box', 'spares', 'spare'].includes(cat);

  // Filter products
  const filteredProducts = liveProducts.filter((product) => {
    const isSpare = isSpareCategory(product.category as string) || initialProducts.some((p) => p.slug === product.slug);
    if (!isSpare) return false;

    if (inStockOnly && product.stock !== undefined && product.stock <= 0) {
      return false;
    }

    if (category === 'all') return true;
    return product.category === category;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.salePrice - b.salePrice;
      case 'price-high':
        return b.salePrice - a.salePrice;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      {/* Breadcrumb Header */}
      <section className="bg-[#FBFBFB] pt-6 pb-4">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880]">
              <Link href="/" className="hover:text-[#0B1A33]">Home</Link>
              <span>/</span>
              <span className="text-[#0B1A33] font-bold">Spares</span>
            </nav>
            <h1 className="sr-only">Spares</h1>
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[60px] sm:top-[72px] z-30 bg-[#FBFBFB]/90 backdrop-blur-md border-b border-[#E3E8F0] py-2.5">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Desktop Count */}
          <span className="text-xs sm:text-sm font-bold text-[#5B6880] hidden sm:inline">
            {sortedProducts.length} items
          </span>

          {/* Right side: Tabs Capsule + Straight Right Filter Dropdown */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Scrollable Tabs Capsule with Smooth Traveling Pill */}
            <div
              ref={containerRef}
              className="relative h-11 flex flex-nowrap items-center gap-1 p-1 rounded-full bg-white border border-[#E3E8F0] shadow-2xs overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-[calc(100vw-76px)] sm:max-w-full shrink"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Traveling Pill Indicator */}
              {indicator && (
                <span
                  className="absolute top-1 bottom-1 rounded-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-xs"
                  style={{
                    left: `${indicator.left}px`,
                    width: `${indicator.width}px`,
                    backgroundColor: indicator.bg,
                  }}
                />
              )}

              {SPARES_CATEGORIES.map((t) => {
                const active = category === t.id;
                return (
                  <button
                    key={t.id}
                    ref={(el) => {
                      btnRefs.current[t.id] = el;
                    }}
                    type="button"
                    onClick={() => handleCategorySelect(t.id)}
                    className={`relative z-10 h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap flex-none shrink-0 select-none inline-flex items-center justify-center transition-colors duration-200 cursor-pointer ${
                      active
                        ? 'text-white'
                        : 'text-[#3D4A63] hover:text-[#0B1A33]'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Filter Dropdown: Straight Right */}
            <div className="shrink-0">
              <FilterDropdown sortBy={sortBy} onSortChange={setSortBy} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Content Container */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* In-Stock Filter Toggle */}
        <div className="flex items-center justify-end mb-6 pb-3 border-b border-[#E3E8F0] text-xs sm:text-sm font-medium text-[#5B6880]">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0B1A33]">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-[#0B1A33] accent-[#0B1A33] cursor-pointer"
            />
            <span>In stock only</span>
          </label>
        </div>

        {/* Product Grid or Empty State */}
        {sortedProducts.length > 0 ? (
          <ProductGrid
            products={sortedProducts}
            cardVariant="default"
            backContext="/spares"
          />
        ) : (
          <div className="rounded-[28px] border-2 border-dashed border-[#C4D9FF] bg-white p-12 text-center flex flex-col items-center gap-4 my-8">
            <span className="w-14 h-14 rounded-2xl bg-[#E8F9FF] text-[#0B1A33] flex items-center justify-center text-2xl">
              🔍
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1A33] font-poppins">
              Nothing matches those filters
            </h3>
            <p className="text-sm text-[#5B6880] max-w-md leading-relaxed font-medium">
              Call Hazarathaiah on{' '}
              <a href="tel:+919177657576" className="text-[#4338CA] font-bold">
                +91 91776 57576
              </a>{' '}
              for specialized fittings and spares not shown online.
            </p>
            <button
              type="button"
              onClick={() => {
                handleCategorySelect('all');
                setInStockOnly(false);
                setSortBy('price-low');
              }}
              className="mt-2 h-11 px-6 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-sm transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <CompareFloatingTray />
    </div>
  );
}
