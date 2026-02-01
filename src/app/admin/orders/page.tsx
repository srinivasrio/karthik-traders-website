
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
    user_id: string;
    customer_name: string;
    customer_mobile: string;
    shipping_address: {
        fullName?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: string;
        mobile?: string;
        notes?: string;
    } | null;
    profile?: {
        full_name: string;
        mobile: string;
    };
    order_items?: OrderItem[];
}

const STATUS_TABS = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-200 text-green-900',
    completed: 'bg-green-200 text-green-900',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'success' | 'warning';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    profile:profiles(full_name, mobile),
                    order_items(
                        quantity,
                        price_at_purchase,
                        product:products(name, slug)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // @ts-ignore
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = (orderId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Order?',
            message: 'Are you sure you want to accept this order? Product stock will be deducted automatically.',
            type: 'success',
            onConfirm: () => executeAccept(orderId)
        });
    };

    const executeAccept = async (orderId: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setActionLoading(orderId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please login again');
                return;
            }

            const response = await fetch(`/api/admin/orders/${orderId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Update local state
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: 'confirmed' } : o
            ));
            // alert('Order accepted successfully!');
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (orderId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reject Order?',
            message: 'Are you sure you want to reject this order? This action cannot be undone.',
            type: 'danger',
            onConfirm: () => executeReject(orderId)
        });
    };

    const executeReject = async (orderId: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setActionLoading(orderId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please login again');
                return;
            }

            const response = await fetch(`/api/admin/orders/${orderId}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Update local state
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: 'rejected' } : o
            ));
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredOrders = activeTab === 'all'
        ? orders
        : orders.filter(o => o.status === activeTab);

    const pendingCount = orders.filter(o => o.status === 'pending').length;

    const formatAddress = (addr: Order['shipping_address']) => {
        if (!addr) return 'No address';
        const parts = [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean);
        return parts.join(', ') || addr.notes || 'No address';
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-slate-900">Orders</h1>
                    <p className="mt-2 text-sm text-slate-700">
                        Manage customer orders. Accept or reject pending orders.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        href="/admin/orders/new"
                        className="inline-flex items-center gap-2 rounded-md bg-aqua-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-aqua-500"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Order
                    </Link>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="mt-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                ? 'border-aqua-500 text-aqua-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tab.label}
                            {tab.id === 'pending' && pendingCount > 0 && (
                                <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Orders Table */}
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-300">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">
                                            Order
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                                            Customer
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 hidden md:table-cell">
                                            Address
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                                            Total
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                                            Status
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                                    ) : filteredOrders.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-slate-500">No orders found.</td></tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <>
                                                <tr key={order.id} className={order.status === 'pending' ? 'bg-yellow-50' : ''}>
                                                    <td className="py-4 pl-4 pr-3 sm:pl-6">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                                className="text-slate-400 hover:text-slate-600"
                                                            >
                                                                {expandedOrder === order.id ? (
                                                                    <ChevronUpIcon className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronDownIcon className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">
                                                                    #{order.order_number || order.id.slice(0, 8)}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {new Date(order.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {order.customer_name || order.profile?.full_name || 'Unknown'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {order.customer_mobile || order.profile?.mobile}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 py-4 text-sm text-slate-500 hidden md:table-cell max-w-xs truncate">
                                                        {formatAddress(order.shipping_address)}
                                                    </td>
                                                    <td className="px-3 py-4 text-sm font-semibold text-slate-900">
                                                        ₹{order.total_amount?.toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-800'}`}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        {order.status === 'pending' ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAccept(order.id)}
                                                                    disabled={actionLoading === order.id}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                                                                >
                                                                    <CheckIcon className="w-3 h-3" />
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(order.id)}
                                                                    disabled={actionLoading === order.id}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                                                                >
                                                                    <XMarkIcon className="w-3 h-3" />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <Link
                                                                href={`/admin/orders/${order.id}`}
                                                                className="text-sm text-aqua-600 hover:text-aqua-900 font-medium"
                                                            >
                                                                View Invoice
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                                {/* Expanded Order Items */}
                                                {expandedOrder === order.id && (
                                                    <tr className="bg-slate-50">
                                                        <td colSpan={6} className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-semibold text-slate-600 uppercase">Order Items:</p>
                                                                {order.order_items?.map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between text-sm">
                                                                        <span>{item.product?.name || 'Unknown Product'} × {item.quantity}</span>
                                                                        <span className="font-medium">₹{(item.price_at_purchase * item.quantity).toLocaleString()}</span>
                                                                    </div>
                                                                ))}
                                                                {/* Show address on mobile */}
                                                                <div className="md:hidden pt-2 border-t border-slate-200 mt-2">
                                                                    <p className="text-xs font-semibold text-slate-600 uppercase">Delivery Address:</p>
                                                                    <p className="text-sm text-slate-700">{formatAddress(order.shipping_address)}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.type === 'danger' ? 'Reject Order' : 'Accept Order'}
            />
        </div>
    );
}
