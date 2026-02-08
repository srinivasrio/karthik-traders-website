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

// Define input type
type CartItemIdentifiers = {
    id: string;
    slug: string;
};

export async function validateCoupon(code: string, cartItems: CartItemIdentifiers[]): Promise<CouponValidationResult> {
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
    // Normalize to start of day for accurate date comparison
    now.setHours(0, 0, 0, 0);

    if (coupon.start_date) {
        const startDate = new Date(coupon.start_date);
        startDate.setHours(0, 0, 0, 0);
        if (startDate > now) {
            return { isValid: false, error: 'Coupon is not yet active.' };
        }
    }

    if (coupon.end_date) {
        const endDate = new Date(coupon.end_date);
        endDate.setHours(0, 0, 0, 0);
        if (now > endDate) {
            return { isValid: false, error: 'Coupon has expired.' };
        }
    }

    // 3. Check Product Applicability
    // coupon_aerators.product_id can be ID or SLUG depending on when/how it was saved.
    const applicableIdentifiers = coupon.coupon_aerators.map((ca: any) => ca.product_id);

    // Check if ANY item in cart matches EITHER id or slug
    const hasApplicableItem = cartItems.some(item =>
        applicableIdentifiers.includes(item.id) || applicableIdentifiers.includes(item.slug)
    );

    if (!hasApplicableItem) {
        return { isValid: false, error: 'This coupon is not applicable to any items in your cart.' };
    }

    // Filter cart items that are applicable
    const applicableItems = cartItems.filter(item =>
        applicableIdentifiers.includes(item.id) || applicableIdentifiers.includes(item.slug)
    );

    // Return the indentifiers that matched (we can return the slugs for consistency)
    const matchedSlugs = applicableItems.map(i => i.slug);

    return {
        isValid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            applicable_products: matchedSlugs // Return slugs of applicable products
        }
    };
}
