
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { updateOrderStatus, updatePaymentStatus } from '@/lib/orders-actions';
import DownloadInvoiceBtn from '@/components/invoice/DownloadInvoiceBtn';
import InvoiceViewer from '@/components/invoice/InvoiceViewer';
import ConfirmModal from '@/components/ui/ConfirmModal';

import { allProducts } from '@/data/products';

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-200 text-green-900',
    completed: 'bg-emerald-100 text-emerald-800',
    partially_fulfilled: 'bg-sky-100 text-sky-800',
    out_of_stock: 'bg-rose-100 text-rose-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
};

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditingFulfillment, setIsEditingFulfillment] = useState(false);
    const [editableItems, setEditableItems] = useState<any[]>([]);
    const [includeOosInInvoice, setIncludeOosInInvoice] = useState(false);
    const [orderStatus, setOrderStatus] = useState('');

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'success' | 'warning';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning',
        confirmText: 'Confirm'
    });

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;

            // Fetch products for name mapping (Invoice PDF fix)
            const { data: productsData } = await supabase
                .from('products')
                .select('id, name, slug');

            const productMap = new Map();
            if (productsData) {
                productsData.forEach(p => {
                    productMap.set(p.id, p);
                    productMap.set(p.slug, p);
                });
            }

            const { data, error } = await supabase
                .from('orders')
                .select(`
            *,
            profile:profiles(*),
            order_items(*)
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching order", error);
                // @ts-ignore
                setOrder(null);
                alert(`Error fetching order: ${error.message}`);
            } else {
                if (data && data.order_items) {
                    data.order_items = data.order_items.map((item: any) => ({
                        ...item,
                        product_name: productMap.get(item.product_id)?.name || item.product_id,
                        is_available: item.is_available !== null && item.is_available !== undefined ? item.is_available : true,
                        fulfilled_quantity: item.fulfilled_quantity !== null && item.fulfilled_quantity !== undefined ? item.fulfilled_quantity : item.quantity,
                        out_of_stock_reason: item.out_of_stock_reason || ''
                    }));
                }
                setOrder(data);
            }
            setLoading(false);
        };

        fetchOrder();
    }, [id]);

    const requestUpdateStatus = (newStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Update Order Status?',
            message: `Are you sure you want to change status to "${newStatus.toUpperCase()}"?`,
            type: newStatus === 'rejected' || newStatus === 'cancelled' ? 'danger' : 'success',
            onConfirm: () => handleUpdateStatus(newStatus)
        });
    };

    const handleUpdateStatus = async (newStatus: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        const { success, data, error } = await updateOrderStatus(order.id, newStatus);
        if (success) {
            setOrder({ ...order, status: newStatus });
        } else {
            alert('Failed to update status: ' + error);
        }
        setLoading(false);
    };

    const requestUpdatePayment = (newPaymentStatus: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Update Payment Status?',
            message: `Are you sure you want to mark payment as "${newPaymentStatus.toUpperCase()}"?`,
            type: 'warning',
            onConfirm: () => handleUpdatePayment(newPaymentStatus)
        });
    };

    const handleUpdatePayment = async (newPaymentStatus: string) => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        const { success, data, error } = await updatePaymentStatus(order.id, newPaymentStatus);
        if (success) {
            setOrder({ ...order, payment_status: newPaymentStatus });
        } else {
            alert('Failed to update payment: ' + error);
        }
        setLoading(false);
    };

    const handleDeleteOrderClick = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Order?',
            message: 'Are you sure you want to permanently delete this order? All items, invoices, and associated data will be deleted. This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete Order',
            onConfirm: executeDeleteOrder
        });
    };

    const executeDeleteOrder = async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
            const { deleteOrderAction } = await import('@/app/actions/orders');
            const result = await deleteOrderAction(order.id);
            if (result.success) {
                router.push('/admin/orders');
            } else {
                alert('Failed to delete order: ' + result.error);
                setLoading(false);
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
            setLoading(false);
        }
    };

    const startEditingFulfillment = () => {
        if (!order) return;
        setEditableItems(order.order_items.map((item: any) => ({
            id: item.id,
            product_name: item.product_name,
            product_id: item.product_id,
            price_at_purchase: item.price_at_purchase,
            quantity: item.quantity,
            is_available: item.is_available !== null && item.is_available !== undefined ? item.is_available : true,
            fulfilled_quantity: item.fulfilled_quantity !== null && item.fulfilled_quantity !== undefined ? item.fulfilled_quantity : item.quantity,
            out_of_stock_reason: item.out_of_stock_reason || ''
        })));
        setIncludeOosInInvoice(order.include_oos_in_invoice || false);
        setOrderStatus(order.status);
        setIsEditingFulfillment(true);
    };

    const cancelEditingFulfillment = () => {
        setIsEditingFulfillment(false);
    };

    const handleToggleItemAvailability = (index: number, isAvailable: boolean) => {
        setEditableItems(prev => prev.map((item, idx) => {
            if (idx !== index) return item;
            return {
                ...item,
                is_available: isAvailable,
                fulfilled_quantity: isAvailable ? (item.fulfilled_quantity || item.quantity) : 0
            };
        }));
    };

    const handleUpdateItemFulfilledQty = (index: number, qty: number) => {
        setEditableItems(prev => prev.map((item, idx) => {
            if (idx !== index) return item;
            const cappedQty = Math.max(0, Math.min(item.quantity, qty));
            return {
                ...item,
                fulfilled_quantity: cappedQty
            };
        }));
    };

    const handleUpdateItemReason = (index: number, reason: string) => {
        setEditableItems(prev => prev.map((item, idx) => {
            if (idx !== index) return item;
            return {
                ...item,
                out_of_stock_reason: reason
            };
        }));
    };

    const handleSaveFulfillment = async () => {
        setLoading(true);
        try {
            const { updateOrderFulfillmentAction } = await import('@/app/actions/orders');
            const result = await updateOrderFulfillmentAction(
                order.id,
                editableItems.map(item => ({
                    id: item.id,
                    is_available: item.is_available,
                    fulfilled_quantity: item.fulfilled_quantity,
                    out_of_stock_reason: item.out_of_stock_reason
                })),
                includeOosInInvoice,
                orderStatus
            );

            if (result.success) {
                // Fetch the updated order to sync local UI state
                const { data: productsData } = await supabase
                    .from('products')
                    .select('id, name, slug');

                const productMap = new Map();
                if (productsData) {
                    productsData.forEach(p => {
                        productMap.set(p.id, p);
                        productMap.set(p.slug, p);
                    });
                }

                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        profile:profiles(*),
                        order_items(*)
                    `)
                    .eq('id', order.id)
                    .single();

                if (error) throw error;

                if (data && data.order_items) {
                    data.order_items = data.order_items.map((item: any) => ({
                        ...item,
                        product_name: productMap.get(item.product_id)?.name || item.product_id,
                        is_available: item.is_available !== null && item.is_available !== undefined ? item.is_available : true,
                        fulfilled_quantity: item.fulfilled_quantity !== null && item.fulfilled_quantity !== undefined ? item.fulfilled_quantity : item.quantity,
                        out_of_stock_reason: item.out_of_stock_reason || ''
                    }));
                }
                setOrder(data);
                setIsEditingFulfillment(false);
                if (result.warning) {
                    alert(result.warning);
                } else {
                    alert('Order fulfillment updated successfully!');
                }
            } else {
                alert('Failed to update fulfillment: ' + result.error);
            }
        } catch (err: any) {
            console.error('Error saving fulfillment:', err);
            alert('Error saving fulfillment: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    // Improved Error Display
    if (!order) {
        return (
            <div className="p-8 flex flex-col gap-4">
                <div className="text-red-600 font-bold text-lg">Order not found</div>
                <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded border border-slate-200">
                    <p>Possible reasons:</p>
                    <ul className="list-disc pl-5 mt-2">
                        <li>Invalid Order ID in URL</li>
                        <li>Database connection error</li>
                        <li>Missing relations (e.g., Profile deleted)</li>
                    </ul>
                    <p className="mt-4 font-mono text-xs">ID: {id}</p>
                </div>
                <Link href="/admin/orders" className="text-blue-600 hover:underline">Return to Orders List</Link>
            </div>
        );
    }

    // Helper to format address
    const formatAddress = (addr: any) => {
        if (!addr) return 'N/A';
        if (typeof addr === 'string') return addr;
        const { address, addressLine1, city, state, pincode, zip } = addr;
        return [address || addressLine1 || '', city || '', state || '', pincode || zip || ''].filter(Boolean).join(', ') || 'N/A';
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white shadow rounded-lg">
            <div className="mb-6 flex items-center">
                <Link href="/admin/orders" className="mr-4 text-slate-500 hover:text-slate-700">
                    <span className="sr-only">Back</span>
                    ← Back to Orders
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Order #{order.order_number || order.id.slice(0, 8)}</h1>
                <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-800'}`}>
                    {order.status.replace(/_/g, ' ')}
                </span>
            </div>


            {/* Admin Actions Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
                {isEditingFulfillment ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fulfillment Control Panel</h3>
                            <span className="text-xs font-semibold text-aqua-600 bg-aqua-50 px-2.5 py-1 rounded-full">Editing Mode</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-3 justify-center">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={includeOosInInvoice}
                                        onChange={(e) => setIncludeOosInInvoice(e.target.checked)}
                                        className="rounded border-slate-300 text-aqua-600 focus:ring-aqua-500 w-4 h-4"
                                    />
                                    Include Out of Stock items in invoice
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Update Order Status
                                </label>
                                <select
                                    value={orderStatus}
                                    onChange={(e) => setOrderStatus(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-aqua-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="partially_fulfilled">Partially Fulfilled</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                    <option value="completed">Completed</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                onClick={cancelEditingFulfillment}
                                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveFulfillment}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition"
                            >
                                Save Fulfillment
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Actions</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                {order.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => requestUpdateStatus('confirmed')}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition"
                                        >
                                            Approve Order
                                        </button>
                                        <button
                                            onClick={() => requestUpdateStatus('rejected')}
                                            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition"
                                        >
                                            Reject Order
                                        </button>
                                    </>
                                )}
                                {order.status !== 'pending' && order.status !== 'cancelled' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => requestUpdateStatus('shipped')}
                                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded hover:bg-purple-700 transition"
                                        >
                                            Mark Shipped
                                        </button>
                                        <button
                                            onClick={() => requestUpdateStatus('delivered')}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition"
                                        >
                                            Mark Delivered
                                        </button>
                                    </div>
                                )}

                                {order.status !== 'pending' && order.status !== 'rejected' && order.status !== 'cancelled' && (
                                    <button
                                        onClick={startEditingFulfillment}
                                        className="px-3 py-1.5 bg-aqua-600 text-white text-xs font-bold rounded hover:bg-aqua-700 transition"
                                    >
                                        Manage Fulfillment
                                    </button>
                                )}

                                <button
                                    onClick={handleDeleteOrderClick}
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition flex items-center gap-1.5 ml-auto"
                                    title="Delete Order"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Order
                                </button>
                            </div>
                        </div>

                        <div className="md:border-l md:pl-6 border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Payment & Invoice</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {order.payment_status || 'Pending'}
                                    </span>
                                    {order.payment_status !== 'paid' ? (
                                        <button
                                            onClick={() => requestUpdatePayment('paid')}
                                            className="text-xs font-medium text-blue-600 hover:underline"
                                        >
                                            Mark Paid
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => requestUpdatePayment('pending')}
                                            className="text-xs font-medium text-slate-500 hover:text-red-600 hover:underline"
                                        >
                                            Mark Pending
                                        </button>
                                    )}
                                </div>

                                <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

                                <DownloadInvoiceBtn order={order} variant="admin" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-medium text-slate-900 border-b pb-2 mb-4">Customer Details</h3>
                    <div className="text-base text-slate-600 space-y-2">
                        <p><span className="font-semibold text-slate-700">Name:</span> {order.profile?.full_name || order.customer_name}</p>
                        <p><span className="font-semibold text-slate-700">Phone:</span> {order.profile?.mobile || order.customer_mobile}</p>
                        <p><span className="font-semibold text-slate-700">Address:</span> {formatAddress(order.shipping_address)}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-slate-900 border-b pb-2 mb-4">Order Summary</h3>
                    <div className="text-base text-slate-600 space-y-2">
                        <p><span className="font-semibold text-slate-700">Date:</span> {new Date(order.created_at).toLocaleString()}</p>

                        {order.discount_amount > 0 && (
                            <>
                                <p><span className="font-semibold text-slate-700">Subtotal:</span> ₹{(order.total_amount + order.discount_amount).toLocaleString()}</p>
                                <p className="text-green-600"><span className="font-semibold">Discount:</span> -₹{order.discount_amount.toLocaleString()} {order.coupon_code && <span className="text-xs bg-green-100 px-1 rounded">({order.coupon_code})</span>}</p>
                            </>
                        )}

                        <p><span className="font-semibold text-slate-700">Total Amount:</span> <span className="text-xl font-bold text-aqua-600">₹{order.total_amount}</span></p>
                        <p><span className="font-semibold text-slate-700">Payment Method:</span> {order.payment_method || 'COD'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-lg font-medium text-slate-900">Order Items</h3>
                    {isEditingFulfillment && (
                        <span className="text-xs text-slate-500 font-medium">Modify stock availability & fulfilled quantities below</span>
                    )}
                </div>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Product</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold">Price</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold">
                                    {isEditingFulfillment ? 'Fulfillment Settings' : 'Quantity'}
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-semibold">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {order.order_items?.map((item: any, index: number) => {
                                // Manual lookup for product details to handle both legacy IDs and new Slugs
                                const productDetails = allProducts.find(p => p.id === item.product_id || p.slug === item.product_id) || item.product;

                                if (isEditingFulfillment) {
                                    const editItem = editableItems[index];
                                    if (!editItem) return null;
                                    return (
                                        <tr key={item.id} className={!editItem.is_available ? 'bg-rose-50/40' : ''}>
                                            <td className="py-4 px-4 text-sm text-slate-900 font-medium">
                                                <div className="flex items-center">
                                                    {(productDetails?.image || productDetails?.images?.[0] || productDetails?.image_url) && (
                                                        <img src={productDetails.image || productDetails.images?.[0] || productDetails.image_url} alt="" className={`h-10 w-10 rounded mr-3 object-cover ${!editItem.is_available ? 'opacity-50 grayscale' : ''}`} />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">{productDetails?.name || item.product_name || item.product_id}</p>
                                                        <p className="text-xs text-slate-500">Ordered: {item.quantity} units</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-500 text-right">₹{item.price_at_purchase}</td>
                                            <td className="py-4 px-4 text-sm text-slate-500 text-right">
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className="inline-flex rounded-md shadow-sm" role="group">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleItemAvailability(index, true)}
                                                            className={`px-3 py-1 text-xs font-semibold rounded-l-md border ${
                                                                editItem.is_available
                                                                    ? 'bg-green-600 text-white border-green-600'
                                                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            In Stock
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleItemAvailability(index, false)}
                                                            className={`px-3 py-1 text-xs font-semibold rounded-r-md border-t border-b border-r ${
                                                                !editItem.is_available
                                                                    ? 'bg-rose-600 text-white border-rose-600'
                                                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            Out Of Stock
                                                        </button>
                                                    </div>

                                                    {editItem.is_available ? (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-xs text-slate-500">Fulfilled Qty:</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.quantity}
                                                                value={editItem.fulfilled_quantity}
                                                                onChange={(e) => handleUpdateItemFulfilledQty(index, parseInt(e.target.value) || 0)}
                                                                className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-aqua-500"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-xs text-slate-500">Reason:</span>
                                                            <input
                                                                type="text"
                                                                placeholder="Reason (e.g. Out of stock)"
                                                                value={editItem.out_of_stock_reason}
                                                                onChange={(e) => handleUpdateItemReason(index, e.target.value)}
                                                                className="w-40 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-aqua-500"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-900 text-right font-medium">
                                                ₹{(item.price_at_purchase * (editItem.is_available ? editItem.fulfilled_quantity : 0)).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                }

                                const isAvailable = item.is_available !== false;
                                const fulfilledQty = item.fulfilled_quantity !== undefined && item.fulfilled_quantity !== null ? item.fulfilled_quantity : item.quantity;
                                const hasFulfillmentDiff = fulfilledQty !== item.quantity;

                                return (
                                    <tr key={item.id} className={!isAvailable ? 'bg-slate-50 text-slate-400' : ''}>
                                        <td className="py-4 px-4 text-sm text-slate-900 font-medium">
                                            <div className="flex items-center">
                                                {(productDetails?.image || productDetails?.images?.[0] || productDetails?.image_url) && (
                                                    <img src={productDetails.image || productDetails.images?.[0] || productDetails.image_url} alt="" className={`h-10 w-10 rounded mr-3 object-cover ${!isAvailable ? 'opacity-50 grayscale' : ''}`} />
                                                )}
                                                <div>
                                                    <p className={!isAvailable ? 'text-slate-500 line-through' : 'text-slate-900'}>
                                                        {productDetails?.name || item.product_name || item.product_id}
                                                    </p>
                                                    {!isAvailable && (
                                                        <p className="text-xs text-rose-600 font-semibold mt-0.5">
                                                            Out of stock {item.out_of_stock_reason ? `(${item.out_of_stock_reason})` : ''}
                                                        </p>
                                                    )}
                                                    {isAvailable && hasFulfillmentDiff && (
                                                        <p className="text-xs text-amber-600 font-semibold mt-0.5">
                                                            Partially fulfilled
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-500 text-right">₹{item.price_at_purchase}</td>
                                        <td className="py-4 px-4 text-sm text-slate-500 text-right">
                                            {isAvailable ? (
                                                hasFulfillmentDiff ? (
                                                    <div>
                                                        <span className="font-semibold text-slate-900">{fulfilledQty}</span>
                                                        <span className="text-xs text-slate-400 block">ordered {item.quantity}</span>
                                                    </div>
                                                ) : (
                                                    item.quantity
                                                )
                                            ) : (
                                                <div>
                                                    <span className="line-through">{item.quantity}</span>
                                                    <span className="text-xs text-rose-500 font-semibold block">0 fulfilled</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-900 text-right font-medium">
                                            ₹{(item.price_at_purchase * (isAvailable ? fulfilledQty : 0)).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Preview Section */}
            <InvoiceViewer order={order} />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}
