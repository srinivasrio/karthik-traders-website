'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Brand, Product } from '@/data/products';
import ProductGrid from '@/components/products/ProductGrid';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import BrandFilter from '@/components/products/BrandFilter';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import CompareFloatingTray from '@/components/products/CompareFloatingTray';

interface AeratorSetsClientProps {
  initialProducts: Product[];
}

export default function AeratorSetsClient({ initialProducts }: AeratorSetsClientProps) {
  const searchParams = useSearchParams();
  const brandParam = searchParams.get('brand') as Brand | null;

  const [selectedBrand, setSelectedBrand] = useState<Brand | 'all'>(brandParam || 'all');
  const [sortBy, setSortBy] = useState<SortOption>('price-low');
  const [inStockOnly, setInStockOnly] = useState(false);

  const { products, loading: productsLoading } = useLiveProducts(initialProducts, {
    skipLoading: true,
  });

  useEffect(() => {
    if (brandParam) {
      setSelectedBrand(brandParam);
    }
  }, [brandParam]);

  const handleBrandSelect = (b: Brand | 'all') => {
    setSelectedBrand(b);
    const params = new URLSearchParams(window.location.search);
    if (b === 'all') params.delete('brand');
    else params.set('brand', b);
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const isAerator =
      product.category === 'aerator-set' || product.category === 'aerators';
    if (!isAerator) return false;

    if (inStockOnly && product.stock !== undefined && product.stock <= 0) {
      return false;
    }

    if (selectedBrand === 'all') return true;
    if (selectedBrand === 'custom') {
      return product.brand !== 'aqualion' && product.brand !== 'seaboss';
    }
    return product.brand === selectedBrand;
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
              <span className="text-[#0B1A33] font-bold">Aerator Sets</span>
            </nav>
            <h1 className="sr-only">Aerator Sets</h1>
          </div>
        </div>
      </section>

      {/* Sticky Filter Bar */}
      <BrandFilter
        selectedBrand={selectedBrand as any}
        onSelectBrand={handleBrandSelect}
        showCustom={products.some(
          (p) =>
            (p.category === 'aerator-set' || p.category === 'aerators') &&
            p.brand !== 'aqualion' &&
            p.brand !== 'seaboss' &&
            p.brand !== 'generic'
        )}
        filterAction={<FilterDropdown sortBy={sortBy} onSortChange={setSortBy} />}
      >
        <span className="text-xs sm:text-sm font-bold text-[#5B6880]">
          {sortedProducts.length} of {products.length} models
        </span>
      </BrandFilter>

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
            cardVariant="aerator"
            backContext="/aerator-sets"
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
              Clear your brand/stock filters, or call Hazarathaiah on{' '}
              <a href="tel:+919177657576" className="text-[#4338CA] font-bold">
                +91 91776 57576
              </a>{' '}
              for custom configurations.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('all');
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

      {/* Floating Compare Tray */}
      <CompareFloatingTray />
    </div>
  );
}
