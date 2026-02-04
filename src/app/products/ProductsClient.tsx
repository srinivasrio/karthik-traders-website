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

type CategoryFilter = 'all' | 'motors' | 'gearboxes';

interface ProductsClientProps {
    initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [category, setCategory] = useState<CategoryFilter>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const cat = params.get('category');
            if (cat === 'motors' || cat === 'gearboxes') return cat;
        }
        return 'all';
    });
    const [sortBy, setSortBy] = useState<SortOption>('price-low');
    const [isLoading, setIsLoading] = useState(false);

    // Use hook for live data with skipLoading options
    const { products: liveProducts, loading: productsLoading } = useLiveProducts(initialProducts, { skipLoading: true });

    // Sync with URL params on mount
    useEffect(() => {
        const catParam = searchParams.get('category');
        if (catParam === 'motors' || catParam === 'gearboxes') {
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
        router.replace(`/products?${params.toString()}`, { scroll: false });

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
        if (category === 'motors') return product.category === 'motor';
        if (category === 'gearboxes') return product.category === 'worm-gearbox' || product.category === 'bevel-gearbox';
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

    // Gestures
    const handleSwipeLeft = () => {
        if (category === 'all') handleCategorySelect('motors');
        else if (category === 'motors') handleCategorySelect('gearboxes');
    };

    const handleSwipeRight = () => {
        if (category === 'gearboxes') handleCategorySelect('motors');
        else if (category === 'motors') handleCategorySelect('all');
    };

    const handlePullDown = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1000);
    };



    const categoriesList = [
        { id: 'all', label: 'All' },
        { id: 'motors', label: 'Motors' },
        { id: 'gearboxes', label: 'Gearboxes' },
    ];

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Sticky Category Filter */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-aqua-100/50 pb-2 pt-16 md:pt-20 transition-all duration-300">
                <div className="container-custom">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h1 className="text-2xl font-bold text-deep-blue-900">Motors & Gearboxes</h1>
                        <FilterDropdown sortBy={sortBy} onSortChange={handleSortChange} />
                    </div>
                </div>
                <div className="container-custom overflow-x-auto no-scrollbar py-2">
                    <div className="flex gap-2 px-1 min-w-max">
                        {categoriesList.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id as CategoryFilter)}
                                className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${category === cat.id
                                    ? 'text-white shadow-lg shadow-aqua-500/30'
                                    : 'text-black bg-steel-200 hover:bg-steel-300'
                                    }`}
                            >
                                {category === cat.id && (
                                    <motion.div
                                        layoutId="activeCategory"
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

            <MobileGestureLayout
                onPullDown={handlePullDown}

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
