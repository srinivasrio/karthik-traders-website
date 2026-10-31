'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';

type Brand = 'all' | 'aqualion' | 'seaboss' | 'custom';

interface BrandFilterProps {
  selectedBrand: Brand;
  onSelectBrand: (brand: Brand) => void;
  children?: ReactNode;
  showCustom?: boolean;
  filterAction?: ReactNode;
}

export default function BrandFilter({
  selectedBrand,
  onSelectBrand,
  children,
  showCustom = false,
  filterAction,
}: BrandFilterProps) {
  const tabs: { key: Brand; label: string; dot: string; color: string; activeBg: string; logo?: string }[] = [
    { key: 'all', label: 'All', dot: '#0B1A33', color: '#0B1A33', activeBg: '#0B1A33' },
    { key: 'aqualion', label: 'Aqualion', dot: '#E8A317', color: '#D9650A', activeBg: '#D9650A', logo: '/images/logos/aqualion-logo.svg' },
    { key: 'seaboss', label: 'Sea Boss', dot: '#1BA3D9', color: '#1450C8', activeBg: '#1450C8', logo: '/images/logos/seaboss-logo.svg' },
    ...(showCustom
      ? [{ key: 'custom' as Brand, label: 'Other', dot: '#8B6CF0', color: '#4338CA', activeBg: '#6366F1' }]
      : []),
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number; bg: string } | null>(null);

  useEffect(() => {
    const activeBtn = btnRefs.current[selectedBrand];
    const activeTab = tabs.find((t) => t.key === selectedBrand);
    if (activeBtn && activeTab) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        bg: activeTab.activeBg,
      });
    }
  }, [selectedBrand, showCustom]);

  return (
    <div className="sticky top-[60px] sm:top-[72px] z-30 bg-[#FBFBFB]/90 backdrop-blur-md border-b border-[#E3E8F0] py-2.5 transition-all">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Count / Title (Desktop) */}
        {children && <div className="hidden sm:block">{children}</div>}

        {/* Right side row: Brand Tabs Capsule + Straight Right Filter Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Brand Tabs Capsule with Smooth Sliding Pill */}
          <div
            ref={containerRef}
            className="relative h-11 items-center flex gap-1 p-1 rounded-full bg-white border border-[#E3E8F0] shadow-2xs overflow-hidden shrink-0"
          >
            {/* Smooth Traveling Pill */}
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

            {tabs.map((t) => {
              const active = selectedBrand === t.key;
              return (
                <button
                  key={t.key}
                  ref={(el) => {
                    btnRefs.current[t.key] = el;
                  }}
                  type="button"
                  onClick={() => onSelectBrand(t.key)}
                  className={`relative z-10 h-9 px-3.5 sm:px-4 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 cursor-pointer ${
                    active ? 'text-white' : 'text-[#3D4A63] hover:text-[#0B1A33]'
                  }`}
                >
                  {t.logo ? (
                    <span className="w-5 h-5 rounded-full bg-white/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
                      <img
                        src={t.logo}
                        alt={t.label}
                        className="w-full h-full object-contain"
                      />
                    </span>
                  ) : (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 transition-colors duration-200"
                      style={{ backgroundColor: active ? '#ffffff' : t.dot }}
                    />
                  )}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Dropdown: Placed Straight Right of Filter Buttons */}
          {filterAction && <div className="shrink-0">{filterAction}</div>}
        </div>
      </div>
    </div>
  );
}
