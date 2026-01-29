'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { longArmProducts } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import ProductGrid from '@/components/products/ProductGrid';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import { motion } from 'framer-motion';

type LongArmCategory = 'all' | 'gearbox' | 'spare';

import { Suspense } from 'react';

function LongArmContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [category, setCategory] = useState<LongArmCategory>('all');
    const [sortBy, setSortBy] = useState<SortOption>('price-low');
    const [isLoading, setIsLoading] = useState(false);

    // Use hook for live data
    const { products: liveProducts, loading: productsLoading } = useLiveProducts(longArmProducts);

    useEffect(() => {
        const catParam = searchParams.get('category');
        if (catParam && ['gearbox', 'spare'].includes(catParam)) {
            setCategory(catParam as LongArmCategory);
        } else {
            setCategory('all');
        }
    }, [searchParams]);

    const handleCategorySelect = (cat: LongArmCategory) => {
        if (cat === category) return;
        setIsLoading(true);
        setCategory(cat);

        const params = new URLSearchParams(searchParams.toString());
        if (cat === 'all') {
            params.delete('category');
        } else {
            params.set('category', cat);
        }
        router.replace(`/long-arm?${params.toString()}`, { scroll: false });

        setTimeout(() => setIsLoading(false), 600);
    };

    // Filter products
    const filteredProducts = liveProducts.filter(product => {
        if (category === 'all') return true;
        if (category === 'gearbox') return product.category === 'long-arm-gearbox';
        if (category === 'spare') return product.category === 'long-arm-spare';
        return true;
    });

    const handleSortChange = (newSort: SortOption) => {
        setIsLoading(true);
        setSortBy(newSort);
        setTimeout(() => setIsLoading(false), 300);
    };

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
        toast.innerText = 'No more items to load';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    };

    const handleSwipeLeft = () => {
        if (category === 'all') handleCategorySelect('gearbox');
        else if (category === 'gearbox') handleCategorySelect('spare');
    };

    const handleSwipeRight = () => {
        if (category === 'spare') handleCategorySelect('gearbox');
        else if (category === 'gearbox') handleCategorySelect('all');
    };

    const categoriesList = [
        { id: 'all', label: 'All' },
        { id: 'gearbox', label: 'Gearboxes' },
        { id: 'spare', label: 'Spares' },
    ];

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Sticky Header with Categories and Filter */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-aqua-100/50 pt-16 md:pt-20 pb-2 transition-all duration-300">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h1 className="text-xl font-bold text-deep-blue-900">Long Arm</h1>
                        <FilterDropdown sortBy={sortBy} onSortChange={handleSortChange} />
                    </div>

                    <div className="overflow-x-auto no-scrollbar py-2">
                        <div className="flex gap-2 px-1 min-w-max">
                            {categoriesList.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.id as LongArmCategory)}
                                    className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${category === cat.id
                                        ? 'text-white shadow-lg shadow-aqua-500/30'
                                        : 'text-black bg-steel-200 hover:bg-steel-300'
                                        }`}
                                >
                                    {category === cat.id && (
                                        <motion.div
                                            layoutId="activeCategoryLongArm"
                                            className="absolute inset-0 bg-aqua-500 rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <MobileGestureLayout
                onPullDown={handlePullDown}
                onSwipeUp={handleSwipeUp}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
            >
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

export default function LongArmPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white pt-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div></div>}>
            <LongArmContent />
        </Suspense>
    );
}
