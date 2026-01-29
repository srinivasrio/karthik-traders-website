
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function OrderDetailPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('orders')
                .select(`
            *,
            profile:profiles(*),
            order_items(
                *,
                product:products(name, price, image_url)
            )
        `)
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching order", error);
            } else {
                setOrder(data);
            }
            setLoading(false);
        };

        fetchOrder();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!order) return <div className="p-8">Order not found</div>;

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 bg-white shadow rounded-lg">
            <div className="mb-6 flex items-center">
                <Link href="/admin/orders" className="mr-4 text-slate-500 hover:text-slate-700">
                    <span className="sr-only">Back</span>
                    ← Back to Orders
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(0, 8)}</h1>
                <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                    }`}>
                    {order.status}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-medium text-slate-900 border-b pb-2 mb-4">Customer Details</h3>
                    <div className="text-base text-slate-600 space-y-2">
                        <p><span className="font-semibold text-slate-700">Name:</span> {order.profile?.full_name}</p>
                        <p><span className="font-semibold text-slate-700">Phone:</span> {order.profile?.mobile}</p>
                        {/* Add Address if available in order metadata or profile */}
                        <p><span className="font-semibold text-slate-700">Address:</span> {JSON.stringify(order.shipping_address || "N/A")}</p>
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
                            {order.order_items?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4 px-4 text-sm text-slate-900 font-medium">
                                        <div className="flex items-center">
                                            {/* Optional Image */}
                                            {item.product?.image_url && (
                                                <img src={item.product.image_url} alt="" className="h-10 w-10 rounded mr-3 object-cover" />
                                            )}
                                            {item.product?.name || 'Deleted Product'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-500 text-right">₹{item.price_at_purchase}</td>
                                    <td className="py-4 px-4 text-sm text-slate-500 text-right">{item.quantity}</td>
                                    <td className="py-4 px-4 text-sm text-slate-900 text-right font-medium">₹{item.price_at_purchase * item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
