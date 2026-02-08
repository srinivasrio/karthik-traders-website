'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { validateCoupon } from '@/app/actions/validateCoupon'; // Import server action
import { motion, AnimatePresence } from 'framer-motion';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';

interface CartItem extends Product {
    quantity: number;
}

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, clearCart, applyCoupon, coupon, discountAmount, finalPrice } = useCart();
    const [isLoading, setIsLoading] = useState(true);
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const removeItem = (productId: string) => {
        removeFromCart(productId);
        if (cartItems.length <= 1) {
            applyCoupon(null); // Clear coupon if cart becomes empty
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setIsValidating(true);
        setCouponError('');
        setSuccessMessage('');

        try {
            const productIds = cartItems.map(item => item.id);
            const result = await validateCoupon(couponInput, productIds);

            if (result.isValid && result.coupon) {
                applyCoupon(result.coupon);
                setSuccessMessage(`Coupon '${result.coupon.code}' applied!`);
                setCouponInput('');
            } else {
                setCouponError(result.error || 'Invalid coupon');
                applyCoupon(null);
            }
        } catch (err) {
            setCouponError('Failed to validate coupon');
            console.error(err);
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveCoupon = () => {
        applyCoupon(null);
        setCouponInput('');
        setSuccessMessage('');
        setCouponError('');
    };

    const handlePullDown = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 1000);
    };

    const subtotal = cartItems.reduce((sum, item) => sum + ((Number(item.salePrice) || Number(item.price) || 0) * item.quantity), 0);
    const totalMrp = cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0);
    const totalSavings = totalMrp - subtotal;

    if (isLoading) {
        return <SimpleLoadingScreen />;
    }

    return (
        <MobileGestureLayout onPullDown={handlePullDown}>
            <div className="min-h-screen bg-steel-50/30 pt-16 pb-32 px-3 max-w-xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-base font-bold text-deep-blue-900">My Cart <span className='text-steel-400 font-normal text-xs'>({cartItems.length})</span></h1>
                    {cartItems.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-white shadow-soft flex items-center justify-center mb-3">
                            <span className="text-xl">🛒</span>
                        </div>
                        <h2 className="text-base font-bold text-deep-blue-900 mb-1">Your cart is empty</h2>
                        <p className="text-[10px] text-steel-500 mb-4">Start adding items to build your order.</p>
                        <Link href="/aerator-sets">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-primary btn-sm btn-ripple shadow-glow-aqua"
                            >
                                Start Shopping
                            </motion.button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <AnimatePresence mode='popLayout'>
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="bg-white rounded-lg p-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-steel-100 flex items-center gap-3"
                                    >
                                        {/* 1. Product Image (Compact 48px) */}
                                        <div className="w-12 h-12 rounded-md bg-steel-50 flex-shrink-0 border border-steel-100 relative overflow-hidden">
                                            {(item.images && item.images.length > 0) || item.image ? (
                                                <Image
                                                    src={item.images?.[0] || item.image || ''}
                                                    alt={item.name}
                                                    fill
                                                    className="object-contain p-1"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                                            )}
                                        </div>

                                        {/* 2. Text Column (Name & Price) */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                            <h3 className="!text-[11px] md:!text-[13px] font-medium text-deep-blue-900 leading-[1.2] line-clamp-2 mb-1 pr-1">
                                                {item.name}
                                            </h3>
                                            <div className="text-xs font-semibold text-deep-blue-900">
                                                {formatPrice(((Number(item.salePrice) || Number(item.price) || 0) * item.quantity))}
                                            </div>
                                        </div>

                                        {/* 3. Quantity Control (Compact) */}
                                        <div className="flex items-center bg-steel-50 rounded-md border border-steel-100 h-7 flex-shrink-0">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="w-7 h-full flex items-center justify-center text-steel-500 hover:text-deep-blue-900 active:bg-steel-200 transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-5 text-center text-xs font-semibold text-deep-blue-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="w-7 h-full flex items-center justify-center text-steel-500 hover:text-deep-blue-900 active:bg-steel-200 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* 4. Remove Icon (Small) */}
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="w-7 h-7 flex items-center justify-center text-steel-300 hover:text-rose-500 active:scale-90 transition-all flex-shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Summary Sticky Bottom-ish */}
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-steel-100 mt-3">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-steel-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-600">
                                    <span>Savings</span>
                                    <span className="font-medium">- {formatPrice(totalSavings)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Coupon Discount</span>
                                        <span className="font-medium">- {formatPrice(discountAmount)}</span>
                                    </div>
                                )}
                                <div className="w-full h-px bg-steel-50 my-1.5"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-deep-blue-900 font-bold text-sm">Total Pay</span>
                                    <span className="text-xl font-bold text-deep-blue-900">
                                        {formatPrice(finalPrice)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link href="/bulk-orders" className="block mt-3">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 rounded-xl bg-deep-blue-900 text-white font-bold text-sm shadow-lg shadow-deep-blue-900/20 btn-ripple"
                            >
                                Proceed to Buy
                            </motion.button>
                        </Link>
                    </div>
                )}
            </div>
        </MobileGestureLayout >
    );
}
