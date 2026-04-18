'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/data/products';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import ProductGrid from '@/components/products/ProductGrid';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import { motion } from 'framer-motion';
import { Product } from '@/data/products';


type LongArmCategory = 'all' | 'long-arm-gearbox' | 'long-arm-spare';

interface LongArmClientProps {
    initialProducts: Product[];
}

const LONG_ARM_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'long-arm-gearbox', label: 'Gearboxes' },
    { id: 'long-arm-spare', label: 'Spares' }
] as const;

export default function LongArmClient({ initialProducts }: LongArmClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [category, setCategory] = useState<LongArmCategory>('all');
    const [sortBy, setSortBy] = useState<SortOption>('price-low');
    const [isLoading, setIsLoading] = useState(false);
    const manualChangeRef = useRef(false);

    // Use hook for live data with skipLoading option
    const { products: liveProducts, loading: productsLoading } = useLiveProducts(initialProducts, { skipLoading: true });

    // Sync with URL params on mount
    useEffect(() => {
        if (manualChangeRef.current) return;
        
        const catParam = searchParams.get('category');
        if (catParam === 'long-arm-gearbox' || catParam === 'long-arm-spare') {
            setCategory(catParam as LongArmCategory);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!productsLoading) {
            setIsLoading(false);
        }
    }, [productsLoading]);

    const handleCategorySelect = (cat: LongArmCategory) => {
        if (cat === category) return;
        
        manualChangeRef.current = true;
        setIsLoading(true);
        setCategory(cat);
        // Update URL to preserve state on navigation
        const params = new URLSearchParams(searchParams.toString());
        if (cat === 'all') {
            params.delete('category');
        } else {
            params.set('category', cat);
        }
        router.replace(`/long-arm?${params.toString()}`, { scroll: false });

        setTimeout(() => {
            setIsLoading(false);
            manualChangeRef.current = false;
        }, 600);
    };

    const handleSortChange = (newSort: SortOption) => {
        setIsLoading(true);
        setSortBy(newSort);
        setTimeout(() => setIsLoading(false), 300);
    };

    // Filter products
    const filteredProducts = liveProducts.filter(product => {
        // Base filter: Only process long arm gearboxes and spares
        const isLongArm = ['long-arm', 'long-arm-gearbox', 'long-arm-spare'].includes(product.category as string);
        if (!isLongArm) return false;

        if (category === 'all') return true;
        if (category === 'long-arm-gearbox') return ['long-arm-gearbox', 'long-arm'].includes(product.category as string);
        if (category === 'long-arm-spare') return ['long-arm-spare', 'long-arm'].includes(product.category as string);
        return true;
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

    const handleSwipeLeft = () => {
        if (category === 'all') handleCategorySelect('long-arm-gearbox');
        else if (category === 'long-arm-gearbox') handleCategorySelect('long-arm-spare');
    };

    const handleSwipeRight = () => {
        if (category === 'long-arm-spare') handleCategorySelect('long-arm-gearbox');
        else if (category === 'long-arm-gearbox') handleCategorySelect('all');
    };

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
                            {LONG_ARM_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.id as LongArmCategory)}
                                    className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${category === cat.id
                                        ? 'text-white'
                                        : 'text-black bg-steel-200 hover:bg-steel-300'
                                        }`}
                                >
                                    {category === cat.id && (
                                        <motion.div
                                            layoutId="activeCategoryLongArm"
                                            className="absolute inset-0 bg-aqua-500 rounded-full shadow-lg shadow-aqua-500/30"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.8 }}
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
