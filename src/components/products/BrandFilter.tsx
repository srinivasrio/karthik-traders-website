'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

type Brand = 'all' | 'aqualion' | 'seaboss';

interface BrandFilterProps {
    selectedBrand: Brand;
    onSelectBrand: (brand: Brand) => void;
    children?: ReactNode;
}

export default function BrandFilter({ selectedBrand, onSelectBrand, children }: BrandFilterProps) {
    return (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-aqua-100/50 pb-2 pt-16 md:pt-20 transition-all duration-300">
            <div className="container-custom py-2">
                {children && (
                    <div className="mb-2">
                        {children}
                    </div>
                )}
                <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex items-center gap-3 min-w-max">
                        <button
                            onClick={() => onSelectBrand('all')}
                            className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedBrand === 'all'
                                ? 'text-white shadow-lg shadow-aqua-500/30'
                                : 'text-black bg-steel-200 hover:bg-steel-300'
                                }`}
                        >
                            {selectedBrand === 'all' && (
                                <motion.div
                                    layoutId="activeBrand"
                                    className="absolute inset-0 bg-aqua-500 rounded-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">All</span>
                        </button>

                        <button
                            onClick={() => onSelectBrand('aqualion')}
                            className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedBrand === 'aqualion'
                                ? 'text-white shadow-lg shadow-amber-500/30'
                                : 'text-black bg-steel-200 hover:bg-steel-300'
                                }`}
                        >
                            {selectedBrand === 'aqualion' && (
                                <motion.div
                                    layoutId="activeBrand"
                                    className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                Aqualion
                            </span>
                        </button>

                        <button
                            onClick={() => onSelectBrand('seaboss')}
                            className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedBrand === 'seaboss'
                                ? 'text-white shadow-lg shadow-blue-500/30'
                                : 'text-black bg-steel-200 hover:bg-steel-300'
                                }`}
                        >
                            {selectedBrand === 'seaboss' && (
                                <motion.div
                                    layoutId="activeBrand"
                                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                Sea Boss
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
