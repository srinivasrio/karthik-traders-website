'use server';

import { createClient } from '@/lib/supabase-server';
import { allProducts } from '@/data/products';

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
    const supabase = createClient();
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
    // We now use the 'applicable_products' text array column directly, which stores Slugs.
    // If identifying via UUID, we must resolve it.
    let applicableIdentifiers: string[] = [];

    if (coupon.applicable_products && Array.isArray(coupon.applicable_products)) {
        applicableIdentifiers = coupon.applicable_products;
    } else if (coupon.coupon_aerators && Array.isArray(coupon.coupon_aerators)) {
        // Fallback for old schema if it still exists (legacy support)
        applicableIdentifiers = coupon.coupon_aerators.map((ca: any) => ca.product_id);
    }

    // If NO restrictions are found, does it apply to everything? 
    // Usually coupons are specific. If applicable_products is NULL/Empty, maybe it applies to all?
    // For now, let's assume if it's empty, it applies to NOTHING (safer) unless it's a "Storewide" coupon.
    // But per current requirement "SBSS500" is specific. 

    const isStorewide = applicableIdentifiers.length === 0;
    // If you want storewide coupons, you might need a flag. 
    // For now, if applicableIdentifiers HAS values, we enforce them.
    // If it DOES NOT have values, we assume it's storewide (or check a type).
    // Let's assume if applicable_products is empty, it's valid for all items.

    // Update: user requested specific coupon "SBSS500".

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

    // RE-IMPLEMENTATION TO fix Scope:
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
    // 5. Is the Resolved Short ID (from static data via Slug) in the list? (Legacy Coupon Fallback)

    const finalApplicableItems = cartItems.filter(item => {
        const uuidSlug = uuidToSlugMap.get(item.uuid);
        const effectiveSlug = item.slug || uuidSlug;

        // If we have a slug, lookup the static Short ID
        let staticShortId = '';
        if (effectiveSlug) {
            const staticProduct = allProducts.find(p => p.slug === effectiveSlug);
            if (staticProduct) staticShortId = staticProduct.id;
        }

        const isMatch = isStorewide ||
            applicableIdentifiers.includes(item.uuid) ||
            applicableIdentifiers.includes(item.slug) ||
            (item.shortId && applicableIdentifiers.includes(item.shortId)) ||
            (uuidSlug && applicableIdentifiers.includes(uuidSlug)) ||
            (staticShortId && applicableIdentifiers.includes(staticShortId));

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

    // Also include resolved Short IDs from static data (crucial if Context uses Short IDs)
    const resolvedShortIds = finalApplicableItems.map(item => {
        const effectiveSlug = item.slug || uuidToSlugMap.get(item.uuid);
        if (effectiveSlug) {
            const staticProduct = allProducts.find(p => p.slug === effectiveSlug);
            return staticProduct?.id;
        }
        return undefined;
    }).filter((s): s is string => !!s);

    const allApplicableIdentifiers = [...new Set([
        ...applicableUUIDs,
        ...applicableSlugs,
        ...applicableShortIds,
        ...resolvedSlugs,
        ...resolvedShortIds
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
