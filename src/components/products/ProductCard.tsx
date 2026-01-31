'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, formatPrice, calculateSavings } from '@/data/products';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
    product: Product;
    onAddToCart?: (product: Product) => void;
    onCompare?: (product: Product) => void;
    isComparing?: boolean;
    variant?: 'default' | 'aerator';
    backContext?: string;
    priority?: boolean;
    stockInfo?: { stock: number; is_active: boolean } | null;
}

export default function ProductCard({
    product,
    onAddToCart,
    variant = 'default',
    backContext,
    priority = false,
    stockInfo,
}: Omit<ProductCardProps, 'onCompare' | 'isComparing'>) {
    const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
    const cartItem = cartItems.find(item => item.id === product.id);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const savings = calculateSavings(product.mrp, product.salePrice);
    const isInCart = cartQuantity > 0;

    // Auto Slideshow State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const images = product.images || [];
    const hasImages = images.length > 0;

    // Auto Slideshow Logic
    useEffect(() => {
        if (!hasImages || images.length <= 1 || !isAutoPlaying) return;

        // Randomize interval to prevent sync (3s - 5s)
        const delay = 3000 + Math.random() * 2000;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, delay);

        return () => clearInterval(interval);
    }, [hasImages, images.length, isAutoPlaying]);

    const handleManualSlide = (direction: 'next' | 'prev', e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAutoPlaying(false); // STOP auto-slideshow

        if (direction === 'next') {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        } else {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    // Swipe Support
    const [touchStart, setTouchStart] = useState(0);
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        if (Math.abs(touchStart - touchEnd) > 50) { // Min swipe distance
            setIsAutoPlaying(false);
            if (touchStart - touchEnd > 50) {
                // Swipe Left -> Next
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
            } else {
                // Swipe Right -> Prev
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
            }
        }
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateQuantity(product.id, cartQuantity + 1);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (cartQuantity <= 1) {
            removeFromCart(product.id);
        } else {
            updateQuantity(product.id, cartQuantity - 1);
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            id: product.id,
            model: product.model || product.name,
            price: product.mrp,
            salePrice: product.salePrice,
            quantity: 1,
            image: product.images?.[0] || '',
            images: product.images || [],
            name: product.name,
            stock: product.stock,
            inStock: product.inStock
        });
        if (onAddToCart) onAddToCart(product);
    };

    const getCategoryLink = () => {
        const baseLink = (() => {
            switch (product.category) {
                case 'aerator-set': return `/aerator-sets/${product.slug}`;
                case 'motor':
                case 'worm-gearbox':
                case 'bevel-gearbox': return `/products/${product.slug}`;
                case 'motor-cover':
                case 'float':
                case 'fan':
                case 'frame':
                case 'rod':
                case 'kit-box': return `/spares/${product.slug}`;
                case 'long-arm-gearbox':
                case 'long-arm-spare': return `/long-arm/${product.slug}`;
                default: return `/products/${product.slug}`;
            }
        })();

        return backContext ? `${baseLink}?from=${backContext}` : baseLink;
    };

    const getHighlight = () => {
        const parts: string[] = [];
        if (product.specifications) {
            if (product.specifications['Motor Power']) parts.push(product.specifications['Motor Power']);
            if (product.specifications['Frame Material']) parts.push(product.specifications['Frame Material']);
        }
        if (product.warranty) parts.push(product.warranty.toLowerCase().includes('warranty') ? product.warranty : `${product.warranty} Warranty`);
        return parts.slice(0, 3).join(' | ') || product.features[0]?.substring(0, 30);
    };

    return (
        <div className="h-full">
            <Link href={getCategoryLink()} className="block group h-full">
                {/* CARD CONTAINER: Fixed Height & Overflow Hidden */}
                <div className={`product-card bg-white rounded-[16px] border overflow-hidden relative group transition-all duration-300 h-full flex flex-col ${isInCart ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-steel-100 hover:border-aqua-200'}`}>

                    {/* Active Cart Indicator Overlay - ANIMATION CONTAINED via absolute positioning */}
                    <AnimatePresence>
                        {isInCart && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-green-50/10 pointer-events-none z-0"
                            />
                        )}
                    </AnimatePresence>

                    {/* IMAGE SECTION: Variable Height */}
                    <div
                        className={`relative w-full ${variant === 'aerator' ? 'h-[180px] md:h-[200px]' : 'h-[150px] md:h-[180px]'} bg-white p-2 shrink-0`}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Brand Badges - Absolute (No Layout Shift) */}
                        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                            {product.brand === 'aqualion' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200">AQUALION</span>
                            )}
                            {product.brand === 'seaboss' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-aqua-100 text-aqua-700 rounded-full border border-aqua-200">SEA BOSS</span>
                            )}
                            {product.badge && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${product.badge === 'Best Selling' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    product.badge === 'Limited Stock' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                    {product.badge}
                                </span>
                            )}
                        </div>

                        {/* Savings Badge - Absolute */}
                        {savings > 0 && (
                            <div className="absolute top-2 right-2 z-10">
                                <div className="px-1.5 py-0.5 text-[10px] font-bold bg-white/90 text-emerald-600 rounded-full border border-emerald-100">
                                    -{Math.round((savings / product.mrp) * 100)}%
                                </div>
                            </div>
                        )}

                        {/* Image Container - Fixed 100% of parent */}
                        <div className="relative w-full h-full group/image">
                            {hasImages ? (
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={currentImageIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 p-1"
                                    >
                                        <Image
                                            src={images[currentImageIndex]}
                                            alt={product.name}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            priority={priority && currentImageIndex === 0}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <a
                                    href="tel:+919963840058"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full h-full flex flex-col items-center justify-center bg-steel-50 text-steel-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors"
                                >
                                    <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-[10px] font-bold uppercase">Call Now</span>
                                </a>
                            )}

                            {/* Manual Controls - Absolute */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onMouseDown={(e) => handleManualSlide('prev', e)}
                                        onClick={(e) => e.preventDefault()}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 p-1 bg-white/80 rounded-full shadow-sm opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                                    >
                                        <svg className="w-4 h-4 text-steel-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button
                                        onMouseDown={(e) => handleManualSlide('next', e)}
                                        onClick={(e) => e.preventDefault()}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-white/80 rounded-full shadow-sm opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                                    >
                                        <svg className="w-4 h-4 text-steel-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* CONTENT SECTION: FIXED STRUCTURE */}
                    <div className="flex-1 flex flex-col min-w-0 p-2.5 md:p-3 bg-white relative z-10 border-t border-steel-50">
                        {/* Title: 2 lines with Flexbox for mobile robustness */}
                        <h3 className="font-semibold text-deep-blue-900 !text-[11px] md:!text-[13px] leading-tight min-h-[2.5rem] mb-1.5">
                            {product.name.includes('2HP') ? (
                                <span className="flex flex-col">
                                    <span>{product.name.split('2HP')[0].trim()} 2HP</span>
                                    <span>{product.name.split('2HP')[1].trim()}</span>
                                </span>
                            ) : (
                                <span className="line-clamp-2">{product.name}</span>
                            )}
                        </h3>

                        {/* Model Number */}
                        {product.model && (
                            <p className="text-[10px] font-medium text-amber-600 mb-1.5 leading-tight">
                                Model: {product.model}
                            </p>
                        )}

                        {/* Highlight: Custom for Aerator (3 lines), standard for others (1 line truncate) */}
                        {variant === 'aerator' ? (
                            <div className="text-[10px] text-steel-500 min-w-0 mb-2 leading-tight flex flex-col gap-0.5 mt-1">
                                <span className="font-semibold text-deep-blue-700">
                                    {product.specifications?.['Frame Material'] || product.features[0]?.substring(0, 25)}
                                </span>
                                {product.warranty?.includes('Piece-to-Piece') ? (
                                    <>
                                        <span>1 Year Piece-to-Piece</span>
                                        <span>Replacement Warranty</span>
                                    </>
                                ) : (
                                    <span>{product.warranty ? (product.warranty.toLowerCase().includes('warranty') ? product.warranty : `${product.warranty} Warranty`) : getHighlight()}</span>
                                )}
                            </div>
                        ) : (
                            <p className="text-[10px] text-steel-500 truncate min-w-0 h-[1rem] mb-2">
                                {getHighlight()}
                            </p>
                        )}

                        {/* Flexible Spacer to push Footer down */}
                        <div className="flex-grow"></div>

                        {/* Price Section: Fixed Height */}
                        <div className="flex items-baseline gap-2 mb-1 h-[1.5rem]">
                            <span className="text-sm md:text-base font-bold text-deep-blue-950">{formatPrice(product.salePrice)}</span>
                            <span className="text-xs text-black line-through">{formatPrice(product.mrp)}</span>
                        </div>

                        {/* Stock Availability Badge */}
                        <div className="mb-2">
                            {stockInfo ? (
                                !stockInfo.is_active || stockInfo.stock <= 0 ? (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
                                        <div className="w-full py-1.5 bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest text-center shadow-lg transform -rotate-12 border-y border-white/20">
                                            Out of Stock
                                        </div>
                                    </div>
                                ) : null
                            ) : (product.stock !== undefined && product.stock <= 0) || product.inStock === false ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center p-2">
                                    <div className="w-full py-1.5 bg-rose-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest text-center shadow-lg transform -rotate-12 border-y border-white/20">
                                        Out of Stock
                                    </div>
                                </div>
                            ) : null}
                            {stockInfo ? (
                                stockInfo.is_active && stockInfo.stock > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        In Stock
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-red-100 text-red-600 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        Out of Stock
                                    </span>
                                )
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    In Stock
                                </span>
                            )}
                        </div>

                        {/* Cart Actions: STRICT Fixed Height h-8 mobile / h-9 desktop */}
                        <div className="h-8 md:h-9 w-full">
                            {isInCart ? (
                                <div
                                    className="flex items-center justify-between bg-green-600 text-white rounded-lg shadow-lg shadow-green-500/30 overflow-hidden h-full w-full"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                >
                                    <button
                                        onClick={handleDecrement}
                                        className="w-10 h-full flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="text-sm font-bold flex-1 text-center select-none">{cartQuantity}</span>
                                    <button
                                        onClick={handleIncrement}
                                        disabled={product.stock !== undefined && cartQuantity >= product.stock}
                                        className={`w-10 h-full flex items-center justify-center hover:bg-green-700 active:bg-green-800 transition-colors ${product.stock !== undefined && cartQuantity >= product.stock ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={stockInfo ? (stockInfo.stock <= 0 || !stockInfo.is_active) : (product.stock !== undefined ? product.stock <= 0 : !product.inStock)}
                                    className={`w-full h-full btn btn-sm btn-ripple shadow-lg shadow-aqua-500/20 flex items-center justify-center gap-2 rounded-lg text-sm font-medium ${(stockInfo ? (stockInfo.stock <= 0 || !stockInfo.is_active) : (product.stock !== undefined ? product.stock <= 0 : !product.inStock))
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'btn-primary'
                                        }`}
                                >
                                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {(stockInfo ? (stockInfo.stock <= 0 || !stockInfo.is_active) : (product.stock !== undefined ? product.stock <= 0 : !product.inStock)) ? 'No Stock' : 'Add'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
