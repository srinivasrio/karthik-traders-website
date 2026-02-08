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
export type CartItemIdentifiers = {
    uuid: string;     // The ID used in CartContext (usually UUID from DB)
    slug: string;     // The product Slug
    shortId?: string; // The static ID from products.ts
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
    // coupon_aerators.product_id can be UUID, SLUG, or SHORT_ID depending on when/how it was saved.
    const applicableIdentifiers = coupon.coupon_aerators.map((ca: any) => ca.product_id);

    // Filter cart items that are applicable by checking ALL possible identifiers
    const applicableItems = cartItems.filter(item =>
        applicableIdentifiers.includes(item.uuid) ||
        applicableIdentifiers.includes(item.slug) ||
        (item.shortId && applicableIdentifiers.includes(item.shortId))
    );

    if (applicableItems.length === 0) {
        return { isValid: false, error: 'This coupon is not applicable to any items in your cart.' };
    }

    // Return the UUIDs so CartContext can correctly identify the items to discount
    const applicableUUIDs = applicableItems.map(i => i.uuid);

    return {
        isValid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            applicable_products: applicableUUIDs // CRITICAL: Return UUIDs for CartContext
        }
    };
}
