'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import ProductGrid from '@/components/products/ProductGrid';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import CompareFloatingTray from '@/components/products/CompareFloatingTray';

type CategoryFilter = 'all' | 'motor' | 'gearbox';

interface ProductsClientProps {
  initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<CategoryFilter>(() => {
    if (typeof window !== 'undefined') {
      const cat = new URLSearchParams(window.location.search).get('category');
      if (cat === 'motors' || cat === 'motor') return 'motor';
      if (cat === 'gearboxes' || cat === 'gearbox') return 'gearbox';
    }
    return 'all';
  });

  const [sortBy, setSortBy] = useState<SortOption>('price-low');
  const [inStockOnly, setInStockOnly] = useState(false);

  const { products: liveProducts } = useLiveProducts(initialProducts, {
    skipLoading: true,
  });

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat === 'motors' || cat === 'motor') setCategory('motor');
    else if (cat === 'gearboxes' || cat === 'gearbox') setCategory('gearbox');
    else setCategory('all');
  }, [searchParams]);

  const handleCategorySelect = (cat: CategoryFilter) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') params.delete('category');
    else params.set('category', cat === 'motor' ? 'motors' : 'gearboxes');
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  // Filter products
  const filteredProducts = liveProducts.filter((product) => {
    const isMotorOrGearbox = [
      'motor',
      'motors',
      'worm-gearbox',
      'bevel-gearbox',
      'gearboxes',
    ].includes(product.category as string);
    if (!isMotorOrGearbox) return false;

    if (inStockOnly && product.stock !== undefined && product.stock <= 0) {
      return false;
    }

    if (category === 'all') return true;
    if (category === 'motor') return ['motor', 'motors'].includes(product.category as string);
    if (category === 'gearbox')
      return ['worm-gearbox', 'bevel-gearbox', 'gearboxes'].includes(product.category as string);
    return true;
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

  const categoryTabs: { key: CategoryFilter; label: string; dot: string; activeBg: string }[] = [
    { key: 'all', label: 'All Units', dot: '#0B1A33', activeBg: '#0B1A33' },
    { key: 'motor', label: 'Motors', dot: '#1BA3D9', activeBg: '#0284C7' },
    { key: 'gearbox', label: 'Gearboxes', dot: '#8B6CF0', activeBg: '#7C3AED' },
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; bg: string } | null>(null);

  useEffect(() => {
    const activeBtn = btnRefs.current[category];
    const activeTab = categoryTabs.find((t) => t.key === category);
    if (activeBtn && activeTab) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        bg: activeTab.activeBg,
      });
    }
  }, [category]);

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      {/* Breadcrumb Header */}
      <section className="bg-[#FBFBFB] pt-6 pb-4">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880]">
              <Link href="/" className="hover:text-[#0B1A33]">Home</Link>
              <span>/</span>
              <span className="text-[#0B1A33] font-bold">Motors & Gearboxes</span>
            </nav>
            <h1 className="sr-only">Motors & Gearboxes</h1>
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <div className="sticky top-[60px] sm:top-[72px] z-30 bg-[#FBFBFB]/90 backdrop-blur-md border-b border-[#E3E8F0] py-2.5">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Desktop Count */}
          <span className="text-xs sm:text-sm font-bold text-[#5B6880] hidden sm:inline">
            {sortedProducts.length} models
          </span>

          {/* Right side: Tabs Capsule + Straight Right Filter Dropdown */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            {/* Tabs Capsule with Smooth Traveling Pill */}
            <div
              ref={containerRef}
              className="relative h-11 flex flex-nowrap items-center gap-1 p-1 rounded-full bg-white border border-[#E3E8F0] shadow-2xs overflow-x-auto overflow-y-hidden touch-pan-x overscroll-x-contain no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-[calc(100vw-76px)] sm:max-w-full shrink"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
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

              {categoryTabs.map((t) => {
                const active = category === t.key;
                return (
                  <button
                    key={t.key}
                    ref={(el) => {
                      btnRefs.current[t.key] = el;
                    }}
                    type="button"
                    onClick={() => handleCategorySelect(t.key)}
                    className={`relative z-10 h-9 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 cursor-pointer whitespace-nowrap flex-none shrink-0 select-none ${
                      active ? 'text-white' : 'text-[#3D4A63] hover:text-[#0B1A33]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: active ? '#ffffff' : t.dot }}
                    />
                    <span>{t.label}</span>
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
            backContext="/products"
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
              to check warehouse inventory for specific motor HP or gearbox ratios.
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
