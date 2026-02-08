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

    // DEBUG LOGGING
    console.log('--- validateCoupon Debug ---');
    console.log('Coupon Code:', normalizeCode);
    console.log('Coupon Identifiers (DB):', applicableIdentifiers);
    console.log('Cart Items Input:', JSON.stringify(cartItems, null, 2));

    // CRITICAL ENHANCEMENT: Lookup Slugs for provided UUIDs from DB
    // This handles cases where client-side only had UUID and couldn't match strict Slug.
    // Filter to ensure we only query valid UUIDs (prevents 'invalid input syntax' DB errors)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cartUUIDs = cartItems
        .map(i => i.uuid)
        .filter(id => id && uuidRegex.test(id));

    // We need to map UUID -> Slug
    const uuidToSlugMap = new Map<string, string>();
    if (cartUUIDs.length > 0) {
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('id, slug')
            .in('id', cartUUIDs);

        if (!productError && productData) {
            productData.forEach(p => uuidToSlugMap.set(p.id, p.slug));
            console.log('Fetched Slugs from DB for UUIDs:', productData);
        } else if (productError) {
            console.error('Error fetching product slugs:', productError);
        }
    }

    // Now Filter
    // We check:
    // 1. Is item.uuid in list?
    // 2. Is item.slug in list?
    // 3. Is item.shortId in list?
    // 4. Is the DB-resolved Slug for this item's UUID in the list?
    const finalApplicableItems = cartItems.filter(item => {
        const uuidSlug = uuidToSlugMap.get(item.uuid);

        const isMatch = applicableIdentifiers.includes(item.uuid) ||
            applicableIdentifiers.includes(item.slug) ||
            (item.shortId && applicableIdentifiers.includes(item.shortId)) ||
            (uuidSlug && applicableIdentifiers.includes(uuidSlug));

        if (isMatch) console.log(`Item Match: ${item.slug || item.uuid}`);
        return isMatch;
    });

    if (finalApplicableItems.length === 0) {
        console.log('No applicable items found.');
        return { isValid: false, error: 'This coupon is not applicable to any items in your cart.' };
    }

    // Return ALL identifiers (UUID, Slug, ShortID) to ensure CartContext finds a match
    const applicableUUIDs = finalApplicableItems.map(i => i.uuid).filter((s): s is string => !!s);
    const applicableSlugs = finalApplicableItems.map(i => i.slug).filter((s): s is string => !!s);
    const applicableShortIds = finalApplicableItems.map(i => i.shortId).filter((s): s is string => !!s);
    // Also include the resolved slugs from DB
    const resolvedSlugs = finalApplicableItems.map(i => uuidToSlugMap.get(i.uuid)).filter((s): s is string => !!s);

    const allApplicableIdentifiers = [...new Set([
        ...applicableUUIDs,
        ...applicableSlugs,
        ...applicableShortIds,
        ...resolvedSlugs
    ])];

    console.log('Returning Identifiers:', allApplicableIdentifiers);

    return {
        isValid: true,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            applicable_products: allApplicableIdentifiers
        }
    };
}
