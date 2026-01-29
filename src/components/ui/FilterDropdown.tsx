'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SortOption = 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

interface FilterDropdownProps {
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
}

export default function FilterDropdown({ sortBy, onSortChange }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => setIsOpen(!isOpen);

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

    const handleSelect = (option: SortOption) => {
        onSortChange(option);
        setIsOpen(false);
    };

    const getLabel = (option: SortOption) => {
        switch (option) {
            case 'price-low': return 'Price: Low to High';
            case 'price-high': return 'Price: High to Low';
            case 'name-asc': return 'Name: A to Z';
            case 'name-desc': return 'Name: Z to A';
            default: return 'Sort By';
        }
    };

    return (
        <div className="relative z-30" ref={dropdownRef}>
            <button
                onClick={toggleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-[#4ED7F1] hover:bg-[#38C8E8] rounded-full shadow-sm border border-[#4ED7F1] text-sm font-medium text-deep-blue-900 active:scale-95 transition-transform"
            >
                {isOpen ? (
                    <svg className="w-4 h-4 text-deep-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-deep-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                )}
                <span>{isOpen ? 'Close' : 'Filter'}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-steel-100 overflow-hidden z-50 origin-top-right"
                        >
                            <div className="py-1">
                                {[
                                    { id: 'price-low', label: 'Price: Low → High' },
                                    { id: 'price-high', label: 'Price: High → Low' },
                                    { id: 'name-asc', label: 'Name: A → Z' },
                                    { id: 'name-desc', label: 'Name: Z → A' },
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSelect(option.id as SortOption)}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === option.id
                                            ? 'bg-aqua-50 text-aqua-700 font-medium'
                                            : 'text-deep-blue-900 hover:bg-steel-50'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
