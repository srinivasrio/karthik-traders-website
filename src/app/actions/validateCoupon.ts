'use server';

import { createClient } from '@/lib/supabase-server';

export type CouponValidationResult = {
    isValid: boolean;
    coupon?: {
        id: string;
        code: string;
        discount_type: 'percentage' | 'flat';
        discount_value: number;
        applicable_products: string[];
    };
    error?: string;
};

export async function validateCoupon(code: string, cartProductIds: string[]): Promise<CouponValidationResult> {
    const supabase = await createClient();
    const normalizeCode = code.trim().toUpperCase();

    // 1. Fetch Coupon
    const { data: coupon, error } = await supabase
        .from('coupons')
        .select(`
            *,
            coupon_aerators (product_id)
        `)
        .eq('code', normalizeCode)
        .eq('is_active', true)
        .single();

    if (error || !coupon) {
        return { isValid: false, error: 'Invalid or expired coupon code.' };
    }

    // 2. Check Date Validity
    const now = new Date();
    if (coupon.start_date && new Date(coupon.start_date) > now) {
        return { isValid: false, error: 'Coupon is not yet active.' };
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
        return { isValid: false, error: 'Coupon has expired.' };
    }

    // 3. Check Product Applicability
    const applicableProductIds = coupon.coupon_aerators.map((ca: any) => ca.product_id);

    // If usage specific: "Coupon applies only to selected aerators"
    // We check if AT LEAST ONE item in the cart is eligible.
    // Or do we strictly enforce it? Use case usually implies discount applies to eligible items.
    // We will return the list of applicable products so the frontend/cart context can calculate the discount properly.

    const hasApplicableItem = cartProductIds.some(id => applicableProductIds.includes(id));

    if (!hasApplicableItem) {
        return { isValid: false, error: 'This coupon is not applicable to any items in your cart.' };
    }

    return {
        isValid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            applicable_products: applicableProductIds
        }
    };
}
