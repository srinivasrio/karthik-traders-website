'use client';

import { useState, useEffect, Suspense } from 'react';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { aeratorSets, Product, formatPrice, calculateSavings } from '@/data/products';

function CompareContent() {
    const searchParams = useSearchParams();
    const idsParam = searchParams.get('ids');

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (idsParam) {
            const ids = idsParam.split(',');
            setSelectedIds(ids);
        }
    }, [idsParam]);

    useEffect(() => {
        const products = aeratorSets.filter(p => selectedIds.includes(p.id));
        setSelectedProducts(products);
    }, [selectedIds]);

    const handleAddProduct = (productId: string) => {
        if (selectedIds.length >= 2) {
            alert('You can compare up to 2 products');
            return;
        }
        if (!selectedIds.includes(productId)) {
            setSelectedIds([...selectedIds, productId]);
        }
    };

    const handleRemoveProduct = (productId: string) => {
        setSelectedIds(selectedIds.filter(id => id !== productId));
    };

    // All specification keys
    const allSpecKeys = Array.from(
        new Set(
            selectedProducts.flatMap(p =>
                p.specifications ? Object.keys(p.specifications) : []
            )
        )
    ).filter(key => key !== 'Warranty');

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-white pt-24">
            <div className="container-custom py-8">
                {/* Product Selector - Always visible when slots available */}
                {selectedProducts.length < 2 && (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="mb-12"
                    >
                        <h3 className="text-lg font-semibold text-deep-blue-800 mb-6 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-aqua-100 text-aqua-700 text-xs font-bold">
                                {selectedProducts.length + 1}
                            </span>
                            Select Product to Compare ({selectedProducts.length}/2)
                        </h3>

                        <div className="grid grid-cols-3 gap-2 md:gap-4">
                            {aeratorSets.map((product) => {
                                const isSelected = selectedIds.includes(product.id);
                                const isDisabled = selectedProducts.length >= 2 && !isSelected;

                                return (
                                    <motion.button
                                        key={product.id}
                                        variants={item}
                                        onClick={() => isSelected ? handleRemoveProduct(product.id) : handleAddProduct(product.id)}
                                        disabled={!isSelected && isDisabled}
                                        className={`group flex flex-col items-center text-center bg-white rounded-xl p-2 md:p-4 border shadow-sm transition-all h-full relative overflow-hidden ${isSelected
                                            ? 'border-aqua-500 bg-aqua-50/50 opacity-100 ring-1 ring-aqua-500'
                                            : isDisabled
                                                ? 'border-steel-100 opacity-50 cursor-not-allowed grayscale'
                                                : 'border-steel-200 hover:shadow-md hover:border-aqua-500 active:scale-[0.98]'
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 z-10 bg-aqua-500 text-white rounded-full p-0.5 shadow-sm">
                                                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="w-full flex flex-col justify-center h-full py-1">
                                            <div className="mb-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider ${product.brand === 'aqualion'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                    }`}>
                                                    <img
                                                        src={product.brand === 'aqualion' ? '/images/logos/aqualion-logo.svg' : '/images/logos/seaboss-logo.svg'}
                                                        alt={product.brand}
                                                        className="h-3 w-auto md:h-4"
                                                    />
                                                    {product.brand === 'aqualion' ? 'Aqualion' : 'Sea Boss'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs md:text-sm font-bold text-deep-blue-900 leading-tight mb-1 group-hover:text-aqua-700 transition-colors line-clamp-2">
                                                {product.model}
                                            </h4>
                                            {product.specifications?.['Gearbox'] && (
                                                <p className="text-[10px] md:text-xs text-steel-500 font-medium mb-1">
                                                    {product.specifications['Gearbox'].replace(' Gearbox', '')}
                                                </p>
                                            )}
                                            <p className="hidden md:block text-xs text-steel-500 line-clamp-1 mb-1">{product.name}</p>
                                            <div className="mt-auto pt-1">
                                                <p className="text-[10px] text-black">MRP: <span className="line-through">{formatPrice(product.mrp)}</span></p>
                                                <p className="text-xs md:text-sm font-bold text-green-600">{formatPrice(product.salePrice)}</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Comparison Table */}
                {selectedProducts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-steel-200 overflow-hidden shadow-sm"
                    >
                        {/* Products Header */}
                        <div className="grid grid-cols-[100px_repeat(2,1fr)] md:grid-cols-[200px_repeat(3,1fr)] border-b border-steel-200">
                            <div className="p-2 md:p-4 bg-steel-50 font-semibold text-steel-600 text-xs md:text-base flex items-center">
                                Product
                            </div>
                            {selectedProducts.map((product, idx) => (
                                <div key={product.id} className={`p-2 md:p-4 border-l border-steel-200 ${idx >= 2 ? 'hidden md:block' : ''}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider ${product.brand === 'aqualion'
                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                            }`}>
                                            <img
                                                src={product.brand === 'aqualion' ? '/images/logos/aqualion-logo.svg' : '/images/logos/seaboss-logo.svg'}
                                                alt={product.brand}
                                                className="h-3 w-auto md:h-4"
                                            />
                                            {product.brand === 'aqualion' ? 'Aqualion' : 'Sea Boss'}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveProduct(product.id)}
                                            className="text-steel-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                                        >
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="w-16 h-16 mb-2 mx-auto md:mx-0">
                                        <img
                                            src={product.images?.[0] || '/placeholder.png'}
                                            alt={product.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <h4 className="font-semibold text-deep-blue-800 text-xs md:text-sm mb-1 line-clamp-2">
                                        {product.model}
                                    </h4>
                                    <p className="text-[10px] md:text-xs text-steel-500 line-clamp-2 hidden md:block">{product.name}</p>
                                </div>
                            ))}
                            {/* Empty slots - Hide on mobile if they would be the 3rd column */}
                            {Array.from({ length: 2 - selectedProducts.length }).map((_, i) => {
                                // Calculate actual index in the grid (selectedProducts.length + i)
                                // If index (0-based) is 2, hide on mobile
                                const gridIndex = selectedProducts.length + i;
                                return (
                                    <div key={`empty-${i}`} className={`p-2 md:p-4 border-l border-steel-200 bg-steel-50 flex items-center justify-center ${gridIndex >= 2 ? 'hidden md:block' : ''}`}>
                                        <div className="text-center text-steel-400 text-xs md:text-sm italic">
                                            Select from above
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Price Row */}
                        <div className="grid grid-cols-[100px_repeat(2,1fr)] md:grid-cols-[200px_repeat(3,1fr)] border-b border-steel-200">
                            <div className="p-2 md:p-4 bg-steel-50 font-semibold text-steel-600 text-xs md:text-base flex items-center">
                                Price
                            </div>
                            {selectedProducts.map((product, idx) => (
                                <div key={product.id} className={`p-2 md:p-4 border-l border-steel-200 ${idx >= 2 ? 'hidden md:block' : ''}`}>
                                    <p className="text-sm md:text-xl font-bold text-green-600">{formatPrice(product.salePrice)}</p>
                                    <p className="text-[10px] md:text-sm text-black">MRP: <span className="line-through">{formatPrice(product.mrp)}</span></p>
                                    <p className="text-[10px] md:text-xs text-green-600 mt-1 font-medium">
                                        Save {formatPrice(calculateSavings(product.mrp, product.salePrice))}
                                    </p>
                                </div>
                            ))}
                            {Array.from({ length: 2 - selectedProducts.length }).map((_, i) => {
                                const gridIndex = selectedProducts.length + i;
                                return (
                                    <div key={`empty-price-${i}`} className={`p-2 md:p-4 border-l border-steel-200 bg-steel-50 ${gridIndex >= 2 ? 'hidden md:block' : ''}`} />
                                );
                            })}
                        </div>

                        {/* Specification Rows */}
                        {allSpecKeys.map((key, index) => (
                            <div
                                key={key}
                                className={`grid grid-cols-[100px_repeat(2,1fr)] md:grid-cols-[200px_repeat(3,1fr)] border-b border-steel-200 ${index % 2 === 0 ? 'bg-steel-50/50' : ''
                                    }`}
                            >
                                <div className="p-2 md:p-4 bg-steel-50 font-medium text-steel-600 text-xs md:text-sm break-words flex items-center">
                                    {key}
                                </div>
                                {selectedProducts.map((product, idx) => (
                                    <div key={product.id} className={`p-2 md:p-4 border-l border-steel-200 text-xs md:text-sm text-deep-blue-800 ${idx >= 2 ? 'hidden md:block' : ''}`}>
                                        {product.specifications?.[key] || '-'}
                                    </div>
                                ))}
                                {Array.from({ length: 2 - selectedProducts.length }).map((_, i) => {
                                    const gridIndex = selectedProducts.length + i;
                                    return (
                                        <div key={`empty-${key}-${i}`} className={`p-2 md:p-4 border-l border-steel-200 bg-steel-50 ${gridIndex >= 2 ? 'hidden md:block' : ''}`} />
                                    );
                                })}
                            </div>
                        ))}

                        {/* Warranty Row */}
                        <div className="grid grid-cols-[100px_repeat(2,1fr)] md:grid-cols-[200px_repeat(3,1fr)] border-b border-steel-200">
                            <div className="p-2 md:p-4 bg-steel-50 font-semibold text-steel-600 text-xs md:text-base flex items-center">
                                Warranty
                            </div>
                            {selectedProducts.map((product, idx) => (
                                <div key={product.id} className={`p-2 md:p-4 border-l border-steel-200 ${idx >= 2 ? 'hidden md:block' : ''}`}>
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs md:text-sm">
                                        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        {product.warranty}
                                    </span>
                                </div>
                            ))}
                            {Array.from({ length: 2 - selectedProducts.length }).map((_, i) => {
                                const gridIndex = selectedProducts.length + i;
                                return (
                                    <div key={`empty-warranty-${i}`} className={`p-2 md:p-4 border-l border-steel-200 bg-steel-50 ${gridIndex >= 2 ? 'hidden md:block' : ''}`} />
                                );
                            })}
                        </div>

                        {/* Action Row */}
                        <div className="grid grid-cols-[100px_repeat(2,1fr)] md:grid-cols-[200px_repeat(3,1fr)]">
                            <div className="p-2 md:p-4 bg-steel-50 font-semibold text-steel-600 text-xs md:text-base flex items-center">
                                Action
                            </div>
                            {selectedProducts.map((product, idx) => (
                                <div key={product.id} className={`p-2 md:p-4 border-l border-steel-200 ${idx >= 2 ? 'hidden md:block' : ''}`}>
                                    <Link
                                        href={`/aerator-sets/${product.slug}`}
                                        className="btn btn-primary w-full text-xs md:text-sm py-1.5 md:py-2"
                                    >
                                        View
                                    </Link>
                                </div>
                            ))}
                            {Array.from({ length: 2 - selectedProducts.length }).map((_, i) => {
                                const gridIndex = selectedProducts.length + i;
                                return (
                                    <div key={`empty-action-${i}`} className={`p-2 md:p-4 border-l border-steel-200 bg-steel-50 ${gridIndex >= 2 ? 'hidden md:block' : ''}`} />
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={<SimpleLoadingScreen />}>
            <CompareContent />
        </Suspense>
    );
}
