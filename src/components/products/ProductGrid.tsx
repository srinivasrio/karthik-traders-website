'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/data/products';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface StockInfo {
    slug: string;
    stock: number;
    is_active: boolean;
}

interface ProductGridProps {
    products: Product[];
    onAddToCart?: (product: Product) => void;
    onCompare?: (product: Product) => void;
    comparingIds?: string[];
    isLoading?: boolean;
    className?: string;
    cardVariant?: 'default' | 'aerator';
    backContext?: string;
}

export default function ProductGrid({
    products,
    onAddToCart,
    onCompare,
    comparingIds = [],
    isLoading = false,
    className = '',
    cardVariant = 'default',
    backContext,
}: ProductGridProps) {
    const [stockData, setStockData] = useState<Record<string, StockInfo>>({});

    useEffect(() => {
        const fetchStockData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('slug, stock, is_active');

                if (data && !error) {
                    const stockMap: Record<string, StockInfo> = {};
                    data.forEach((item: StockInfo) => {
                        stockMap[item.slug] = item;
                    });
                    setStockData(stockMap);
                }
            } catch (err) {
                console.error('Error fetching stock:', err);
            }
        };

        fetchStockData();
    }, []);

    if (products.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-steel-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-steel-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-deep-blue-800 mb-2">No Products Found</h3>
                <p className="text-steel-500">Try adjusting your filters or browse all products.</p>
            </div>
        );
    }

    return (
        <div className={`product-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 ${className}`}>
            {products.map((product, index) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 4}
                    onAddToCart={onAddToCart}
                    variant={cardVariant}
                    backContext={backContext}
                    stockInfo={stockData[product.slug] || null}
                />
            ))}
        </div>
    );
}

