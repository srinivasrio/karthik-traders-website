"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeftIcon,
    PhoneIcon,
    CalendarIcon,
    ShoppingBagIcon,
    UserIcon
} from '@heroicons/react/24/outline';

interface Profile {
    id: string;
    full_name: string;
    mobile: string;
    role: string;
    created_at: string;
}

interface Order {
    id: string;
    order_number: string; // Add order_number
    status: string;
    total_amount: number;
    payment_status: string;
    created_at: string;
    order_items: any[]; // Add items
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<Profile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (customerId) {
            fetchCustomerData();
        }
    }, [customerId]);

    const toggleOrder = (orderId: string) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const fetchCustomerData = async () => {
        try {
            // Fetch customer profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', customerId)
                .single();

            if (profileError) throw profileError;
            setCustomer(profileData);

            // Fetch customer orders with items
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        product:products (
                            name,
                            image_url
                        )
                    )
                `)
                .eq('user_id', customerId)
                .order('created_at', { ascending: false });

            if (!ordersError) {
                setOrders(ordersData || []);
            }
        } catch (error) {
            console.error('Error fetching customer:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'shipped': return 'bg-blue-100 text-blue-700';
            case 'confirmed': return 'bg-aqua-100 text-aqua-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Customer not found.</p>
                <Link href="/admin/customers" className="text-aqua-600 hover:underline mt-2 inline-block">
                    ← Back to Customers
                </Link>
            </div>
        );
    }

    return (
        <div className="px-2 sm:px-4">
            {/* Back Button */}
            <Link
                href="/admin/customers"
                className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 mb-4"
            >
                <ArrowLeftIcon className="h-3 w-3 mr-1" />
                Back to Customers
            </Link>

            {/* Customer Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-full bg-aqua-100 flex items-center justify-center text-aqua-700 font-bold text-lg">
                        {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-slate-900">
                            {customer.full_name || 'Unnamed User'}
                        </h1>
                        <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-600 flex items-center gap-2">
                                <PhoneIcon className="h-3 w-3" />
                                {customer.mobile}
                            </p>
                            <p className="text-xs text-slate-600 flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3" />
                                Joined {formatDate(customer.created_at)}
                            </p>
                            <p className="text-xs text-slate-600 flex items-center gap-2">
                                <UserIcon className="h-3 w-3" />
                                Role: <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${customer.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                    }`}>{customer.role}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200">
                    <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <ShoppingBagIcon className="h-4 w-4" />
                        Order History ({orders.length})
                    </h2>
                </div>

                {orders.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-xs text-slate-500">No orders yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {orders.map((order) => (
                            <div key={order.id} className="transition-colors hover:bg-slate-50">
                                {/* Order Header Row */}
                                <div
                                    className="p-4 cursor-pointer flex items-center justify-between"
                                    onClick={() => toggleOrder(order.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`transform transition-transform duration-200 text-slate-400 ${expandedOrders.has(order.id) ? 'rotate-90' : ''}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-900">
                                                Order #{order.order_number || order.id.slice(0, 8)}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {formatDate(order.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-900">
                                            ₹{order.total_amount}
                                        </p>
                                        <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded mt-1 ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Dropdown - Product Details */}
                                {expandedOrders.has(order.id) && (
                                    <div className="px-4 pb-4 pl-11 bg-slate-50/50 border-t border-slate-100">
                                        <div className="mt-3 space-y-3">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Products Ordered</div>
                                            {order.order_items && order.order_items.length > 0 ? (
                                                <div className="space-y-2">
                                                    {order.order_items.map((item: any) => (
                                                        <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-3">
                                                                {item.product?.image_url ? (
                                                                    <img src={item.product.image_url} alt="" className="w-8 h-8 rounded object-cover border border-slate-100" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                                                        <ShoppingBagIcon className="w-4 h-4" />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-xs font-medium text-slate-900 line-clamp-1">{item.product?.name || 'Product'}</p>
                                                                    <p className="text-[10px] text-slate-500">Qty: {item.quantity} × ₹{item.price_at_purchase}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs font-semibold text-slate-700">
                                                                ₹{item.quantity * item.price_at_purchase}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No items details found.</p>
                                            )}
                                            <div className="mt-3 text-right">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    View Full Order Details →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
