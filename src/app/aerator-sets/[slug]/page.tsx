'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { aeratorSets, formatPrice, calculateSavings, getProductBySlug } from '@/data/products';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useLiveProduct } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

import ImageModal from '@/components/ui/ImageModal';

export default function AeratorSetDetailPage({ params }: ProductPageProps) {
    const { slug } = use(params);
    const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
    const [isSpecsOpen, setIsSpecsOpen] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // Fetch Product Data
    const initialProduct = getProductBySlug(slug);
    const { product, loading } = useLiveProduct(initialProduct);

    // Reset Image Index on Change
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [slug]);

    if (loading) {
        return <SimpleLoadingScreen />;
    }

    if (!product) {
        // ... (keep existing not found UI)
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-cyan-50/30">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-deep-blue-900 mb-4 animate-float">Product Not Found</h1>
                    <Link href="/aerator-sets" className="btn btn-primary btn-ripple shadow-glow-cyan">
                        Browse All Aerators
                    </Link>
                </div>
            </div>
        );
    }

    const savings = calculateSavings(product.mrp, product.salePrice);

    // Derived cart state
    const cartItem = cartItems.find(item => item.id === product.id);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const isInCart = cartQuantity > 0;

    const images = product.images || [];
    const hasImages = images.length > 0;

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

    const handleIncrement = () => updateQuantity(product.id, cartQuantity + 1);
    const handleDecrement = () => {
        if (cartQuantity <= 1) {
            removeFromCart(product.id);
        } else {
            updateQuantity(product.id, cartQuantity - 1);
        }
    };

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            slug: product.slug,
            model: product.model || product.name,
            price: product.mrp,
            salePrice: product.salePrice,
            quantity: 1,
            image: product.images?.[0] || '',
            name: product.name,
            brand: product.brand,
            stock: product.stock,
            inStock: product.inStock
        });
    };

    const handlePullDown = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1200);
    };

    return (
        <>
            <MobileGestureLayout onPullDown={handlePullDown}>
                <div className="min-h-screen bg-white pt-16 pb-32">
                    {/* Compact Header */}
                    <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-steel-100 flex items-center px-4 h-14">
                        <Link href="/aerator-sets" className="flex items-center gap-2 text-steel-500 hover:text-cyan-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium text-sm">Back</span>
                        </Link>
                    </div>

                    <div className="px-0 md:container-custom md:px-4 md:py-6">
                        <div className={`grid gap-0 md:gap-8 ${hasImages ? 'lg:grid-cols-2' : ''}`}>
                            {/* Left - Image */}
                            {hasImages && (
                                <div className="bg-white aspect-square md:rounded-2xl relative overflow-hidden flex items-center justify-center p-8 border-b md:border border-cyan-100 group">
                                    {/* Ambient Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/50 to-transparent opacity-30" />

                                    <div className="relative w-full h-full">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentImageIndex}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="relative w-full h-full"
                                            >
                                                <Image
                                                    src={images[currentImageIndex]}
                                                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                                                    fill
                                                    className="object-contain"
                                                    priority
                                                />
                                                {/* Zoom Hint Overlay */}
                                                <div
                                                    className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors cursor-zoom-in flex items-center justify-center group-hover:opacity-100 opacity-0"
                                                    onClick={() => setIsImageModalOpen(true)}
                                                >
                                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm font-medium text-deep-blue-900 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                        </svg>
                                                        Tap to Zoom
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>

                                        {/* Carousel Controls */}
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={prevImage}
                                                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-20"
                                                >
                                                    <svg className="w-6 h-6 text-steel-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-20"
                                                >
                                                    <svg className="w-6 h-6 text-steel-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>

                                                {/* Dots */}
                                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                                    {images.map((_: string, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setCurrentImageIndex(idx)}
                                                            className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-deep-blue-600' : 'bg-steel-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Right - Details */}
                            <div className="px-4 py-6 md:px-0">
                                {/* Brand Badge */}
                                <div className="flex items-center gap-2 mb-3">
                                    {product.brand === 'aqualion' ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-amber-700 bg-amber-100 border border-amber-200">AQUALION</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-cyan-700 bg-cyan-100 border border-cyan-200">SEA BOSS</span>
                                    )}
                                    <span className="text-xs text-steel-500 font-medium uppercase tracking-wide">
                                        Aerator Set
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-2xl font-bold text-deep-blue-900 mb-1 leading-tight">
                                    {product.name.includes('2HP') ? (
                                        <>
                                            {product.name.split('2HP')[0]}2HP<br />
                                            <span className="text-xl md:text-2xl">{product.name.split('2HP')[1]}</span>
                                        </>
                                    ) : product.name}
                                </h1>
                                {product.model && (
                                    <p className="text-sm font-medium text-amber-600 mb-3 bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-100">
                                        Model: {product.model}
                                    </p>
                                )}

                                {/* Price */}
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-3xl font-bold text-deep-blue-900">{formatPrice(product.salePrice)}</span>
                                    {savings > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-black line-through">{formatPrice(product.mrp)}</span>
                                            <span className="text-emerald-600 text-xs font-bold">Save {formatPrice(savings)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Warranty Badge - Specific Formatting */}
                                {product.warranty && (
                                    <div className="mb-6 inline-block">
                                        <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-white to-cyan-50 border border-cyan-100 rounded-xl shadow-sm">
                                            <div className="bg-cyan-100 p-2 rounded-full shrink-0">
                                                <svg className="w-5 h-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-cyan-600 font-bold uppercase tracking-wider mb-0.5">Warranty</p>
                                                <p className="text-sm font-bold text-deep-blue-900 leading-snug">
                                                    {product.warranty.includes('Piece-to-Piece Replacement') ? (
                                                        <>
                                                            1 Year Piece-to-Piece<br />
                                                            Replacement Warranty
                                                        </>
                                                    ) : (
                                                        product.warranty
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Action Area */}
                                <div className="bg-white rounded-xl p-4 shadow-sm border border-steel-100 mb-6 sticky top-16 z-30">
                                    {isInCart ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                                                <span className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Added to Cart
                                                </span>
                                            </div>
                                            <div className="flex items-center h-12 bg-steel-50 rounded-lg border border-steel-100">
                                                <button onClick={handleDecrement} className="w-12 h-full flex items-center justify-center text-steel-600 hover:bg-white active:scale-95 transition-all rounded-l-lg">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                                </button>
                                                <span className="flex-1 text-center font-bold text-lg text-deep-blue-900">{cartQuantity}</span>
                                                <button
                                                    onClick={handleIncrement}
                                                    disabled={product.stock !== undefined && cartQuantity >= product.stock}
                                                    className={`w-12 h-full flex items-center justify-center text-steel-600 hover:bg-white active:scale-95 transition-all rounded-r-lg ${product.stock !== undefined && cartQuantity >= product.stock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                </button>
                                            </div>
                                            <Link href="/cart" className="w-full btn btn-primary bg-cyan-600 hover:bg-cyan-700 border-cyan-600 py-3 text-center text-sm shadow-none">
                                                View Cart
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={product.stock !== undefined ? product.stock <= 0 : !product.inStock}
                                                className={`flex-1 btn btn-primary py-3.5 shadow-lg active:scale-95 transition-transform ${product.stock !== undefined ? (product.stock <= 0 ? 'bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600 shadow-cyan-500/20') : (!product.inStock ? 'bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600 shadow-cyan-500/20')}`}
                                            >
                                                {(product.stock !== undefined ? product.stock <= 0 : !product.inStock) ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    )}
                                    {(product.stock !== undefined ? product.stock <= 0 : !product.inStock) && (
                                        <p className="text-center text-xs text-rose-500 font-bold mt-2 uppercase tracking-tight">Currently Unavailable</p>
                                    )}
                                    <Link
                                        href={`/compare?ids=${initialProduct?.id || product.id}`}
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-3 text-steel-600 bg-steel-50 hover:bg-steel-100 rounded-xl transition-colors font-medium border border-transparent hover:border-steel-200 group/compare"
                                    >
                                        <svg className="w-5 h-5 text-steel-400 group-hover/compare:text-aqua-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        Compare this product
                                    </Link>
                                </div>

                                {/* Components Table (New Feature) */}
                                {product.components && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-deep-blue-900 mb-3">Set Components</h3>
                                        <div className="bg-white rounded-xl border border-steel-200 overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm border-collapse">
                                                    <thead className="bg-steel-50 text-steel-500 font-semibold uppercase text-xs tracking-wider border-b border-steel-200">
                                                        <tr>
                                                            <th className="px-4 py-3 w-1/3">Component</th>
                                                            <th className="px-4 py-3">Specification</th>
                                                            <th className="px-4 py-3 w-16 text-center">Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-steel-100">
                                                        {product.components.map((comp: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-steel-50/50 transition-colors">
                                                                <td className="px-4 py-3 font-semibold text-deep-blue-800">{comp.item}</td>
                                                                <td className="px-4 py-3 text-steel-600 font-medium">{comp.spec}</td>
                                                                <td className="px-4 py-3 text-center font-bold text-deep-blue-900">{comp.quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Collapsible Specifications */}
                                {product.specifications && (
                                    <div className="border-t border-cyan-100 pt-4">
                                        <button
                                            onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                                            className="w-full flex items-center justify-between py-2 text-left"
                                        >
                                            <h3 className="text-lg font-bold text-deep-blue-900">Specifications</h3>
                                            <svg className={`w-5 h-5 text-steel-400 transition-transform ${isSpecsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <AnimatePresence>
                                            {isSpecsOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-white/80 backdrop-blur rounded-xl overflow-hidden mt-3 border border-steel-200">
                                                        <table className="w-full text-sm border-collapse">
                                                            <tbody>
                                                                {Object.entries(product.specifications).map(([key, value], index) => (
                                                                    <tr key={key} className="border-b border-steel-200 last:border-0 hover:bg-steel-50/50 transition-colors">
                                                                        <td className="px-4 py-3 font-semibold text-steel-600 bg-steel-50/30 border-r border-steel-200 w-1/3">
                                                                            {key}
                                                                        </td>
                                                                        <td className="px-4 py-3 font-medium text-deep-blue-900">
                                                                            {(value as string)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </MobileGestureLayout>

            <ImageModal
                isOpen={isImageModalOpen}
                images={product.images || []}
                initialIndex={currentImageIndex}
                onClose={() => setIsImageModalOpen(false)}
            />
        </>
    );
}
