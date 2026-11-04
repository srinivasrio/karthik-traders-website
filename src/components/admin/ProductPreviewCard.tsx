"use client";

import { resolveBrandMeta, formatPrice } from '@/data/kt-ui';

interface ProductPreviewCardProps {
  name: string;
  model: string;
  brand: string;
  category: string;
  mrp: string;
  sellingPrice: string;
  warranty: string;
  stockStatus: string;
  images: string[];
  features: string[];
  isBestSelling?: boolean;
}

export default function ProductPreviewCard({
  name,
  model,
  brand,
  category,
  mrp,
  sellingPrice,
  warranty,
  stockStatus,
  images,
  features,
  isBestSelling = false,
}: ProductPreviewCardProps) {
  const brandMeta = resolveBrandMeta(brand, name);
  const brandKey = brandMeta.label.toLowerCase();

  const mrpNum = parseFloat(mrp) || 0;
  const priceNum = parseFloat(sellingPrice) || 0;
  const savings = Math.max(0, mrpNum - priceNum);

  const primaryImage = images.length > 0 ? images[0] : null;

  const cat = (category || '').toLowerCase();
  const isAerator = cat === 'aerators' || cat === 'aerator-set' || cat === 'aerator-sets';
  const isOut = stockStatus === 'out-of-stock';
  const isLow = stockStatus === 'limited';

  // Format warranty
  const formatWarranty = (val: string): string | null => {
    if (!val) return null;
    const s = String(val).trim();
    const lower = s.toLowerCase();
    if (['no', 'none', 'na', 'n/a', 'null', '0', ''].includes(lower)) return null;
    let cleaned = s.replace(/['’]s\b/gi, 's').replace(/\s+/g, ' ').trim();
    if (/^\d+$/.test(cleaned)) {
      return `${cleaned} Months Warranty`;
    }
    if (/^\d+\s*months?$/i.test(cleaned)) {
      const num = cleaned.match(/\d+/)?.[0] || '';
      return `${num} Months Warranty`;
    }
    if (/^\d+\s*years?$/i.test(cleaned)) {
      const num = cleaned.match(/\d+/)?.[0] || '';
      return `${num} Year Warranty`;
    }
    cleaned = cleaned.replace(/1\s+years/i, '1 Year');
    if (lower.includes('warranty')) {
      return cleaned;
    }
    return `${cleaned} Warranty`;
  };

  const warrantyText = formatWarranty(warranty);

  // Status ribbon styling matching storefront ProductCard
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold text-[#1450C8] uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1450C8] animate-pulse" />
          Storefront Card Preview
        </span>
        <span className="text-[10px] font-semibold text-slate-400">Live Customer UI</span>
      </div>

      <article
        className="group h-full flex flex-col bg-white border border-[#E3E8F0] rounded-[24px] overflow-hidden text-[#0B1A33] shadow-md"
        style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}
      >
        {/* Product Image Area */}
        <div className="relative w-full aspect-square bg-white overflow-hidden p-3 sm:p-4">
          {primaryImage ? (
            <img
              src={primaryImage.startsWith('assets/') || primaryImage.startsWith('uploads/') ? '/' + primaryImage : primaryImage}
              alt={name || 'Product'}
              className="w-full h-full object-contain p-2 transition-transform duration-500"
              style={{ mixBlendMode: 'multiply' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0.3';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
              </svg>
              <span className="text-xs font-semibold mt-1 text-slate-400">No Image Uploaded</span>
            </div>
          )}

          {/* Brand Logo (Top Left) */}
          {brandMeta.logo && (
            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none flex items-center">
              <img
                src={brandMeta.logo}
                alt={brandMeta.label}
                className="h-8 sm:h-10 w-auto max-w-[95px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] shrink-0"
              />
            </div>
          )}

          {/* Status Ribbon (Top Right) */}
          <span
            className="absolute top-2.5 right-1.5 pointer-events-none inline-block z-10"
            style={{
              transform: 'rotate(7deg)',
              transformOrigin: 'right center',
              filter: `drop-shadow(0 4px 5px ${stockRibbonShadow})`,
            }}
          >
            <span
              className="block font-bebas text-white tracking-wider leading-none text-[11px] sm:text-[13px] px-3 py-0.5 sm:px-3.5 sm:py-1"
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
        <div className="flex-1 flex flex-col p-3 sm:p-4 gap-2">
          {/* Brand & Model Capsules for Aerators */}
          {isAerator && (
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Brand Capsule */}
              <div
                className="flex items-center justify-center text-center rounded-xl font-black text-[10px] sm:text-xs py-1.5 px-1.5 border shadow-2xs min-w-0"
                style={{
                  backgroundColor: brandMeta.bg,
                  color: brandMeta.fg,
                  borderColor: brandKey === 'aqualion' ? '#FFDFB0' : brandKey.includes('sea') ? '#C4D9FF' : '#E3E8F0',
                }}
              >
                <span className="tracking-wider uppercase whitespace-nowrap overflow-hidden text-ellipsis">{brandMeta.label}</span>
              </div>

              {/* Model Capsule */}
              <div className="flex items-center justify-center text-center rounded-xl text-[11px] sm:text-xs font-black bg-[#E8F1FF] text-[#0B1A33] border border-[#CDE0FF] py-1.5 px-2 truncate shadow-2xs">
                <span className="truncate">{model || 'Standard'}</span>
              </div>
            </div>
          )}

          {/* Product Title */}
          <h3 className="font-extrabold text-[#0B1A33] text-sm leading-snug line-clamp-2">
            {name || 'Product Title'}
          </h3>

          {/* Warranty Badge for Motors, Gearboxes, Spares & Long Arm */}
          {!isAerator && warrantyText && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-[#E6F9F0] text-[#0A6C3E] border border-[#BDEFD6]">
                <svg className="w-3 h-3 text-[#0B7A4B] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>{warrantyText}</span>
              </span>
            </div>
          )}

          {/* Price & Savings */}
          <div className="mt-auto pt-2 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-1">
              <div className="flex flex-col">
                <span className="font-extrabold text-[#0B1A33] leading-none tracking-tight text-base sm:text-xl">
                  {priceNum > 0 ? formatPrice(priceNum) : '₹—'}
                </span>
                {mrpNum > priceNum && (
                  <span className="text-[10px] sm:text-xs text-[#7C879C] line-through font-medium mt-1">
                    {formatPrice(mrpNum)}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <span className="text-[9.5px] sm:text-[11px] font-extrabold text-[#0B7A4B] bg-[#E3F7EE] px-1.5 py-0.5 rounded-full whitespace-nowrap self-start">
                  Save {formatPrice(savings)}
                </span>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-9 rounded-full border border-[#8ED4F8] bg-[#E8F9FF] text-[#0B5C86] font-extrabold text-xs flex items-center justify-center shadow-xs">
                View Details
              </div>
              <div className="flex-1 h-9 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-black text-xs flex items-center justify-center shadow-xs">
                + Add
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
