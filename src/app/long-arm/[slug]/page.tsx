'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { longArmProducts, formatPrice, calculateSavings } from '@/data/products';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useLiveProduct } from '@/hooks/useLiveProducts';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

export default function LongArmDetailPage({ params }: ProductPageProps) {
    const { slug } = use(params);
    const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
    const [isSpecsOpen, setIsSpecsOpen] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const searchParams = useSearchParams();

    // Fetch Product Data
    const initialProduct = longArmProducts.find(p => p.slug === slug);
    const { product, loading } = useLiveProduct(initialProduct);

    // Derived cart state
    const cartItem = cartItems.find(item => item.id === product?.id);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const isInCart = cartQuantity > 0;

    // Reset Image Index on Change
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [slug]);

    if (loading) {
        return <SimpleLoadingScreen />;
    }

    if (!product) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-purple-50/30">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-deep-blue-900 mb-4 animate-float">Product Not Found</h1>
                    <Link href="/long-arm" className="btn btn-primary btn-ripple shadow-glow-purple">
                        Browse Long Arm Products
                    </Link>
                </div>
            </div>
        );
    }

    // Product derived data
    const savings = calculateSavings(product.mrp, product.salePrice);
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

    const fromCategory = searchParams.get('from');

    const backLink = fromCategory && fromCategory !== 'all'
        ? `/long-arm?category=${fromCategory}`
        : '/long-arm';

    const backLabel = fromCategory
        ? (fromCategory === 'all' ? 'All' : (fromCategory === 'gearbox' ? 'Gearboxes' : 'Spares'))
        : (product.category === 'long-arm-gearbox' ? 'Gearboxes' : product.category === 'long-arm-spare' ? 'Spares' : 'Long Arm');

    return (
        <MobileGestureLayout onPullDown={handlePullDown}>
            <div className="min-h-screen bg-white pt-16 pb-32">
                {/* Compact Header */}
                <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-steel-100 flex items-center px-4 h-14">
                    <Link href={backLink} className="flex items-center gap-2 text-steel-500 hover:text-purple-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium text-sm">Back</span>
                    </Link>
                </div>

                <div className="px-0 md:container-custom md:px-4 md:py-6">
                    <div className={`grid gap-0 md:gap-8 ${hasImages ? 'lg:grid-cols-2' : ''}`}>
                        {/* Left - Image Liquid Card */}
                        {hasImages && (
                            <div className="bg-white aspect-square md:rounded-2xl relative overflow-hidden flex items-center justify-center p-8 border-b md:border border-purple-100 group">
                                {/* Ambient Glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-transparent opacity-30" />

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

                            {/* Title */}
                            <h1 className="text-2xl font-bold text-deep-blue-900 mb-2 leading-tight">
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="flex items-baseline gap-3 mb-6">
                                <span className="text-3xl font-bold text-deep-blue-900">{formatPrice(product.salePrice)}</span>
                                {savings > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-black line-through">{formatPrice(product.mrp)}</span>
                                        <span className="text-emerald-600 text-xs font-bold">Save {formatPrice(savings)}</span>
                                    </div>
                                )}
                            </div>

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
                                        <div className="flex items-center h-12 bg-purple-50 rounded-lg border border-purple-100">
                                            <button onClick={handleDecrement} className="w-12 h-full flex items-center justify-center text-purple-600 hover:bg-white active:scale-95 transition-all rounded-l-lg">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                            </button>
                                            <span className="flex-1 text-center font-bold text-lg text-deep-blue-900">{cartQuantity}</span>
                                            <button
                                                onClick={handleIncrement}
                                                disabled={product.stock !== undefined && cartQuantity >= product.stock}
                                                className={`w-12 h-full flex items-center justify-center text-purple-600 hover:bg-white active:scale-95 transition-all rounded-r-lg ${product.stock !== undefined && cartQuantity >= product.stock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </button>
                                        </div>
                                        <Link href="/cart" className="w-full btn btn-primary bg-purple-600 hover:bg-purple-700 border-purple-600 py-3 text-center text-sm shadow-none">
                                            View Cart
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={product.stock !== undefined ? product.stock <= 0 : !product.inStock}
                                            className={`flex-1 btn btn-primary py-3.5 shadow-lg active:scale-95 transition-transform ${product.stock !== undefined ? (product.stock <= 0 ? 'bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 border-purple-600 shadow-purple-500/20') : (!product.inStock ? 'bg-slate-100 text-slate-400 border-slate-200 shadow-none cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 border-purple-600 shadow-purple-500/20')}`}
                                        >
                                            {(product.stock !== undefined ? product.stock <= 0 : !product.inStock) ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Collapsible Specifications */}
                            {product.specifications && (
                                <div className="border-t border-purple-100 pt-4">
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
    );
}
