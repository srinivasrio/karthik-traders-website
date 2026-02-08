
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

export default function OrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        const fetchOrder = async () => {
            if (!id) return;

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
                <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                    }`}>
                    {order.status}
                </span>
            </div>


            {/* Admin Actions Panel */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Order Actions</h3>
                        <div className="flex flex-wrap gap-2">
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
                        <p><span className="font-semibold text-slate-700">Total Amount:</span> <span className="text-xl font-bold text-aqua-600">₹{order.total_amount}</span></p>
                        <p><span className="font-semibold text-slate-700">Payment Method:</span> {order.payment_method || 'COD'}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium text-slate-900 border-b pb-2 mb-4">Order Items</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-300">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold">Product</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold">Price</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold">Quantity</th>
                                <th className="py-3 px-4 text-right text-sm font-semibold">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {order.order_items?.map((item: any) => {
                                // Manual lookup for product details to handle both legacy IDs and new Slugs
                                const productDetails = allProducts.find(p => p.id === item.product_id || p.slug === item.product_id) || item.product;

                                return (
                                    <tr key={item.id}>
                                        <td className="py-4 px-4 text-sm text-slate-900 font-medium">
                                            <div className="flex items-center">
                                                {/* Optional Image */}
                                                {(productDetails?.image || productDetails?.images?.[0] || productDetails?.image_url) && (
                                                    <img src={productDetails.image || productDetails.images?.[0] || productDetails.image_url} alt="" className="h-10 w-10 rounded mr-3 object-cover" />
                                                )}
                                                {productDetails?.name || item.product_id}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-500 text-right">₹{item.price_at_purchase}</td>
                                        <td className="py-4 px-4 text-sm text-slate-500 text-right">{item.quantity}</td>
                                        <td className="py-4 px-4 text-sm text-slate-900 text-right font-medium">₹{item.price_at_purchase * item.quantity}</td>
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
            />
        </div>
    );
}
