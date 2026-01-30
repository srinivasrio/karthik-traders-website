'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/data/products';
import MobileGestureLayout from '@/components/layout/MobileGestureLayout';
import Link from 'next/link';

export default function CheckoutPage() {
    const { cartItems, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        addressLine1: '',
        city: '',
        state: '',
        pincode: '',
        mobile: ''
    });

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

    const subtotal = cartItems.reduce((sum, item) => sum + ((Number(item.salePrice) || Number(item.price) || 0) * item.quantity), 0);
    const totalAmount = subtotal; // Add shipping logic if needed

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    items: cartItems,
                    totalAmount,
                    shippingAddress: formData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to place order');
            }

            // Success
            clearCart();
            alert('Order placed successfully!');
            router.push('/dashboard'); // creating dashboard/orders view next?
        } catch (err: any) {
            console.error(err);
            alert('Error placing order: ' + err.message);
        } finally {
            setLoading(false);
        }
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

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen pt-24 text-center">
                <h2>Your cart is empty</h2>
                <button onClick={() => router.push('/products')} className="text-blue-500 underline">
                    Browse Products
                </button>
            </div>
        );
    }


    return (
        <MobileGestureLayout>
            <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
                <h1 className="text-2xl font-bold mb-6 text-deep-blue-900">Checkout</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Shipping Form */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4">Shipping Details</h2>
                        <form onSubmit={handlePlaceOrder} className="space-y-4">
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
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-deep-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 mt-4"
                            >
                                {loading ? 'Processing...' : `Confirm Order - ${formatPrice(totalAmount)}`}
                            </button>
                        </form>
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
                            <div className="border-t pt-3 mt-3 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatPrice(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MobileGestureLayout>
    );
}
