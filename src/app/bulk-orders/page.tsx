'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatPrice, allProducts } from '@/data/products';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import Link from 'next/link';
import OrderSuccessModal from '@/components/ui/OrderSuccessModal';
import { validateCoupon } from '@/app/actions/validateCoupon';

export default function CheckoutPage() {
    const { cartItems, clearCart, totalPrice, finalPrice, discountAmount, coupon, applyCoupon } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        addressLine1: '',
        city: '',
        state: '',
        pincode: '',
        mobile: ''
    });
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [placedOrderId, setPlacedOrderId] = useState('');

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            if (!session) {
                setShowLoginPrompt(true);
            }
        };
        checkAuth();
    }, []);

    // Use Context Values for Totals
    // If no coupon, finalPrice is same as totalPrice (handled in context)
    const currentTotal = finalPrice > 0 ? finalPrice : totalPrice;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleApplyCoupon = async () => {
        setCouponError('');
        setCouponLoading(true);

        try {
            if (!couponCode.trim()) {
                setCouponError('Please enter a coupon code');
                return;
            }

            const cartItemIdentifiers = cartItems.map(item => {
                let slug = item.slug || '';
                const uuid = item.id; // Correct assumption: item.id in cart is the UUID from DB

                let shortId = '';

                // Lookup strict Short ID from allProducts using Slug
                if (slug) {
                    const product = allProducts.find(p => p.slug === slug);
                    if (product) shortId = product.id;
                } else {
                    // Fallback: Try to find by UUID if slug is missing 
                    // (Unlikely if we are thorough, but good safety)
                    // Note: We can't easily lookup static product by UUID because static products don't have the live UUIDs. 
                    // But if item.id IS the short ID (legacy cart), then we can find it.
                    const product = allProducts.find(p => p.id === uuid);
                    if (product) {
                        shortId = product.id;
                        // CRITICAL FIX: If we found it by Short ID, we KNOW the slug. Pass it!
                        // This allows validation to succeed even if the cart item only had the Short ID.
                        slug = product.slug;
                    }
                }

                return {
                    uuid: uuid || '',
                    slug: slug || '',
                    shortId: shortId
                };
            });

            console.log('Validating coupon against items:', cartItemIdentifiers);
            const result = await validateCoupon(couponCode, cartItemIdentifiers);

            if (result.isValid && result.coupon) {
                applyCoupon(result.coupon);
                setCouponCode('');
            } else {
                setCouponError(result.error || 'Invalid coupon');
                applyCoupon(null);
            }
        } catch (error) {
            console.error('Coupon error:', error);
            setCouponError('Failed to validate coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        applyCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setShowLoginPrompt(true);
                setLoading(false);
                return;
            }

            if (!formData.fullName || !formData.mobile || !formData.addressLine1 || !formData.city || !formData.state || !formData.pincode) {
                alert('Please fill in all shipping details.');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    items: cartItems,
                    totalAmount: currentTotal,
                    shippingAddress: formData,
                    couponCode: coupon?.code,
                    discountAmount: discountAmount
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to place order');
            }

            // Success
            clearCart();
            setPlacedOrderId(data.orderId);
            setIsSuccessModalOpen(true);
        } catch (err: any) {
            console.error(err);
            alert('Error placing order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setIsSuccessModalOpen(false);
        router.push('/dashboard');
    };

    // Login Prompt Modal
    if (showLoginPrompt && !isAuthenticated) {
        return (
            <div className="min-h-screen bg-steel-50/30 pt-20 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-steel-100 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-deep-blue-900 mb-2">Login Required</h2>
                    <p className="text-steel-600 mb-6">Please login to place your order. Your cart items will be saved.</p>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/login?redirect=/cart"
                            className="w-full py-3 rounded-xl bg-deep-blue-900 text-white font-bold text-sm hover:bg-deep-blue-800 transition-colors"
                        >
                            Login to Continue
                        </Link>
                        <Link
                            href="/cart"
                            className="w-full py-3 rounded-xl bg-steel-100 text-steel-700 font-medium text-sm hover:bg-steel-200 transition-colors"
                        >
                            Back to Cart
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0 && !isSuccessModalOpen) {
        return (
            <MobileGestureLayout>
                <div className="min-h-screen pt-24 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h2>
                    <Link href="/products" className="text-aqua-600 hover:text-aqua-700 transition-colors">
                        Browse Products
                    </Link>
                </div>
            </MobileGestureLayout>
        );
    }


    return (
        <MobileGestureLayout>
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
                <h1 className="text-2xl font-bold mb-6 text-deep-blue-900">Checkout</h1>

                <form onSubmit={handlePlaceOrder}>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Shipping Form */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
                            <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <input
                                        type="text"
                                        name="addressLine1"
                                        required
                                        className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                        value={formData.addressLine1}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            required
                                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                            value={formData.state}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Pincode</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            required
                                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Mobile</label>
                                        <input
                                            type="text"
                                            name="mobile"
                                            required
                                            className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
                            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                            <div className="space-y-3">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span className="font-medium">
                                            {formatPrice(((Number(item.salePrice) || Number(item.price) || 0) * item.quantity))}
                                        </span>
                                    </div>
                                ))}

                                {/* Coupon Section */}
                                <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
                                    {!coupon ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Coupon Code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-aqua-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading || !couponCode}
                                                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                                            >
                                                {couponLoading ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-green-800">Coupon Applied</p>
                                                <p className="text-xs font-mono text-green-600">{coupon.code}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveCoupon}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    {couponError && (
                                        <p className="text-xs text-red-500 mt-1">{couponError}</p>
                                    )}
                                </div>

                                <div className="border-t pt-3 mt-3 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(totalPrice)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-green-600">
                                            <span>Discount</span>
                                            <span>- {formatPrice(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                                        <span>Total</span>
                                        <span>{formatPrice(currentTotal)}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-deep-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 mt-6"
                                >
                                    {loading ? 'Processing...' : `Confirm Order - ${formatPrice(currentTotal)}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <OrderSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={handleSuccessClose}
                orderId={placedOrderId}
            />
        </MobileGestureLayout>
    );
}
