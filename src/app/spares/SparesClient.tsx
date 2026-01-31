'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import ProductGrid from '@/components/products/ProductGrid';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import { motion } from 'framer-motion';
import { Product } from '@/data/products';

type CategoryFilter = 'all' | 'motor-cover' | 'float' | 'fan' | 'frame' | 'rod' | 'kit-box';

interface SparesClientProps {
    initialProducts: Product[];
}

export default function SparesClient({ initialProducts }: SparesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [category, setCategory] = useState<CategoryFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('price-low');
    const [isLoading, setIsLoading] = useState(false);

    // Use hook for live data with skipLoading option
    const { products: liveProducts, loading: productsLoading } = useLiveProducts(initialProducts, { skipLoading: true });

    // Sync with URL params on mount and change
    useEffect(() => {
        const catParam = searchParams.get('category');
        if (catParam && ['motor-cover', 'float', 'fan', 'frame', 'rod', 'kit-box'].includes(catParam)) {
            setCategory(catParam as CategoryFilter);
        } else {
            setCategory('all');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!productsLoading) {
            setIsLoading(false);
        }
    }, [productsLoading]);

    const handleCategorySelect = (cat: CategoryFilter) => {
        if (cat === category) return;
        setIsLoading(true);
        setCategory(cat);
        // Update URL to preserve state on navigation
        const params = new URLSearchParams(searchParams.toString());
        if (cat === 'all') {
            params.delete('category');
        } else {
            params.set('category', cat);
        }
        router.replace(`/spares?${params.toString()}`, { scroll: false });

        setTimeout(() => setIsLoading(false), 600);
    };

    const handleSortChange = (newSort: SortOption) => {
        setIsLoading(true);
        setSortBy(newSort);
        setTimeout(() => setIsLoading(false), 300);
    };

    // Filter products
    const filteredProducts = liveProducts.filter(product => {
        if (category === 'all') return true;
        return product.category === category;
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

    const handlePullDown = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1000);
    };

    const handleSwipeUp = () => {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-50 animate-fade-in-up';
        toast.innerText = 'Loading more spares...';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    };

    const categoriesList = [
        { id: 'all', label: 'All' },
        { id: 'motor-cover', label: 'Doms' },
        { id: 'float', label: 'Floats' },
        { id: 'fan', label: 'Fans' },
        { id: 'frame', label: 'Frames' },
        { id: 'rod', label: 'Rods' },
        { id: 'kit-box', label: 'Kit boxes' },
    ];

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Sticky Category Filter */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-aqua-100/50 pb-2 pt-16 md:pt-20 transition-all duration-300">
                <div className="container-custom py-2">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h1 className="text-2xl font-bold text-deep-blue-900">Spares</h1>
                        <FilterDropdown sortBy={sortBy} onSortChange={handleSortChange} />
                    </div>
                    {/* Mobile Grid (4 cols = 2 rows for 7 items) / Desktop Scroll */}
                    <div className="grid grid-cols-4 gap-2 md:flex md:gap-2 md:overflow-x-auto md:no-scrollbar md:px-1 md:min-w-max">
                        {categoriesList.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id as CategoryFilter)}
                                className={`relative px-2 py-4 md:px-6 rounded-xl md:rounded-full text-xs md:text-base font-bold transition-all duration-300 flex items-center justify-center ${category === cat.id
                                    ? 'text-white shadow-lg shadow-aqua-500/30'
                                    : 'text-black bg-steel-200 hover:bg-steel-300 border border-steel-200'
                                    }`}
                            >
                                {category === cat.id && (
                                    <motion.div
                                        layoutId="activeCategorySpare"
                                        className="absolute inset-0 bg-aqua-500 rounded-xl md:rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 text-center">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <MobileGestureLayout onPullDown={handlePullDown} onSwipeUp={handleSwipeUp}>
                <div className="container-custom py-6">
                    <ProductGrid
                        products={sortedProducts}
                        isLoading={isLoading || productsLoading}
                        backContext={category}
                    />
                </div>
            </MobileGestureLayout>
        </div>
    );
}
