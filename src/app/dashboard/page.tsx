
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import DownloadInvoiceBtn from '@/components/invoice/DownloadInvoiceBtn';

interface OrderItem {
    quantity: number;
    price_at_purchase: number;
    product: {
        name: string;
        slug: string;
    };
}

interface Order {
    id: string;
    order_number?: number;
    created_at: string;
    status: string;
    total_amount: number;
    customer_name: string;
    created_by_admin: boolean;
    order_items?: OrderItem[];
}

export default function DashboardPage() {
    const { user, profile, logout, loading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Handle redirect in useEffect to avoid setState during render
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    // Fetch orders when profile is available
    useEffect(() => {
        if (profile?.mobile || user?.id) {
            fetchOrders();
        }
    }, [profile, user]);

    const fetchOrders = async () => {
        try {
            // Fetch orders by user_id OR customer_mobile
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, 
                    order_number, 
                    created_at, 
                    status, 
                    payment_status,
                    total_amount, 
                    customer_name, 
                    customer_mobile,
                    shipping_address,
                    created_by_admin,
                    order_items(
                        quantity,
                        price_at_purchase,
                        product:products(name, slug)
                    )
                `)
                .or(`user_id.eq.${user?.id},customer_mobile.eq.${profile?.mobile}`)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                // @ts-ignore
                setOrders(data);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'cancelled':
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Awaiting Approval';
            case 'confirmed':
                return 'Order Confirmed';
            case 'rejected':
                return 'Order Rejected';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600"></div>
            </div>
        );
    }

    if (!user) {
        // Return loading state while redirect happens
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50">
            <div className="container-custom">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Welcome</span>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                                    {profile?.full_name || user?.user_metadata?.full_name || 'User'}
                                </h1>
                            </div>
                            <p className="text-slate-500 mt-1">
                                {profile?.mobile}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 capitalize ${profile?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-aqua-100 text-aqua-800'
                                }`}>
                                {profile?.role || 'Customer'}
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/"
                                className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                            >
                                Back to Home
                            </Link>
                            {profile?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                                >
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Orders Card */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">My Orders</h3>
                            </div>
                            <span className="text-sm text-slate-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                        </div>

                        {loadingOrders ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600 mx-auto"></div>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-500 text-sm">No orders found.</p>
                                <Link href="/#categories" className="mt-4 inline-block text-aqua-600 font-medium hover:text-aqua-700 text-sm">
                                    Start Shopping &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map(order => (
                                    <div key={order.id} className="overflow-hidden border border-slate-100 rounded-xl transition-all">
                                        <div
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-900 text-sm">
                                                        Order #{order.order_number || order.id.slice(0, 8)}
                                                    </p>
                                                    {order.created_by_admin && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                                            Store Order
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                                        {getStatusText(order.status)}
                                                    </span>
                                                    <p className="font-bold text-slate-900 text-sm">
                                                        ₹{Number(order.total_amount).toLocaleString()}
                                                    </p>
                                                </div>
                                                <svg
                                                    className={`w-4 h-4 text-slate-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                            {expandedOrder === order.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="bg-white border-t border-slate-50 overflow-hidden"
                                                >
                                                    <div className="p-4 space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Order Items</p>
                                                            <DownloadInvoiceBtn order={order} variant="customer" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            {order.order_items?.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-center text-sm bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-slate-800">{item.product?.name || 'Unknown Product'}</span>
                                                                        <span className="text-[11px] text-slate-500">Qty: {item.quantity}</span>
                                                                    </div>
                                                                    <span className="font-bold text-slate-700">₹{(item.price_at_purchase * item.quantity).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Profile Details</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-black uppercase font-semibold">Name</label>
                                    <p className="text-slate-700 font-medium">{profile?.full_name || user?.user_metadata?.full_name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-black uppercase font-semibold">Phone Number</label>
                                    <p className="text-slate-700 font-medium">{profile?.mobile || user?.user_metadata?.mobile || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Support Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Need Help?</h3>
                            </div>
                            <p className="text-slate-600 text-sm mb-4">Have questions? Contact our team:</p>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Sales & Enquiries</p>
                                    <a href="tel:+919963840058" className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors">
                                        <span className="font-medium text-sm">Karthik</span>
                                        <span className="text-xs text-green-600 ml-auto">+91 99638 40058</span>
                                    </a>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Customer Support</p>
                                    <a href="tel:+919177657576" className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors">
                                        <span className="font-medium text-sm">Hazarathaiah</span>
                                        <span className="text-xs text-green-600 ml-auto">+91 91776 57576</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
