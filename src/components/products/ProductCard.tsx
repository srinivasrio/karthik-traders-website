'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { BRAND_CONFIG, resolveBrandMeta, formatPrice, getStockStatus } from '@/data/kt-ui';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  hideFeatures?: boolean;
  hideCompare?: boolean;
  variant?: 'default' | 'aerator' | string;
  priority?: boolean;
  onAddToCart?: (product: Product) => void;
  backContext?: string;
}

export default function ProductCard({
  product,
  compact = false,
  hideFeatures = false,
  hideCompare = false,
  variant,
  priority,
  onAddToCart,
  backContext,
}: ProductCardProps) {
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  const cartItem = cartItems.find((item) => item.id === product.id || item.slug === product.slug);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const isInCart = cartQuantity > 0;

  // Comparison State (synced via localStorage kt_compare)
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    const updateCompareState = () => {
      try {
        const stored = localStorage.getItem('kt_compare');
        if (stored) {
          const list: string[] = JSON.parse(stored);
          setInCompare(list.includes(product.slug));
        } else {
          setInCompare(false);
        }
      } catch (e) {
        setInCompare(false);
      }
    };

    updateCompareState();
    window.addEventListener('storage', updateCompareState);
    window.addEventListener('kt-store', updateCompareState);
    return () => {
      window.removeEventListener('storage', updateCompareState);
      window.removeEventListener('kt-store', updateCompareState);
    };
  }, [product.slug]);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('kt_compare');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (list.includes(product.slug)) {
        list = list.filter((s) => s !== product.slug);
      } else {
        list = [product.slug, ...list.filter((s) => s !== product.slug)].slice(0, 2);
      }
      localStorage.setItem('kt_compare', JSON.stringify(list));
      setInCompare(list.includes(product.slug));
      window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_compare' }));
    } catch (e) {
      console.error(e);
    }
  };

  // Stock calculations
  const stockState = getStockStatus(product);
  const isOut = stockState === 'out';
  const isLow = stockState === 'low';

  // Pricing & Brand
  const mrp = Number(product.mrp || product.salePrice);
  const salePrice = Number(product.salePrice || product.mrp);
  const savings = Math.max(0, mrp - salePrice);

  const brandMeta = resolveBrandMeta(product.brand, product.name);
  const brandKey = brandMeta.label.toLowerCase();

  // Images handling
  const rawImages = product.images && product.images.length > 0 ? product.images : [];
  let mainImg = rawImages[0] || '/images/hero-aerator.png';
  if (mainImg.startsWith('assets/')) mainImg = '/' + mainImg;
  if (mainImg.startsWith('uploads/')) mainImg = '/' + mainImg;

  // URL determination
  const cat = (product.category || '').toLowerCase();
  let href = `/products/${product.slug}`;
  if (cat === 'aerators' || cat === 'aerator-set' || cat === 'aerator-sets') {
    href = `/aerator-sets/${product.slug}`;
  } else if (cat === 'spares') {
    href = `/spares/${product.slug}`;
  } else if (cat === 'long-arm') {
    href = `/long-arm/${product.slug}`;
  }

  const isAerator = cat === 'aerators' || cat === 'aerator-set' || cat === 'aerator-sets';

  // Model Number Identification
  const modelNumber =
    product.specifications?.['Model number'] ||
    product.specifications?.['Model Number'] ||
    product.model ||
    product.name?.match(/\(([^)]+)\)/)?.[1] ||
    '';

  // Cart actions
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOut) return;
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      model: product.model || product.name,
      price: salePrice,
      salePrice: salePrice,
      mrp: mrp,
      quantity: 1,
      image: mainImg,
      images: rawImages,
      brand: product.brand,
      category: product.category,
    });
    window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_cart' }));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, cartQuantity + 1);
    window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_cart' }));
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity <= 1) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, cartQuantity - 1);
    }
    window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_cart' }));
  };

  // Stock / Best Selling Ribbon details (Best Selling takes precedence if in stock)
  const isBestSelling = Boolean(product.is_best_selling);
  let stockRibbonText = 'IN STOCK';
  let stockRibbonBg = 'linear-gradient(180deg, #14C08A, #059669)';
  let stockRibbonShadow = 'rgba(5, 100, 70, 0.4)';

  if (isOut) {
    stockRibbonText = 'OUT OF STOCK';
    stockRibbonBg = 'linear-gradient(180deg, #F0486F, #C91E48)';
    stockRibbonShadow = 'rgba(150, 20, 60, 0.4)';
  } else if (isLow) {
    stockRibbonText = 'LIMITED STOCK';
    stockRibbonBg = 'linear-gradient(180deg, #DC2A32, #C21C25)';
    stockRibbonShadow = 'rgba(120, 10, 20, 0.35)';
  } else if (isBestSelling) {
    stockRibbonText = '★ BEST SELLING';
    stockRibbonBg = 'linear-gradient(180deg, #6366F1, #4338CA)';
    stockRibbonShadow = 'rgba(50, 40, 140, 0.4)';
  }

  return (
    <article
      className="group h-full flex flex-col bg-white border border-[#E3E8F0] rounded-[24px] overflow-hidden text-[#0B1A33] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_-28px_rgba(11,26,51,0.35)]"
      style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
    >
      {/* Product Image Area */}
      <div
        className={`relative w-full ${compact ? 'aspect-square' : 'aspect-square sm:aspect-[4/3]'} bg-transparent overflow-hidden`}
      >
        <Link href={href} className="block w-full h-full relative p-3 sm:p-4">
          <Image
            src={mainImg}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Brand Logo (Top Left) - Clean logo without borders/layouts */}
        {brandMeta.logo && (
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 pointer-events-none flex items-center">
            <img
              src={brandMeta.logo}
              alt={brandMeta.label}
              className="h-8 sm:h-11 w-auto max-w-[95px] sm:max-w-[130px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] shrink-0"
            />
          </div>
        )}

        {/* Status Ribbon (Top Right) */}
        <span
          className="absolute top-2.5 right-1.5 sm:top-3 sm:right-2 pointer-events-none inline-block z-10"
          style={{
            transform: 'rotate(7deg)',
            transformOrigin: 'right center',
            filter: `drop-shadow(0 4px 5px ${stockRibbonShadow})`,
          }}
        >
          <span
            className={`block font-bebas text-white tracking-wider leading-none ${
              compact
                ? 'text-[11px] px-3 py-0.5'
                : 'text-[11px] sm:text-[15px] px-3 py-0.5 sm:px-4 sm:py-1'
            }`}
            style={{
              background: stockRibbonBg,
              clipPath: 'polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%)',
            }}
          >
            {stockRibbonText}
          </span>
        </span>
      </div>

      {/* Card Content */}
      <div className={`flex-1 flex flex-col ${compact ? 'p-2.5 gap-1.5' : 'p-2.5 sm:p-5 gap-1.5 sm:gap-3'}`}>
        {/* Brand Capsule & Model Capsule Side by Side (ONLY for Aerator Sets) */}
        {isAerator && (
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* Brand Capsule (without logo inside) */}
            <div
              className="flex items-center justify-center text-center rounded-xl font-black text-[11px] sm:text-xs py-1.5 px-2 border truncate shadow-2xs"
              style={{
                backgroundColor: brandMeta.bg,
                color: brandMeta.fg,
                borderColor: brandKey === 'aqualion' ? '#FFDFB0' : brandKey.includes('sea') ? '#C4D9FF' : '#E3E8F0',
              }}
            >
              <span className="tracking-wider uppercase truncate">{brandMeta.label}</span>
            </div>

            {/* Model Capsule */}
            <div className="flex items-center justify-center text-center rounded-xl text-[11px] sm:text-xs font-black bg-[#E8F1FF] text-[#0B1A33] border border-[#CDE0FF] py-1.5 px-2 truncate shadow-2xs">
              <span className="truncate">{modelNumber || 'Standard'}</span>
            </div>
          </div>
        )}

        {/* Product Title */}
        <Link
          href={href}
          className={`font-extrabold text-[#0B1A33] hover:text-[#4338CA] transition-colors line-clamp-2 leading-snug tracking-tight ${
            compact ? 'text-xs' : 'text-xs sm:text-base'
          }`}
        >
          {product.name}
        </Link>

        {/* Price & Savings */}
        <div className="mt-auto pt-1 sm:pt-2 flex flex-col gap-2">
          <div className="flex items-baseline flex-wrap gap-1.5 sm:gap-2">
            <span className={`font-extrabold text-[#0B1A33] leading-none ${compact ? 'text-base' : 'text-base sm:text-2xl'}`}>
              {formatPrice(salePrice)}
            </span>
            {mrp > salePrice && (
              <span className="text-[10px] sm:text-xs text-[#7C879C] line-through font-medium">
                {formatPrice(mrp)}
              </span>
            )}
            {savings > 0 && (
              <span className="ml-auto text-[9.5px] sm:text-[11px] font-extrabold text-[#0B7A4B] bg-[#E3F7EE] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                Save {formatPrice(savings)}
              </span>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Compare Button for Aerator Sets, View Button for other products */}
            {isAerator && !hideCompare ? (
              <button
                type="button"
                onClick={toggleCompare}
                aria-pressed={inCompare}
                title={inCompare ? 'Remove from comparison' : 'Add to comparison'}
                className={`flex-1 min-w-0 border-1.5 rounded-full font-extrabold flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 transition-all shadow-xs cursor-pointer select-none ${
                  compact
                    ? 'h-8 text-[11px]'
                    : 'h-8 sm:h-10 text-[11px] sm:text-xs md:text-sm'
                } ${
                  inCompare
                    ? 'border-[#0B5C86] bg-[#0B5C86] text-white'
                    : 'border-[#8ED4F8] bg-[#E8F9FF] text-[#0B5C86] hover:bg-[#D4F2FD] hover:border-[#67C2F2] hover:text-[#063B57]'
                }`}
              >
                <span
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded border grid place-items-center flex-none transition-colors ${
                    inCompare
                      ? 'border-white bg-white text-[#0B5C86]'
                      : 'border-[#0B5C86] bg-transparent text-transparent'
                  }`}
                >
                  <svg
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2.5 6 4.5 8.5 9.5 3.5" />
                  </svg>
                </span>
                <span className="truncate whitespace-nowrap leading-none tracking-tight">
                  Compare
                </span>
              </button>
            ) : (
              <Link
                href={href}
                className={`flex-1 min-w-0 border-1.5 border-[#8ED4F8] rounded-full text-[#0B5C86] bg-[#E8F9FF] font-extrabold flex items-center justify-center hover:bg-[#D4F2FD] hover:border-[#67C2F2] hover:text-[#063B57] transition-all shadow-xs ${
                  compact ? 'h-8 text-xs' : 'h-8 sm:h-10 text-xs sm:text-sm'
                }`}
              >
                View
              </Link>
            )}

            {/* Cart Button or Stepper */}
            {isInCart ? (
              <div
                className={`flex-1 min-w-0 flex items-center justify-between rounded-full bg-[#C4D9FF] text-[#0B1A33] overflow-hidden ${
                  compact ? 'h-8' : 'h-8 sm:h-10'
                }`}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                  className="w-7 sm:w-8 h-full flex items-center justify-center text-base sm:text-lg font-bold hover:bg-black/10 active:scale-95 transition-all cursor-pointer"
                >
                  −
                </button>
                <span className="font-mono font-extrabold text-xs sm:text-sm">
                  {cartQuantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="w-7 sm:w-8 h-full flex items-center justify-center text-base sm:text-lg font-bold hover:bg-black/10 active:scale-95 transition-all cursor-pointer"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={isOut}
                className={`flex-1 min-w-0 rounded-full font-extrabold transition-all cursor-pointer flex items-center justify-center ${
                  compact ? 'h-8 text-xs' : 'h-8 sm:h-10 text-xs sm:text-sm'
                } ${
                  isOut
                    ? 'bg-[#EEF0F5] text-[#7C879C] cursor-not-allowed'
                    : 'bg-[#C4D9FF] text-[#0B1A33] hover:brightness-105 active:scale-95'
                }`}
              >
                {isOut ? (
                  'Out of Stock'
                ) : compact ? (
                  'Add'
                ) : (
                  <>
                    <span className="sm:hidden">Add</span>
                    <span className="hidden sm:inline">Add to Cart</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
