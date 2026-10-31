'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, formatPrice, calculateSavings, getProductBySlug } from '@/data/products';
import { useCart } from '@/context/CartContext';
import ImageModal from '@/components/ui/ImageModal';
import ProductCard from '@/components/products/ProductCard';
import CompareFloatingTray from '@/components/products/CompareFloatingTray';

interface ProductDetailViewProps {
  product: Product;
  categoryTitle: string;
  categoryHref: string;
  relatedProducts?: Product[];
}

export default function ProductDetailView({
  product,
  categoryTitle,
  categoryHref,
  relatedProducts = [],
}: ProductDetailViewProps) {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    components: true,
    specs: true,
    features: false,
  });

  const [inCompare, setInCompare] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('kt_compare');
        if (stored) {
          const list = JSON.parse(stored);
          return Array.isArray(list) && list.includes(product.slug);
        }
      } catch { }
    }
    return false;
  });

  const toggleCompare = () => {
    try {
      const stored = localStorage.getItem('kt_compare');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];

      if (list.includes(product.slug)) {
        list = list.filter((s) => s !== product.slug);
        setInCompare(false);
      } else {
        if (list.length >= 2) {
          list = [list[1], product.slug];
        } else {
          list.push(product.slug);
        }
        setInCompare(true);
      }
      localStorage.setItem('kt_compare', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_compare' }));
    } catch { }
  };

  const images = product.images && product.images.length > 0 ? product.images : ['/images/placeholder.png'];
  const savings = calculateSavings(product.mrp, product.salePrice);
  const cartItem = cartItems.find((item) => item.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const isLimitedStock = product.stock !== undefined && product.stock > 0 && product.stock <= 3;
  const isAerator = product.category === 'aerator-set' || product.category === 'aerators';
  const modelNumber =
    product.specifications?.['Model number'] ||
    product.specifications?.['Model Number'] ||
    product.model ||
    product.name?.match(/\(([^)]+)\)/)?.[1] ||
    '';

  // Extract original components data, falling back to static product catalog
  const staticFallback = getProductBySlug(product.slug);
  const rawComponents =
    product.components && product.components.length > 0
      ? product.components
      : (product.specifications as any)?.components && Array.isArray((product.specifications as any).components)
        ? (product.specifications as any).components
        : staticFallback?.components || [];

  interface ComponentEntry {
    item: string;
    spec: string;
    quantity: string | number;
  }

  const componentsList: ComponentEntry[] = rawComponents.map((comp: any) => ({
    item: String(comp.item || comp.name || 'Component'),
    spec: String(comp.spec || comp.specification || ''),
    quantity: comp.quantity !== undefined && comp.quantity !== null && comp.quantity !== '' ? comp.quantity : '—',
  }));

  const togglePanel = (key: string) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const waHref = `https://wa.me/918688566023?text=${encodeURIComponent(
    `Hello Karthik Traders, I am interested in: ${product.name} (₹${product.salePrice}). Please share availability and delivery estimate to my location.`
  )}`;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880] mb-6"
        >
          <Link href="/" className="hover:text-[#0B1A33]">Home</Link>
          <span>/</span>
          <Link href={categoryHref} className="hover:text-[#0B1A33]">{categoryTitle}</Link>
          <span>/</span>
          <span className="text-[#0B1A33] font-bold truncate max-w-xs sm:max-w-md">{product.name}</span>
        </nav>

        {/* 2-Column Product Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Main Image Box */}
            <div className="relative aspect-square w-full rounded-[32px] overflow-hidden bg-transparent border-0 shadow-none flex items-center justify-center p-4 sm:p-6">
              {/* Badges on Image */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
                {(product as any).isBestSeller && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#4F46E5] text-white text-xs font-extrabold shadow-sm">
                    ★ Best Selling
                  </span>
                )}
                {product.brand === 'aqualion' && (
                  <span className="px-3 py-1 rounded-full bg-white/95 text-[#8A4B00] text-xs font-extrabold shadow-xs">
                    Double Warranty
                  </span>
                )}
              </div>

              {/* Zoom Button */}
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                aria-label="Open image zoom"
                className="absolute top-4 right-4 z-10 h-10 px-4 rounded-full bg-white/90 backdrop-blur-md text-[#0B1A33] font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-white transition-colors cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                </svg>
                <span>Zoom</span>
              </button>

              {/* Display Image - Mixed seamlessly with background without rectangular borders */}
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                style={{
                  mixBlendMode: 'multiply',
                  WebkitMaskImage: 'radial-gradient(ellipse 96% 96% at 50% 50%, black 78%, transparent 100%)',
                  maskImage: 'radial-gradient(ellipse 96% 96% at 50% 50%, black 78%, transparent 100%)',
                }}
                className="w-full h-full object-contain select-none transition-all duration-300"
              />

              {/* Image Carousel Steppers */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full shadow-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
                    }
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-[#0B1A33] hover:bg-black/5 cursor-pointer"
                  >
                    ‹
                  </button>
                  <span className="font-mono text-xs font-bold text-[#0B1A33] px-2">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev + 1) % images.length)
                    }
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-[#0B1A33] hover:bg-black/5 cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-white/70 border-2 shrink-0 p-2 transition-all cursor-pointer ${i === currentImageIndex
                        ? 'border-[#0B1A33] ring-2 ring-[#0B1A33]/20'
                        : 'border-[#E3E8F0] opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={img}
                      alt=""
                      style={{ mixBlendMode: 'multiply' }}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Product Info */}
          <div className="lg:col-span-6 flex flex-col gap-5 lg:sticky lg:top-24">
            {/* Meta Tags: Brand, Model & Stock */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F9FF] text-[#0B5C86] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#0B5C86]" />
                {product.brand === 'aqualion' ? 'Aqualion' : product.brand === 'seaboss' ? 'Sea Boss' : 'Heavy Duty'}
              </span>

              {modelNumber && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F1FF] text-[#1450C8] border border-[#CDE0FF]">
                  <span className="text-[9px] uppercase font-bold text-[#64748B]">Model</span>
                  <span className="text-[#0B1A33] font-black">{modelNumber}</span>
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full uppercase tracking-wider ${isOutOfStock
                    ? 'bg-[#FEE2E2] text-[#B91C1C]'
                    : isLimitedStock
                      ? 'bg-[#FEF3C7] text-[#92400E]'
                      : 'bg-[#DCFCE7] text-[#15803D]'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-[#B91C1C]' : isLimitedStock ? 'bg-[#92400E]' : 'bg-[#15803D]'
                    }`}
                />
                {isOutOfStock ? 'Out of Stock' : isLimitedStock ? 'Limited Stock' : 'In Stock'}
              </span>

              {product.specifications?.hp && (
                <span className="font-mono text-xs text-[#5B6880] px-2 py-0.5 rounded-md bg-[#EEF2F8]">
                  {product.specifications.hp}
                </span>
              )}
            </div>

            {/* Model Number Hero Highlight if aerator */}
            {modelNumber && isAerator && (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#64748B]">Model:</span>
                <span className="text-xl sm:text-2xl font-black font-poppins text-[#0A2540] tracking-tight bg-[#EEF4FF] px-3.5 py-1 rounded-xl border border-[#CDE0FF]">
                  {modelNumber}
                </span>
              </div>
            )}

            {/* Title - Compact & refined to prevent clutter */}
            <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-[#0B1A33] tracking-tight font-poppins leading-snug">
              {product.name}
            </h1>

            {/* Price & Primary Action Card */}
            <div className="p-4 sm:p-6 rounded-[24px] bg-white border border-[#E3E8F0] shadow-sm flex flex-col gap-4">
              {/* Primary Section: Price, Add to Cart & Compare structured side-by-side */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 pb-4 border-b border-[#EEF2F8]">
                {/* Price Info */}
                <div className="flex flex-col">
                  <div className="flex items-baseline flex-wrap gap-2 sm:gap-2.5">
                    <span className="text-2xl sm:text-3xl lg:text-3xl font-extrabold text-[#0B1A33] tracking-tight font-poppins">
                      {formatPrice(product.salePrice)}
                    </span>
                    {product.mrp > product.salePrice && (
                      <span className="text-xs sm:text-sm text-[#7C879C] line-through font-medium">
                        MRP {formatPrice(product.mrp)}
                      </span>
                    )}
                  </div>
                  {product.mrp > product.salePrice && (
                    <span className="text-[11px] sm:text-xs font-extrabold text-[#0B7A4B] mt-0.5">
                      You save {formatPrice(product.mrp - product.salePrice)} ({Math.round(((product.mrp - product.salePrice) / product.mrp) * 100)}%)
                    </span>
                  )}
                </div>

                {/* Buttons side-by-side: Add to Cart & Compare */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-2.5 w-full md:w-auto">
                  {/* Add to Cart button */}
                  <div className="w-full md:w-auto">
                    {cartQty > 0 ? (
                      <div className="h-11 sm:h-12 rounded-full bg-[#1450C8] text-white flex items-center justify-between px-3 shadow-xs md:min-w-[140px]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, cartQty - 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-extrabold hover:bg-white/20 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="font-mono text-xs sm:text-sm font-extrabold px-1.5">
                          {cartQty} in Cart
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, cartQty + 1)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-extrabold hover:bg-white/20 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            slug: product.slug,
                            name: product.name,
                            model: product.model || product.name,
                            price: product.salePrice,
                            salePrice: product.salePrice,
                            mrp: product.mrp,
                            quantity: 1,
                            image: images[0],
                            images: images,
                            brand: product.brand,
                            category: product.category,
                          } as any)
                        }
                        className="w-full md:w-auto h-11 sm:h-12 px-4 sm:px-6 rounded-full bg-[#1450C8] hover:bg-[#0B3A99] text-white font-extrabold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span className="whitespace-nowrap">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                      </button>
                    )}
                  </div>

                  {/* Compare Button */}
                  {isAerator && (
                    <button
                      type="button"
                      onClick={toggleCompare}
                      className={`w-full md:w-auto h-11 sm:h-12 px-3 sm:px-5 rounded-full border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${inCompare
                          ? 'border-[#4338CA] bg-[#EEF2FF] text-[#4338CA] shadow-xs'
                          : 'border-[#CBD5E1] bg-white text-[#334155] hover:border-[#0B1A33] hover:text-[#0B1A33]'
                        }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${inCompare ? 'border-[#4338CA] bg-[#4338CA] text-white' : 'border-[#94A3B8]'}`}>
                        {inCompare ? '✓' : ''}
                      </span>
                      <span>{inCompare ? 'Compared' : 'Compare'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Direct Inquiries: WhatsApp & Call Sales side by side with EQUAL button sizes */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 sm:h-12 px-2 sm:px-4 rounded-full bg-[#E7F7EE] hover:bg-[#D5F1E1] text-[#0E6B39] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border border-[#BDE5CF] transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-[#25D366] shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.815 2.786.815 3.181 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.766-5.763-5.766zm9.969 5.766c0 5.518-4.482 10-10 10-1.749 0-3.388-.452-4.819-1.242l-5.181 1.358 1.385-5.056c-.872-1.488-1.385-3.228-1.385-5.06 0-5.518 4.482-10 10-10 5.518 0 10 4.482 10 10z" />
                  </svg>
                  <span className="truncate">Enquire on WhatsApp</span>
                </a>

                <a
                  href="tel:+918688566023"
                  className="h-11 sm:h-12 px-2 sm:px-4 rounded-full bg-white hover:bg-[#F8FAFD] text-[#0B1A33] font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border border-[#CBD5E1] transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0 text-[#1450C8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span className="truncate">Call Sales</span>
                </a>
              </div>
            </div>

            {/* Warranty Callout Banner */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#E3F7EE] text-[#0A4D31]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0B7A4B"
                strokeWidth="2.2"
                className="shrink-0 mt-0.5"
              >
                <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6zM8.5 12l2.5 2.5 4.5-5" />
              </svg>
              <div className="text-xs sm:text-sm leading-relaxed font-semibold">
                {product.warranty ||
                  '1 Year Comprehensive Factory Warranty with genuine spares support from Karthik Traders Nellore.'}
              </div>
            </div>

            {/* Accordion Panels */}
            <div className="flex flex-col border-t border-[#E3E8F0]">
              {/* Components Panel (for aerators) */}
              {isAerator && componentsList.length > 0 && (
                <div className="border-b border-[#E3E8F0]">
                  <button
                    type="button"
                    onClick={() => togglePanel('components')}
                    className="w-full flex justify-between items-center py-4 font-extrabold text-base text-[#0B1A33] text-left cursor-pointer"
                  >
                    <span>Included Components & Parts ({componentsList.length})</span>
                    <span className="w-7 h-7 rounded-full bg-[#E8F9FF] flex items-center justify-center text-sm font-bold">
                      {openPanels.components ? '−' : '+'}
                    </span>
                  </button>

                  {openPanels.components && (
                    <div className="pb-4 animate-[ktFade_0.3s_both]">
                      <div className="rounded-2xl border border-[#E3E8F0] overflow-hidden bg-white text-xs sm:text-sm shadow-xs">
                        <div className="grid grid-cols-12 p-3 font-extrabold bg-[#F8FAFC] border-b border-[#E3E8F0] text-[#5B6880]">
                          <span className="col-span-5 sm:col-span-4">Component</span>
                          <span className="col-span-5 sm:col-span-6">Specification</span>
                          <span className="col-span-2 text-right">Qty</span>
                        </div>
                        <div className="divide-y divide-[#EEF2F8]">
                          {componentsList.map((comp, idx) => (
                            <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-[#F8FAFD]/60">
                              <span className="col-span-5 sm:col-span-4 font-bold text-[#0B1A33]">
                                {comp.item}
                              </span>
                              <span className="col-span-5 sm:col-span-6 text-[#5B6880] text-xs sm:text-sm leading-snug">
                                {comp.spec || 'Standard Specification'}
                              </span>
                              <span className="col-span-2 text-right font-mono font-bold text-[#0B1A33]">
                                {comp.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Technical Specifications Panel */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="border-b border-[#E3E8F0]">
                  <button
                    type="button"
                    onClick={() => togglePanel('specs')}
                    className="w-full flex justify-between items-center py-4 font-extrabold text-base text-[#0B1A33] text-left cursor-pointer"
                  >
                    <span>Technical Specifications</span>
                    <span className="w-7 h-7 rounded-full bg-[#E8F9FF] flex items-center justify-center text-sm font-bold">
                      {openPanels.specs ? '−' : '+'}
                    </span>
                  </button>

                  {openPanels.specs && (
                    <div className="pb-4 animate-[ktFade_0.3s_both] flex flex-col gap-4">
                      {/* General Technical Parameters */}
                      <div className="rounded-2xl border border-[#E3E8F0] overflow-hidden bg-white text-xs sm:text-sm shadow-xs">
                        <div className="divide-y divide-[#EEF2F8]">
                          {Object.entries(product.specifications)
                            .filter(([key]) => {
                              const k = key.toLowerCase();
                              // Filter out internal keys and components (which are rendered in dedicated structured component table below)
                              return !['features', 'images', 'brand', 'category', 'model', 'components'].includes(k);
                            })
                            .map(([key, val]) => {
                              const displayVal = Array.isArray(val)
                                ? val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ')
                                : typeof val === 'object' && val !== null
                                  ? JSON.stringify(val)
                                  : String(val);

                              return (
                                <div key={key} className="grid grid-cols-12 p-3 items-center hover:bg-[#F8FAFD]/50">
                                  <span className="col-span-5 sm:col-span-4 font-bold text-[#0B1A33] capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                  </span>
                                  <span className="col-span-7 sm:col-span-8 font-mono text-[#3D4A63] text-xs sm:text-sm">
                                    {displayVal}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Original Components & Parts Breakdown inside Technical Specifications */}
                      {componentsList.length > 0 && (
                        <div className="rounded-2xl border border-[#D5E3F5] overflow-hidden bg-white shadow-xs">
                          <div className="p-3 bg-[#EEF5FF] border-b border-[#D5E3F5] flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-extrabold text-[#0B3A99] uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#1450C8]" />
                              Original Aerator Components & Assemblies ({componentsList.length} Items)
                            </span>
                          </div>
                          <div className="grid grid-cols-12 p-2.5 font-extrabold bg-[#F8FAFC] border-b border-[#EEF2F8] text-[11px] sm:text-xs text-[#5B6880]">
                            <span className="col-span-5 sm:col-span-4">Component Item</span>
                            <span className="col-span-5 sm:col-span-6">Technical Specification</span>
                            <span className="col-span-2 text-right">Quantity</span>
                          </div>
                          <div className="divide-y divide-[#EEF2F8] text-xs sm:text-sm">
                            {componentsList.map((comp, idx) => (
                              <div key={idx} className="grid grid-cols-12 p-2.5 sm:p-3 items-center hover:bg-[#F8FAFD]/60">
                                <span className="col-span-5 sm:col-span-4 font-bold text-[#0B1A33] text-[11.5px] sm:text-xs">
                                  {comp.item}
                                </span>
                                <span className="col-span-5 sm:col-span-6 text-[#5B6880] text-[11px] sm:text-xs leading-snug">
                                  {comp.spec || 'Factory Standard'}
                                </span>
                                <span className="col-span-2 text-right font-mono font-bold text-[#0B1A33] text-xs sm:text-sm">
                                  {comp.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Features Panel */}
              {product.features && product.features.length > 0 && (
                <div className="border-b border-[#E3E8F0]">
                  <button
                    type="button"
                    onClick={() => togglePanel('features')}
                    className="w-full flex justify-between items-center py-4 font-extrabold text-base text-[#0B1A33] text-left cursor-pointer"
                  >
                    <span>Key Features & Engineering</span>
                    <span className="w-7 h-7 rounded-full bg-[#E8F9FF] flex items-center justify-center text-sm font-bold">
                      {openPanels.features ? '−' : '+'}
                    </span>
                  </button>

                  {openPanels.features && (
                    <div className="pb-4 animate-[ktFade_0.3s_both]">
                      <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#3D4A63] font-medium leading-relaxed">
                        {product.features.map((feat, i) => (
                          <li key={i}>{feat}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="pt-16 sm:pt-24">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-extrabold tracking-widest text-[#4338CA] uppercase mb-1">
                  RECOMMENDED
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins">
                  Related {categoryTitle}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              {relatedProducts.slice(0, 4).map((rel) => (
                <ProductCard key={rel.id} product={rel} variant={isAerator ? 'aerator' : 'default'} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fullscreen Zoom Lightbox Modal */}
      <ImageModal
        isOpen={isZoomOpen}
        images={images}
        initialIndex={currentImageIndex}
        onClose={() => setIsZoomOpen(false)}
      />

      {/* Floating Compare Tray */}
      <CompareFloatingTray />
    </div>
  );
}
