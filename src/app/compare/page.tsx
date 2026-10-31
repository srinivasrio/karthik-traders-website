'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { aeratorSets, Product } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';

interface SpecItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  val1: string;
  val2: string;
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products: liveAerators } = useLiveProducts(aeratorSets, { skipLoading: true });

  const aeratorList = useMemo(() => {
    return liveAerators.filter(
      (p) => p.category === 'aerator-set' || p.category === 'aerators'
    );
  }, [liveAerators]);

  // Default models matching the design
  const aqualionModel = useMemo(
    () => aeratorList.find((p) => p.brand === 'aqualion') || aeratorList[0],
    [aeratorList]
  );
  const seaBossModel = useMemo(
    () => aeratorList.find((p) => p.brand === 'seaboss') || aeratorList[1] || aeratorList[0],
    [aeratorList]
  );

  const [slugs, setSlugs] = useState<string[]>(['', '']);
  const [selectorSlot, setSelectorSlot] = useState<number | null>(null);
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlP1 = searchParams.get('p1');
    const urlP2 = searchParams.get('p2');

    if (urlP1 || urlP2) {
      setSlugs([urlP1 || '', urlP2 || '']);
      return;
    }

    try {
      const stored = localStorage.getItem('kt_compare');
      if (stored) {
        const list: string[] = JSON.parse(stored);
        if (Array.isArray(list) && list.length >= 2 && list[0] && list[1]) {
          setSlugs([list[0], list[1]]);
          return;
        }
      }
    } catch {}

    if (aqualionModel && seaBossModel) {
      setSlugs([aqualionModel.slug, seaBossModel.slug]);
    }
  }, [searchParams, aqualionModel, seaBossModel]);

  const p1 = aeratorList.find((p) => p.slug === slugs[0]) || aqualionModel || null;
  const p2 = aeratorList.find((p) => p.slug === slugs[1]) || seaBossModel || null;

  const setSlot = (idx: number, slug: string) => {
    const next = [...slugs];
    next[idx] = slug;
    setSlugs(next);
    try {
      localStorage.setItem('kt_compare', JSON.stringify(next.filter(Boolean)));
      window.dispatchEvent(new CustomEvent('kt-store', { detail: 'kt_compare' }));
    } catch {}
    setSelectorSlot(null);
  };

  // 8 Exact Specification Rows matching both mobile and desktop screens
  const specs: SpecItem[] = [
    {
      id: 'motor-power',
      label: 'Motor Power',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      val1: '2 HP',
      val2: '2 HP',
    },
    {
      id: 'aeration-capacity',
      label: 'Aeration Capacity',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.5c4-4 12-4 16 0M4 9.5c4-4 12-4 16 0" />
        </svg>
      ),
      val1: '1.0 – 1.2 Acre',
      val2: '0.8 – 1.0 Acre',
    },
    {
      id: 'paddle-wheels',
      label: 'Paddle Wheels',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12" />
        </svg>
      ),
      val1: '8 Paddles',
      val2: '8 Paddles',
    },
    {
      id: 'float-material',
      label: 'Float Material',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      val1: 'HDPE (UV Resistant)',
      val2: 'HDPE',
    },
    {
      id: 'frame',
      label: 'Frame',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7V5a2 2 0 0 1 2-2h2m12 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
          <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
      ),
      val1: 'Stainless Steel',
      val2: 'GI (Powder Coated)',
    },
    {
      id: 'power-consumption',
      label: 'Power Consumption',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
      val1: '~1.5 kW/hr',
      val2: '~1.5 kW/hr',
    },
    {
      id: 'best-for',
      label: 'Best For',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      ),
      val1: 'High Density Farming',
      val2: 'Small / Medium Farms',
    },
    {
      id: 'warranty',
      label: 'Warranty',
      icon: (
        <svg className="w-4 h-4 text-[#1D64EC] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
        </svg>
      ),
      val1: '2 Years',
      val2: '1 Year',
    },
  ];

  // WhatsApp Quote Link
  const quoteText = encodeURIComponent(
    `Hello Karthik Traders, I would like to get a quote comparing:\n- ${p1?.name || 'Aqualion'}\n- ${p2?.name || 'Sea Boss'}\nfor my farm pond.`
  );
  const quoteUrl = `https://wa.me/919963840058?text=${quoteText}`;

  return (
    <div className="relative min-h-screen bg-[#EAF2FB] text-[#0B1A33] pb-12 md:pb-16 font-manrope overflow-hidden">
      {/* Background Ambient Pond Wallpaper matching reference look */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Image
          src="/new hero images/hero image desktop.png"
          alt="Aquaculture pond ambient background"
          fill
          priority
          className="object-cover object-center opacity-45 filter blur-[1.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#EAF2FB]/80 via-[#E4EFFB]/75 to-[#EAF2FB]/85" />
      </div>

      <main className="relative z-10 max-w-[1020px] mx-auto px-3 sm:px-6 lg:px-8 pt-2 md:pt-8">
        
        {/* Desktop Header Title */}
        <div className="hidden md:flex flex-col items-center text-center mb-7">
          <h1 className="text-3xl lg:text-4xl font-black font-poppins tracking-tight text-[#0A1931]">
            Compare <span className="text-[#1D64EC]">Aerators</span>
          </h1>
          <p className="text-sm lg:text-[15px] text-[#475569] font-medium mt-1.5 max-w-xl text-center">
            Choose the right aerator for your farm based on performance, features and value.
          </p>
        </div>

        {/* =========================================================================
            MAIN COMPARISON WHITE CARD
            ========================================================================= */}
        <div className="rounded-[28px] md:rounded-[32px] bg-white border border-[#E2E8F0]/80 shadow-[0_20px_50px_rgba(20,50,90,0.08)] p-3.5 sm:p-6 md:p-8 flex flex-col gap-5 md:gap-6">
          
          {/* Top Aerators Stage with "VS" Circle */}
          <div className="relative grid grid-cols-2 gap-2.5 sm:gap-6 items-stretch">
            {/* Floating "VS" badge */}
            <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-[0_4px_14px_rgba(29,100,236,0.18)] border border-slate-100 flex items-center justify-center">
                <span className="font-poppins font-black text-xs md:text-sm text-[#1D64EC] tracking-wider">
                  VS
                </span>
              </div>
            </div>

            {/* Left Product: Aqualion Card */}
            <div className="col-span-1 rounded-2xl bg-white border border-[#E8EFF8] p-2 sm:p-3 flex flex-col gap-2 relative shadow-2xs">
              {/* Product Photo on Water */}
              <div className="relative aspect-[16/11] md:aspect-[16/9] w-full rounded-xl md:rounded-xl overflow-hidden bg-[#F0F6FC]">
                <Image
                  src="/assets/compare-aerator-pristine.jpg"
                  alt="Aqualion Paddle Wheel Aerator"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 45vw, 450px"
                  priority
                />

                {/* Close / Model Switch Button at Top-Right */}
                <button
                  type="button"
                  onClick={() => setSelectorSlot(0)}
                  aria-label="Change Aqualion model"
                  title="Switch aerator model"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 text-[#1D64EC] hover:bg-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer active:scale-95"
                >
                  ✕
                </button>
              </div>

              {/* Title & Badge */}
              <div className="flex items-center justify-between gap-1 px-1 pt-0.5">
                <span className="font-poppins font-extrabold text-sm sm:text-lg md:text-xl text-[#0B1A33] tracking-tight">
                  Aqualion
                </span>
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-[#E0EFFF] text-[#1D64EC] shrink-0">
                  Premium
                </span>
              </div>
            </div>

            {/* Right Product: Sea Boss Card */}
            <div className="col-span-1 rounded-2xl bg-white border border-[#E8EFF8] p-2 sm:p-3 flex flex-col gap-2 relative shadow-2xs">
              {/* Product Photo on Water */}
              <div className="relative aspect-[16/11] md:aspect-[16/9] w-full rounded-xl md:rounded-xl overflow-hidden bg-[#F0F6FC]">
                <Image
                  src="/assets/compare-aerator-pristine.jpg"
                  alt="Sea Boss Paddle Wheel Aerator"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 45vw, 450px"
                  priority
                />

                {/* Close / Model Switch Button at Top-Right */}
                <button
                  type="button"
                  onClick={() => setSelectorSlot(1)}
                  aria-label="Change Sea Boss model"
                  title="Switch aerator model"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/95 text-[#1D64EC] hover:bg-white flex items-center justify-center text-xs font-black shadow-xs cursor-pointer active:scale-95"
                >
                  ✕
                </button>
              </div>

              {/* Title & Badge */}
              <div className="flex items-center justify-between gap-1 px-1 pt-0.5">
                <span className="font-poppins font-extrabold text-sm sm:text-lg md:text-xl text-[#0B1A33] tracking-tight">
                  Sea Boss
                </span>
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-[#FFF3E6] text-[#D97706] shrink-0">
                  Budget
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              THE SPECIFICATION TABLE (8 ROWS)
              ========================================================================= */}
          <div className="flex flex-col gap-1 w-full">
            {/* Desktop Table Header Row */}
            <div className="hidden md:grid grid-cols-12 py-2 px-5 text-sm font-semibold text-[#0B1A33]">
              <div className="col-span-4">Feature</div>
              <div className="col-span-4 text-center">Aqualion</div>
              <div className="col-span-4 text-center">Sea Boss</div>
            </div>

            {/* Specification Rows */}
            {specs.map((row, idx) => {
              const isTinted = idx % 2 === 0;

              return (
                <div
                  key={row.id}
                  className={`w-full rounded-xl transition-colors ${
                    isTinted ? 'bg-[#F4F8FD]' : 'bg-white'
                  }`}
                >
                  {/* Desktop Row View */}
                  <div className="hidden md:grid grid-cols-12 py-3 px-5 items-center text-sm font-medium text-[#1E293B]">
                    {/* Col 1: Icon + Label */}
                    <div className="col-span-4 flex items-center gap-3 font-medium text-[#1E293B]">
                      {row.icon}
                      <span>{row.label}</span>
                    </div>

                    {/* Col 2: Aqualion Value (Centered) */}
                    <div className="col-span-4 text-center font-normal text-[#1E293B]">
                      {row.val1}
                    </div>

                    {/* Col 3: Sea Boss Value (Centered) */}
                    <div className="col-span-4 text-center font-normal text-[#1E293B]">
                      {row.val2}
                    </div>
                  </div>

                  {/* Mobile Row View matching reference screenshot */}
                  <div className="md:hidden flex items-center py-2.5 px-3 text-[11px] sm:text-[12px] gap-1">
                    {/* Col 1: Icon + Label */}
                    <div className="w-[38%] flex items-center gap-2 font-medium text-[#1E293B] shrink-0">
                      {row.icon}
                      <span className="leading-tight">{row.label}</span>
                    </div>

                    {/* Col 2: Aqualion Value */}
                    <div className="w-[31%] text-center font-normal text-[#1E293B] leading-tight">
                      {row.id === 'float-material' ? (
                        <>
                          <div>HDPE</div>
                          <div className="text-[9.5px] text-[#475569] leading-tight">(UV Resistant)</div>
                        </>
                      ) : row.id === 'best-for' ? (
                        <>
                          <div>High Density</div>
                          <div className="text-[9.5px] text-[#475569] leading-tight">Farming</div>
                        </>
                      ) : (
                        <div className="whitespace-nowrap">{row.val1}</div>
                      )}
                    </div>

                    {/* Col 3: Sea Boss Value */}
                    <div className="w-[31%] text-center font-normal text-[#1E293B] leading-tight">
                      {row.id === 'frame' ? (
                        <>
                          <div>GI</div>
                          <div className="text-[9.5px] text-[#475569] leading-tight">(Powder Coated)</div>
                        </>
                      ) : row.id === 'best-for' ? (
                        <>
                          <div>Small / Medium</div>
                          <div className="text-[9.5px] text-[#475569] leading-tight">Farms</div>
                        </>
                      ) : (
                        <div className="whitespace-nowrap">{row.val2}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* =========================================================================
              BOTTOM BUTTONS (MATCHING REFERENCE SCREENS)
              ========================================================================= */}
          {/* Desktop View: Centered Side-by-Side Pill Buttons */}
          <div className="hidden md:flex items-center justify-center gap-4 pt-2">
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-9 rounded-2xl bg-[#1D64EC] hover:bg-[#1554C8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-11 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
              <span>Get Quote</span>
            </a>

            <button
              type="button"
              onClick={() => setShowFullDetailsModal(true)}
              className="h-11 px-9 rounded-2xl border border-[#CBD5E1] hover:border-[#1D64EC] bg-white text-[#1D64EC] font-bold text-sm flex items-center justify-center gap-2.5 hover:bg-[#F8FAFD] transition-all cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4 text-[#1D64EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>View Full Details</span>
            </button>
          </div>

          {/* Mobile View: Full Width Stacked Rounded-Full Buttons */}
          <div className="md:hidden flex flex-col gap-2.5 pt-1">
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-full bg-[#1D64EC] active:bg-[#1554C8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-11 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
              <span>Get Quote</span>
            </a>

            <button
              type="button"
              onClick={() => setShowFullDetailsModal(true)}
              className="w-full h-12 rounded-full border border-[#CBD5E1] bg-white text-[#1D64EC] font-bold text-sm flex items-center justify-center gap-2 active:bg-[#F0F7FF] transition-all active:scale-98"
            >
              <svg className="w-4 h-4 text-[#1D64EC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>View Details</span>
            </button>
          </div>

        </div>
      </main>

      {/* =========================================================================
          TECHNICAL SPECIFICATIONS / FULL DETAILS MODAL
          ========================================================================= */}
      {showFullDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="font-poppins font-black text-xl text-[#0B1A33]">
                  Full Engineering Specifications
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direct factory comparison between Aqualion and Sea Boss aerator sets
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-[#C4D9FF]">
                <div className="font-extrabold text-[#1D64EC] text-sm">Aqualion 2HP 8-Paddle</div>
                <div className="text-xs text-gray-600 mt-1">
                  Engineered for intense commercial biofloc and high stocking densities. Maximum dissolved oxygen transfer rate.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#FED7AA]">
                <div className="font-extrabold text-[#D97706] text-sm">Sea Boss 2HP 8-Paddle</div>
                <div className="text-xs text-gray-600 mt-1">
                  High return on investment for small-to-medium semi-intensive shrimp & fish culture. Economical & durable.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-600">Oxygen Transfer Rate (OTR)</span>
                <span className="font-mono text-gray-900 font-bold">&gt; 2.6 kg O2/hr vs &gt; 2.2 kg O2/hr</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-600">Bevel Gear Material</span>
                <span className="font-mono text-gray-900 font-bold">Forged Alloy vs Hardened Steel</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-600">Shaft Type</span>
                <span className="font-mono text-gray-900 font-bold">Solid SS-304 vs Hollow SS-202</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-600">Float Wall Thickness</span>
                <span className="font-mono text-gray-900 font-bold">4.5 mm Virgin HDPE vs 3.8 mm HDPE</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-600">Expected Field Lifespan</span>
                <span className="font-mono text-gray-900 font-bold">5 - 7 Seasons vs 3 - 5 Seasons</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="h-10 px-6 rounded-full bg-[#0B1A33] text-white text-xs font-bold hover:bg-[#1D64EC] transition-colors"
              >
                Close Specification Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODEL SELECTION MODAL (WHEN USER CLICKS ✕)
          ========================================================================= */}
      {selectorSlot !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-poppins font-black text-lg text-[#0B1A33]">
                  Select Aerator for Slot {selectorSlot + 1}
                </h3>
                <p className="text-xs text-gray-500">
                  Pick any aerator set from Karthik Traders to compare
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectorSlot(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {aeratorList.map((item) => {
                const isSelected = slugs[selectorSlot] === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSlot(selectorSlot, item.slug)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'border-[#1D64EC] bg-[#EBF7FF]'
                        : 'border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-none">
                        <Image
                          src="/assets/compare-aerator-pristine.jpg"
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-[#0B1A33]">{item.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{item.brand} • 2 HP</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[#1D64EC] font-bold text-sm">✓ Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<SimpleLoadingScreen />}>
      <CompareContent />
    </Suspense>
  );
}
