'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';
import Link from 'next/link';

interface CouponFormProps {
    initialCoupon: any;
    initialSelectedAerators: string[];
    allAerators: Product[];
}

export default function CouponForm({ initialCoupon, initialSelectedAerators, allAerators }: CouponFormProps) {
    console.log('CouponForm Rendered. Initial Selected:', initialSelectedAerators);
    const router = useRouter();
    // const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        code: initialCoupon?.code || '',
        discount_type: initialCoupon?.discount_type || 'percentage',
        discount_value: initialCoupon?.discount_value || 0,
        start_date: initialCoupon?.start_date ? new Date(initialCoupon.start_date).toISOString().split('T')[0] : '',
        end_date: initialCoupon?.end_date ? new Date(initialCoupon.end_date).toISOString().split('T')[0] : '',
        is_active: initialCoupon?.is_active ?? true,
    });

    const [selectedAerators, setSelectedAerators] = useState<string[]>(initialSelectedAerators);

    // Sync state with props when initialSelectedAerators changes (e.g. navigation)
    useEffect(() => {
        console.log('Syncing selectedAerators from props:', initialSelectedAerators);
        setSelectedAerators(initialSelectedAerators);
    }, [initialSelectedAerators]);

    const handleAeratorToggle = (productId: string) => {
        setSelectedAerators(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSelectAll = () => {
        if (selectedAerators.length === allAerators.length) {
            setSelectedAerators([]);
        } else {
            setSelectedAerators(allAerators.map(p => p.id));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Upsert Coupon
            const couponPayload = {
                code: formData.code.toUpperCase(),
                discount_type: formData.discount_type,
                discount_value: Number(formData.discount_value),
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
                is_active: formData.is_active,
                updated_at: new Date().toISOString(),
            };

            let couponId = initialCoupon?.id;

            if (initialCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(couponPayload)
                    .eq('id', initialCoupon.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('coupons')
                    .insert([couponPayload])
                    .select()
                    .single();
                if (error) throw error;
                couponId = data.id;
            }

            // 2. Update Aerator Relations
            // First, delete existing relations for this coupon
            if (initialCoupon) {
                const { error: deleteError } = await supabase
                    .from('coupon_aerators')
                    .delete()
                    .eq('coupon_id', couponId);
                if (deleteError) throw deleteError;
            }

            // Then insert new ones
            if (selectedAerators.length > 0) {
                const relations = selectedAerators.map(productId => ({
                    coupon_id: couponId,
                    product_id: productId,
                }));

                const { error: insertError } = await supabase
                    .from('coupon_aerators')
                    .insert(relations);
                if (insertError) throw insertError;
            }

            // Redirect
            router.push('/admin/coupons');
            router.refresh();
        } catch (error: any) {
            console.error('Error saving coupon:', error);
            alert(`Failed to save coupon: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
            {/* General Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-deep-blue-900 mb-6">General Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 outline-none uppercase font-mono"
                            placeholder="e.g. SUMMER25"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <div className="flex items-center gap-3 py-2">
                            <span className={`text-sm font-medium ${formData.is_active ? 'text-aqua-600' : 'text-slate-400'}`}>
                                {formData.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:ring-offset-2
                                    ${formData.is_active ? 'bg-aqua-600' : 'bg-slate-200'}
                                `}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type</label>
                        <select
                            value={formData.discount_type}
                            onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'flat' })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 outline-none"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={formData.discount_value}
                            onChange={e => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Aerator Selection Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-deep-blue-900">Applicable Aerators</h2>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-sm font-medium text-aqua-600 hover:text-aqua-700 hover:bg-aqua-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {selectedAerators.length === allAerators.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAerators.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => handleAeratorToggle(product.id)}
                            className={`
                                cursor-pointer rounded-lg border p-4 flex items-start gap-3 transition-all
                                ${selectedAerators.includes(product.id)
                                    ? 'border-aqua-500 bg-aqua-50/50 shadow-sm'
                                    : 'border-slate-200 hover:border-aqua-200 hover:bg-slate-50'
                                }
                            `}
                        >
                            <div className={`
                                mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                                ${selectedAerators.includes(product.id)
                                    ? 'bg-aqua-500 border-aqua-500'
                                    : 'border-slate-300 bg-white'
                                }
                            `}>
                                {selectedAerators.includes(product.id) && (
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-deep-blue-900 leading-tight mb-0.5">
                                    {(product.brand === 'seaboss' ? 'SEA BOSS' : product.brand.toUpperCase())}
                                </h3>
                                <p className="text-sm font-semibold text-deep-blue-900">
                                    {product.model}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                <Link
                    href="/admin/coupons"
                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-aqua-600 hover:bg-aqua-700 text-white font-medium rounded-lg shadow-sm shadow-aqua-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? 'Saving...' : 'Save Coupon'}
                </button>
            </div>
        </form>
    );
}
