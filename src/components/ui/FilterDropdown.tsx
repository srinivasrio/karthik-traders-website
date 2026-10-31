'use client';

import { useState, useRef, useEffect } from 'react';

export type SortOption = 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

interface FilterDropdownProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function FilterDropdown({ sortBy, onSortChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { id: SortOption; label: string }[] = [
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'name-asc', label: 'Name: A–Z' },
    { id: 'name-desc', label: 'Name: Z–A' },
  ];

  const currentLabel = options.find((o) => o.id === sortBy)?.label || 'Sort: Featured';

  return (
    <div className="relative z-30" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filter and sort options"
        title="Filter and sort options"
        className={`w-11 h-11 sm:w-auto sm:h-11 rounded-full bg-[#1450C8] hover:bg-[#0B3A99] text-white border border-[#1450C8] font-bold text-xs sm:text-sm flex items-center justify-center p-0 sm:px-4 gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_4px_14px_-3px_rgba(20,80,200,0.45)] shrink-0 ${
          isOpen ? 'ring-2 ring-[#1450C8]/40 bg-[#0B3A99]' : ''
        }`}
      >
        {/* Filter Funnel Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white shrink-0"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>

        {/* Desktop Label & Chevron */}
        <span className="hidden sm:inline font-bold tracking-tight">{currentLabel}</span>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          className={`hidden sm:inline text-white/90 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-[#D5E3F5] shadow-xl p-1.5 flex flex-col gap-0.5 animate-[ktPop_0.2s_ease-out]">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSortChange(opt.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors cursor-pointer ${
                sortBy === opt.id
                  ? 'bg-[#EEF5FF] text-[#1450C8]'
                  : 'text-[#0B1A33] hover:bg-[#F8FAFD]'
              }`}
            >
              <span>{opt.label}</span>
              {sortBy === opt.id && <span className="font-extrabold text-[#1450C8]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
