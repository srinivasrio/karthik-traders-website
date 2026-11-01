'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { aeratorSets, formatPrice, Product } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';

export default function ComparePromo() {
  const { products: liveAerators } = useLiveProducts(aeratorSets, { skipLoading: true });

  const aeratorList = useMemo(() => {
    return liveAerators.filter(
      (p) => p.category === 'aerator-set' || p.category === 'aerators'
    );
  }, [liveAerators]);

  // Default to Aqualion 2HP 4-Paddle PR 20 B and Sea Boss 2HP 4-Paddle HV-13-B
  const [slugA, setSlugA] = useState<string>('aqualion-2hp-4-paddle-pr20b');
  const [slugB, setSlugB] = useState<string>('seaboss-2hp-4-paddle-hv13b');

  const productA =
    aeratorList.find((p) => p.slug === slugA) ||
    aeratorList.find((p) => p.brand === 'aqualion') ||
    aeratorList[0];

  const productB =
    aeratorList.find((p) => p.slug === slugB) ||
    aeratorList.find((p) => p.brand === 'seaboss') ||
    aeratorList[1] ||
    aeratorList[0];

  // Helper to extract cleanly formatted specs from product
  const getSpecs = (pA?: Product, pB?: Product) => [
    {
      label: 'Motor Power & Phase',
      icon: '⚡',
      valA: pA?.specifications?.['Motor Power']
        ? `${pA.specifications['Motor Power']} (${pA.specifications['Motor Phase'] || '3 Phase'}, ${pA.specifications['Voltage'] || '415V'})`
        : '2HP (3 Phase, 415V)',
      valB: pB?.specifications?.['Motor Power']
        ? `${pB.specifications['Motor Power']} (${pB.specifications['Motor Phase'] || '3 Phase'}, ${pB.specifications['Voltage'] || '415V'})`
        : '2HP (3 Phase, 415V)',
      highlightA: pA?.brand === 'aqualion' ? '100% Copper ISO' : undefined,
      highlightB: pB?.brand === 'seaboss' ? 'Heavy Duty' : undefined,
    },
    {
      label: 'Gearbox & Speed',
      icon: '⚙️',
      valA: pA?.specifications?.['Gear Box Type']
        ? `${pA.specifications['Gear Box Type']} (${pA.specifications['Gear Box RPM'] || '106'} RPM)`
        : 'A3 Bevel (106 RPM)',
      valB: pB?.specifications?.['Gear Box Type']
        ? `${pB.specifications['Gear Box Type']} (${pB.specifications['Gear Box RPM'] || '105'} RPM)`
        : 'A3 Bevel (105 RPM)',
      highlightA: pA?.specifications?.['Gear Box Type']?.includes('Bevel') ? 'Low Friction Bevel' : undefined,
      highlightB: undefined,
    },
    {
      label: 'Paddles / Moulding Fans',
      icon: '🌀',
      valA: pA?.specifications?.['No. of Paddle']
        ? `${pA.specifications['No. of Paddle']} Fans (${pA.specifications['Fan Weight'] || '2.2 Kg'} Virgin PPCP)`
        : '4 Fans (2.2 Kg Virgin PPCP)',
      valB: pB?.specifications?.['No. of Paddle']
        ? `${pB.specifications['No. of Paddle']} Fans (${pB.specifications['Fan Weight'] || '1.9 Kg'} Virgin PPCP)`
        : '4 Fans (1.9 Kg Virgin PPCP)',
      highlightA: 'Virgin PPCP UV',
      highlightB: 'High Flow',
    },
    {
      label: 'Floats Material & Weight',
      icon: '🛟',
      valA: pA?.specifications?.['Float Weight']
        ? `3 Floats (${pA.specifications['Float Weight']} Virgin HDPE)`
        : '3 Floats (7 Kg Virgin HDPE)',
      valB: pB?.specifications?.['Float Weight']
        ? `3 Floats (${pB.specifications['Float Weight']} Virgin HDPE)`
        : '3 Floats (6.5 Kg HDPE)',
      highlightA: 'Heavy Duty 7 Kg',
      highlightB: 'UV Stabilized',
    },
    {
      label: 'Frame & Rod Finish',
      icon: '📐',
      valA: pA?.specifications?.['Frame & Rod Material']
        ? `${pA.specifications['Frame & Rod Material']} (${pA.specifications['Frame Thickness'] || '3 MM'})`
        : 'SS 304 CR (3 MM)',
      valB: pB?.specifications?.['Frame & Rod Material']
        ? `${pB.specifications['Frame & Rod Material']} (${pB.specifications['Frame Thickness'] || '2 MM'})`
        : 'SS 202 CR (2 MM)',
      highlightA: pA?.specifications?.['Frame & Rod Material']?.includes('304') ? 'Rust-Proof SS 304' : undefined,
      highlightB: undefined,
    },
    {
      label: 'Oxygen Generation',
      icon: '🫧',
      valA: pA?.specifications?.['Oxygen Generation'] || '3.0 - 3.2 Kg O₂ / Hr',
      valB: pB?.specifications?.['Oxygen Generation'] || '2.3 - 2.6 Kg O₂ / Hr',
      highlightA: 'High Oxygen Yield',
      highlightB: 'Reliable DO',
    },
    {
      label: 'Pond Circulation Flow',
      icon: '🌊',
      valA: pA?.specifications?.['Effective Flow / Circulation Range'] || '35 - 40 meters',
      valB: pB?.specifications?.['Effective Flow / Circulation Range'] || '30 meters',
      highlightA: '35 - 40m Spread',
      highlightB: '30m Spread',
    },
    {
      label: 'Warranty Coverage',
      icon: '🛡️',
      valA: pA?.warranty || '1 Year Warranty',
      valB: pB?.warranty || '1 Year Replacement Warranty',
      highlightA: '1 Year Full',
      highlightB: '1 Year Full',
    },
  ];

  const compareRows = getSpecs(productA, productB);

  return (
    <section className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 md:pt-24 font-poppins">
      <div className="rounded-[36px] bg-gradient-to-br from-[#EAE6FE] via-[#DDD5FA] to-[#C5BAFF] p-5 sm:p-8 lg:p-12 shadow-sm border border-[#DCD3F8]">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B1A33] tracking-tight leading-[1.12]">
              Compare aerator sets
            </h2>
          </div>

          <Link
            href="/compare"
            className="inline-flex items-center gap-2 h-11 sm:h-12 px-6 rounded-full bg-[#1450C8] hover:bg-[#0B3A99] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md self-start md:self-auto shrink-0"
          >
            <span>Full Comparison Tool</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* Model Selectors Bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 mb-6 border border-white shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A4B00] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E58A1F]" />
              Select Aerator Set A:
            </label>
            <select
              value={productA?.slug || ''}
              onChange={(e) => setSlugA(e.target.value)}
              aria-label="Select first aerator for comparison"
              className="w-full h-10 px-3 rounded-xl border border-[#D5DCE8] bg-white text-xs sm:text-sm font-bold text-[#0B1A33] outline-none cursor-pointer focus:border-[#4338CA] truncate"
            >
              {aeratorList.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B5C86] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0088CC]" />
              Select Aerator Set B:
            </label>
            <select
              value={productB?.slug || ''}
              onChange={(e) => setSlugB(e.target.value)}
              aria-label="Select second aerator for comparison"
              className="w-full h-10 px-3 rounded-xl border border-[#D5DCE8] bg-white text-xs sm:text-sm font-bold text-[#0B1A33] outline-none cursor-pointer focus:border-[#4338CA] truncate"
            >
              {aeratorList.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP VIEW: Structured 3-Column Comparison Table            */}
        {/* ============================================================== */}
        <div className="hidden lg:block bg-[#FBFBFB] rounded-[28px] p-6 shadow-xl border border-white overflow-hidden">
          {/* Top Product Hero Headers */}
          <div className="grid grid-cols-12 gap-4 pb-6 border-b border-[#E3E8F0] items-stretch">
            <div className="col-span-4 flex flex-col justify-end p-4">
              <span className="text-xs font-extrabold text-[#7C879C] uppercase tracking-wider">
                FEATURE SPECIFICATION
              </span>
              <p className="text-sm font-bold text-[#0B1A33] mt-1">
                Comparing 8 core performance metrics from Karthik Traders database
              </p>
            </div>

            {/* Product A Card */}
            <div className="col-span-4 bg-white rounded-2xl p-4 border border-[#E8EEF5] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF1D6] text-[#8A4B00] text-xs font-black uppercase tracking-wider border border-[#FFDFB0]">
                    {productA?.brand === 'aqualion' ? (
                      <>
                        <img
                          src="/images/logos/aqualion-logo.svg"
                          alt="Aqualion"
                          className="h-6 sm:h-7 w-auto object-contain shrink-0"
                        />
                        <span>Aqualion</span>
                      </>
                    ) : (
                      'Set A'
                    )}
                  </span>
                  {productA?.badge && (
                    <span className="text-[10.5px] font-bold text-[#0B7A4B] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                      {productA.badge}
                    </span>
                  )}
                </div>

                <div className="relative aspect-[16/9] rounded-xl bg-transparent p-2 mb-3 flex items-center justify-center">
                  <img
                    src={productA?.images?.[0] || '/images/placeholder.png'}
                    alt={productA?.name || 'Aerator Set A'}
                    className="w-full h-full object-contain"
                  />
                </div>

                <h3 className="text-base font-extrabold text-[#0B1A33] leading-snug line-clamp-2">
                  {productA?.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF2F8] flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-[#0B1A33]">
                    {productA?.salePrice ? formatPrice(productA.salePrice) : '—'}
                  </div>
                  {productA?.mrp && productA.mrp > productA.salePrice && (
                    <div className="text-xs text-[#7C879C] line-through">
                      MRP {formatPrice(productA.mrp)}
                    </div>
                  )}
                </div>

                <Link
                  href={`/aerator-sets/${productA?.slug}`}
                  className="px-4 py-2 rounded-full bg-[#FFF1D6] hover:bg-[#FFE3B0] text-[#8A4B00] text-xs font-extrabold transition-all"
                >
                  View Details →
                </Link>
              </div>
            </div>

            {/* Product B Card */}
            <div className="col-span-4 bg-white rounded-2xl p-4 border border-[#E8EEF5] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF3FF] text-[#0B5C86] text-xs font-black uppercase tracking-wider border border-[#C4D9FF]">
                    {productB?.brand === 'seaboss' ? (
                      <>
                        <img
                          src="/images/logos/seaboss-logo.svg"
                          alt="Sea Boss"
                          className="h-6 sm:h-7 w-auto object-contain shrink-0"
                        />
                        <span>Sea Boss</span>
                      </>
                    ) : (
                      'Set B'
                    )}
                  </span>
                  {productB?.badge && (
                    <span className="text-[10.5px] font-bold text-[#0B5C86] bg-[#DDF3FF] px-2 py-0.5 rounded-full">
                      {productB.badge}
                    </span>
                  )}
                </div>

                <div className="relative aspect-[16/9] rounded-xl bg-transparent p-2 mb-3 flex items-center justify-center">
                  <img
                    src={productB?.images?.[0] || '/images/placeholder.png'}
                    alt={productB?.name || 'Aerator Set B'}
                    className="w-full h-full object-contain"
                  />
                </div>

                <h3 className="text-base font-extrabold text-[#0B1A33] leading-snug line-clamp-2">
                  {productB?.name}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-[#EEF2F8] flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-[#0B1A33]">
                    {productB?.salePrice ? formatPrice(productB.salePrice) : '—'}
                  </div>
                  {productB?.mrp && productB.mrp > productB.salePrice && (
                    <div className="text-xs text-[#7C879C] line-through">
                      MRP {formatPrice(productB.mrp)}
                    </div>
                  )}
                </div>

                <Link
                  href={`/aerator-sets/${productB?.slug}`}
                  className="px-4 py-2 rounded-full bg-[#DDF3FF] hover:bg-[#BDE7FF] text-[#0B5C86] text-xs font-extrabold transition-all"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop Spec Rows */}
          <div className="divide-y divide-[#EAEFF6]">
            {compareRows.map((row, idx) => (
              <div
                key={row.label}
                className={`grid grid-cols-12 py-3.5 px-3 items-center transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8FF]/40'
                }`}
              >
                <div className="col-span-4 flex items-center gap-2.5 font-bold text-sm text-[#3D4A63]">
                  <span className="text-base">{row.icon}</span>
                  <span>{row.label}</span>
                </div>

                <div className="col-span-4 px-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#0B1A33]">{row.valA}</span>
                  {row.highlightA && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF1D6] text-[#8A4B00] text-[10px] font-extrabold">
                      {row.highlightA}
                    </span>
                  )}
                </div>

                <div className="col-span-4 px-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#0B1A33]">{row.valB}</span>
                  {row.highlightB && (
                    <span className="px-2 py-0.5 rounded-full bg-[#DDF3FF] text-[#0B5C86] text-[10px] font-extrabold">
                      {row.highlightB}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE VIEW: Perfectly Structured Card-Based Comparison Rows   */}
        {/* ============================================================== */}
        <div className="lg:hidden flex flex-col gap-4">
          {/* Dual Product Summary Header on Mobile */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Mobile Product A Summary */}
            <div className="bg-white rounded-2xl p-3 border border-[#E3E8F0] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF1D6] text-[#8A4B00] text-[10.5px] font-black uppercase">
                    {productA?.brand === 'aqualion' ? (
                      <>
                        <img
                          src="/images/logos/aqualion-logo.svg"
                          alt="Aqualion"
                          className="h-5 w-auto object-contain shrink-0"
                        />
                        <span>Aqualion</span>
                      </>
                    ) : (
                      'Set A'
                    )}
                  </span>
                </div>
                <div className="relative aspect-[4/3] rounded-lg bg-transparent p-1 mb-2 flex items-center justify-center">
                  <img
                    src={productA?.images?.[0] || '/images/placeholder.png'}
                    alt={productA?.name || 'Set A'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h4 className="text-xs font-black text-[#0B1A33] line-clamp-2 leading-tight">
                  {productA?.name}
                </h4>
              </div>

              <div className="mt-2 pt-2 border-t border-[#EEF2F8]">
                <div className="text-sm font-black text-[#0B1A33]">
                  {productA?.salePrice ? formatPrice(productA.salePrice) : '—'}
                </div>
                <Link
                  href={`/aerator-sets/${productA?.slug}`}
                  className="mt-1.5 block w-full py-1 text-center rounded-lg bg-[#FFF1D6] text-[#8A4B00] text-[10.5px] font-extrabold"
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Mobile Product B Summary */}
            <div className="bg-white rounded-2xl p-3 border border-[#E3E8F0] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DDF3FF] text-[#0B5C86] text-[10.5px] font-black uppercase">
                    {productB?.brand === 'seaboss' ? (
                      <>
                        <img
                          src="/images/logos/seaboss-logo.svg"
                          alt="Sea Boss"
                          className="h-5 w-auto object-contain shrink-0"
                        />
                        <span>Sea Boss</span>
                      </>
                    ) : (
                      'Set B'
                    )}
                  </span>
                </div>
                <div className="relative aspect-[4/3] rounded-lg bg-transparent p-1 mb-2 flex items-center justify-center">
                  <img
                    src={productB?.images?.[0] || '/images/placeholder.png'}
                    alt={productB?.name || 'Set B'}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h4 className="text-xs font-black text-[#0B1A33] line-clamp-2 leading-tight">
                  {productB?.name}
                </h4>
              </div>

              <div className="mt-2 pt-2 border-t border-[#EEF2F8]">
                <div className="text-sm font-black text-[#0B1A33]">
                  {productB?.salePrice ? formatPrice(productB.salePrice) : '—'}
                </div>
                <Link
                  href={`/aerator-sets/${productB?.slug}`}
                  className="mt-1.5 block w-full py-1 text-center rounded-lg bg-[#DDF3FF] text-[#0B5C86] text-[10.5px] font-extrabold"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>

          {/* Structured Spec Comparison Cards on Mobile */}
          <div className="flex flex-col gap-2.5">
            {compareRows.map((spec) => (
              <div
                key={spec.label}
                className="bg-white rounded-2xl p-3 border border-[#E3E8F0] shadow-xs flex flex-col gap-2"
              >
                {/* Spec Name Header */}
                <div className="flex items-center justify-between text-xs font-extrabold text-[#3D4A63] pb-1.5 border-b border-[#F0F4FA]">
                  <span className="flex items-center gap-1.5">
                    <span>{spec.icon}</span>
                    <span>{spec.label}</span>
                  </span>
                </div>

                {/* Structured Dual Values */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Value A */}
                  <div className="p-2.5 rounded-xl bg-[#FFF9ED] border border-[#FFE8B3] flex flex-col justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8A4B00] uppercase tracking-wider mb-1">
                      {productA?.brand === 'aqualion' ? (
                        <>
                          <img
                            src="/images/logos/aqualion-logo.svg"
                            alt="Aqualion"
                            className="h-2.5 w-auto object-contain shrink-0"
                          />
                          <span>Aqualion</span>
                        </>
                      ) : (
                        'Set A'
                      )}
                    </span>
                    <span className="font-semibold text-[#0B1A33] leading-snug">
                      {spec.valA}
                    </span>
                    {spec.highlightA && (
                      <span className="mt-1.5 inline-block text-[9.5px] font-extrabold text-[#8A4B00] bg-white/80 px-1.5 py-0.5 rounded-md self-start border border-[#FFE8B3]">
                        {spec.highlightA}
                      </span>
                    )}
                  </div>

                  {/* Value B */}
                  <div className="p-2.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0369A1] uppercase tracking-wider mb-1">
                      {productB?.brand === 'seaboss' ? (
                        <>
                          <img
                            src="/images/logos/seaboss-logo.svg"
                            alt="Sea Boss"
                            className="h-2.5 w-auto object-contain shrink-0"
                          />
                          <span>Sea Boss</span>
                        </>
                      ) : (
                        'Set B'
                      )}
                    </span>
                    <span className="font-semibold text-[#0B1A33] leading-snug">
                      {spec.valB}
                    </span>
                    {spec.highlightB && (
                      <span className="mt-1.5 inline-block text-[9.5px] font-extrabold text-[#0369A1] bg-white/80 px-1.5 py-0.5 rounded-md self-start border border-[#BAE6FD]">
                        {spec.highlightB}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Bottom CTA */}
          <div className="mt-2 text-center">
            <Link
              href="/compare"
              className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-full bg-[#1450C8] text-white font-extrabold text-sm shadow-md"
            >
              <span>Explore All Models in Comparison Tool</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
