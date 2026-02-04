'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brand } from '@/data/products';
import ProductGrid from '@/components/products/ProductGrid';
import { useLiveProducts } from '@/hooks/useLiveProducts';
import BrandFilter from '@/components/products/BrandFilter';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import FilterDropdown, { SortOption } from '@/components/ui/FilterDropdown';
import { Product } from '@/data/products';

interface AeratorSetsClientProps {
    initialProducts: Product[];
}

export default function AeratorSetsClient({ initialProducts }: AeratorSetsClientProps) {
    const searchParams = useSearchParams();
    const brandParam = searchParams.get('brand') as Brand | null;

    const [selectedBrand, setSelectedBrand] = useState<Brand | 'all'>(brandParam || 'all');
    const [sortBy, setSortBy] = useState<SortOption>('price-low');
    const [comparingIds, setComparingIds] = useState<string[]>([]);

    // Use custom hook with preloaded data and skip initial loading
    const { products, loading: productsLoading } = useLiveProducts(initialProducts, { skipLoading: true });

    // Initialize loading to false since we have server data
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Only trigger loading if the hook triggers it (e.g. background re-fetch)
        // But since we skip initial loading, this mostly stays false or true-then-false
        if (!productsLoading) {
            setIsLoading(false);
        }
    }, [productsLoading]);

    useEffect(() => {
        if (brandParam) {
            handleBrandSelect(brandParam);
        }
    }, [brandParam]);

    const handleBrandSelect = (brand: Brand | 'all') => {
        if (brand === selectedBrand) return;
        setIsLoading(true);
        setSelectedBrand(brand);
        // Simulate network latency for skeleton effect
        setTimeout(() => setIsLoading(false), 600);
    };

    const handleSortChange = (newSort: SortOption) => {
        setIsLoading(true);
        setSortBy(newSort);
        setTimeout(() => setIsLoading(false), 300);
    };

    // Filter products
    const filteredProducts = products.filter(product => {
        if (selectedBrand === 'all') return true;
        return product.brand === selectedBrand;
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

    // Handle compare
    const handleCompare = (product: { id: string }) => {
        setComparingIds(prev => {
            if (prev.includes(product.id)) {
                return prev.filter(id => id !== product.id);
            }
            if (prev.length >= 3) {
                alert('You can compare up to 3 products at a time');
                return prev;
            }
            return [...prev, product.id];
        });
    };

    // Gestures
    const handleSwipeLeft = () => {
        if (selectedBrand === 'aqualion') handleBrandSelect('seaboss');
        else if (selectedBrand === 'all') handleBrandSelect('seaboss');
    };

    const handleSwipeRight = () => {
        if (selectedBrand === 'seaboss') handleBrandSelect('aqualion');
        else if (selectedBrand === 'aqualion') handleBrandSelect('all');
    };

    const handlePullDown = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1000);
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            <BrandFilter selectedBrand={selectedBrand as any} onSelectBrand={handleBrandSelect}>
                <div className="flex items-center justify-between px-2">
                    <h1 className="text-2xl font-bold text-deep-blue-900">Aerator Sets</h1>
                    <FilterDropdown sortBy={sortBy} onSortChange={handleSortChange} />
                </div>
            </BrandFilter>

            <MobileGestureLayout
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onPullDown={handlePullDown}
            >
                <div className="container-custom py-6">
                    <ProductGrid
                        products={sortedProducts}
                        onCompare={handleCompare}
                        comparingIds={comparingIds}
                        isLoading={isLoading}
                        className="gap-4 md:gap-8 gap-y-6"
                        cardVariant="aerator"
                    />
                </div>
            </MobileGestureLayout>
        </div>
    );
}
