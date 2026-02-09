'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: number;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
}

export default function CouponsListClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    // const supabase = createClient();

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));

        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: currentStatus } : c));
            alert('Failed to update status');
        } else {
            router.refresh();
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;

        setLoading(true);

        // 1. Delete relations first (to avoid Foreign Key constraint errors)
        const { error: relationError } = await supabase
            .from('coupon_aerators')
            .delete()
            .eq('coupon_id', id);

        if (relationError) {
            console.error('Error deleting relations:', relationError);
            // Verify if error is just "doesn't exist" or real DB error. 
            // Usually delete works even if no rows match, so real error is bad.
            alert('Failed to cleanup associated products. Try again.');
            setLoading(false);
            return;
        }

        // 2. Delete the coupon
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon: ' + error.message);
            // Revert optimistic update if we had one? 
            // We didn't do optimistic delete here (we waited), so just list remains.
        } else {
            setCoupons(coupons.filter(c => c.id !== id));
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h2 className="font-semibold text-slate-700">All Coupons</h2>
                <Link
                    href="/admin/coupons/new"
                    className="flex items-center gap-2 bg-aqua-600 hover:bg-aqua-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    New Coupon
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Discount</th>
                            <th className="px-6 py-3">Validity</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {coupons.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No coupons found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            coupons.map((coupon) => (
                                <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                        {coupon.code}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {coupon.discount_type === 'percentage' ? (
                                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">
                                                {coupon.discount_value}% OFF
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                                                ₹{coupon.discount_value} OFF
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {coupon.start_date ? new Date(coupon.start_date).toLocaleDateString() : 'Now'}
                                        {' - '}
                                        {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'Forever'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:ring-offset-2
                                                ${coupon.is_active ? 'bg-aqua-600' : 'bg-slate-200'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                                    ${coupon.is_active ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/coupons/${coupon.id}`}
                                                className="p-1.5 text-slate-400 hover:text-aqua-600 hover:bg-aqua-50 rounded transition-colors"
                                            >
                                                <PencilSquareIcon className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => deleteCoupon(coupon.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
