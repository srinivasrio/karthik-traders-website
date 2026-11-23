/**
 * State-Based Delivery Configuration for Karthik Traders
 * Delivery fee (Free vs Customer Arranged) and timelines are determined
 * strictly by the customer's STATE.
 */

import initialSettings from '@/data/delivery-settings.json';

export interface StateDeliveryRule {
    id: string;
    stateName: string;
    stateCode: string;
    isFreeDelivery: boolean;
    responsibility: 'karthik_traders' | 'customer';
    estimatedDaysMin: number;
    estimatedDaysMax: number;
    timelineText: string;
    policyBadgeText: string;
    tagline: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    badgeColor: {
        bg: string;
        border: string;
        text: string;
        dot: string;
    };
}

export interface DeliveryGeneralSettings {
    warehouseCity: string;
    warehouseState: string;
    warehousePhone: string;
    vehiclePresets: string[];
    freeShippingNotice: string;
    customerArrangedNotice: string;
    freeDeliveryForAeratorsOnly?: boolean;
    eligibleAeratorSlugs?: string[];
    eligibleProductSlugs?: string[];
    eligibleCategories?: string[];
    enabledInProduction?: boolean;
    isFreeDeliveryEnabled?: boolean;
    minAeratorQtyForFreeDelivery?: number;
}

/**
 * Standard list of all Indian States and Union Territories for dropdown selection
 */
export const INDIAN_STATES_LIST = [
    'Andhra Pradesh',
    'Telangana',
    'Tamil Nadu',
    'West Bengal',
    'Karnataka',
    'Odisha',
    'Kerala',
    'Maharashtra',
    'Gujarat',
    'Bihar',
    'Uttar Pradesh',
    'Madhya Pradesh',
    'Rajasthan',
    'Punjab',
    'Haryana',
    'Assam',
    'Chhattisgarh',
    'Jharkhand',
    'Goa',
    'Uttarakhand',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Delhi',
    'Puducherry',
    'Other States',
];

/**
 * Helper to compute badge styling colors according to fee & responsibility
 */
export function getBadgeColor(responsibility: 'karthik_traders' | 'customer', isFree: boolean, stateCode?: string) {
    if (isFree || responsibility === 'karthik_traders') {
        return {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            dot: 'bg-emerald-500',
        };
    }

    const code = (stateCode || '').toUpperCase();
    if (code === 'WB' || code.includes('BENGAL')) {
        return {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-800',
            dot: 'bg-purple-500',
        };
    }
    if (code === 'TN' || code.includes('TAMIL')) {
        return {
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            text: 'text-indigo-800',
            dot: 'bg-indigo-500',
        };
    }
    if (code === 'TS' || code.includes('TELANGANA')) {
        return {
            bg: 'bg-sky-50',
            border: 'border-sky-200',
            text: 'text-sky-800',
            dot: 'bg-sky-500',
        };
    }

    return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        dot: 'bg-slate-500',
    };
}

/**
 * Transform raw JSON / DB row into strongly typed StateDeliveryRule
 */
export function mapRawRuleToStateDeliveryRule(raw: any): StateDeliveryRule {
    const isFree = Boolean(raw.is_free_delivery ?? raw.isFreeDelivery ?? false);
    const resp = (raw.responsibility || (isFree ? 'karthik_traders' : 'customer')) as 'karthik_traders' | 'customer';
    const stateName = raw.state_name || raw.stateName || 'Other States';
    const stateCode = raw.state_code || raw.stateCode || 'OTHER';

    const minDays = Number(raw.estimated_days_min ?? raw.estimatedDaysMin ?? 3);
    const maxDays = Number(raw.estimated_days_max ?? raw.estimatedDaysMax ?? 7);
    const timeline = raw.timeline_text || raw.timelineText || `${minDays} to ${maxDays} Days`;

    let badgeText = raw.policy_badge_text || raw.policyBadgeText;
    if (!badgeText) {
        badgeText = isFree ? 'FREE Delivery' : `Customer Responsibility (${timeline})`;
    }

    return {
        id: raw.id || stateName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        stateName,
        stateCode,
        isFreeDelivery: isFree,
        responsibility: resp,
        estimatedDaysMin: minDays,
        estimatedDaysMax: maxDays,
        timelineText: timeline,
        policyBadgeText: badgeText,
        tagline: raw.tagline || (isFree ? `Free door & farm pond delivery in ${timeline}` : `Delivery in ${timeline} (Customer arranged transport)`),
        description: raw.description || (isFree ? `Karthik Traders provides 100% Free Door/Pond Delivery across ${stateName}.` : `Transport is customer responsibility. Dispatched from Nellore via regional carrier (To-Pay) or customer arranged vehicle.`),
        isActive: raw.is_active ?? raw.isActive ?? true,
        sortOrder: Number(raw.sort_order ?? raw.sortOrder ?? 99),
        badgeColor: getBadgeColor(resp, isFree, stateCode),
    };
}

/**
 * In-memory fallback rules derived from bundled JSON
 */
export const DEFAULT_RULES: StateDeliveryRule[] = (initialSettings?.rules || []).map(mapRawRuleToStateDeliveryRule);

export const DEFAULT_GENERAL_SETTINGS: DeliveryGeneralSettings = {
    warehouseCity: initialSettings?.general?.warehouse_city || 'Nellore',
    warehouseState: initialSettings?.general?.warehouse_state || 'Andhra Pradesh',
    warehousePhone: initialSettings?.general?.warehouse_phone || '+91 86885 66023',
    vehiclePresets: initialSettings?.general?.vehicle_presets || [
        'Tata Ace (Chota Hathi)',
        'Ashok Leyland Dost',
        'Mahindra Bolero Maxi Truck / Pickup',
        '14ft Eicher Truck',
        '17ft Multi-Axle Truck',
        'Tractor Trailer',
        'Navata Road Transport (Lorry)',
        'VRL Logistics',
        'Kranti Transport',
        'Customer Own Vehicle / Self-Pickup',
        'Other Transport Carrier',
    ],
    freeShippingNotice: initialSettings?.general?.free_shipping_notice || '100% Free Door/Pond Delivery across Andhra Pradesh covered by Karthik Traders.',
    customerArrangedNotice: initialSettings?.general?.customer_arranged_notice || 'Transport arranged by customer (To-Pay / customer vehicle).',
    freeDeliveryForAeratorsOnly: (initialSettings?.general as any)?.free_delivery_for_aerators_only ?? true,
    eligibleAeratorSlugs: (initialSettings?.general as any)?.eligible_aerator_slugs ?? [],
    enabledInProduction: (initialSettings?.general as any)?.is_delivery_feature_enabled_in_production ?? true,
    isFreeDeliveryEnabled: (initialSettings?.general as any)?.is_free_delivery_enabled ?? true,
    minAeratorQtyForFreeDelivery: Number((initialSettings?.general as any)?.min_aerator_qty_for_free_delivery ?? 10),
};

export const PRESET_VEHICLE_TYPES = DEFAULT_GENERAL_SETTINGS.vehiclePresets;

/**
 * Checks if a product or cart item is an Aerator Set
 */
export function isAeratorProduct(item: any): boolean {
    if (!item) return false;
    const cat = String(item.category || '').toLowerCase().trim();
    if (cat === 'aerator-set' || cat === 'aerators' || cat === 'aerator') return true;

    // Check slug or id keywords
    const identifier = String(item.slug || item.id || item.model || '').toLowerCase();
    if (
        identifier.includes('aerator') ||
        identifier.includes('paddle') ||
        identifier.startsWith('aqualion-') ||
        identifier.startsWith('seaboss-')
    ) {
        // Exclude spares like motors, gearboxes, floats, fans, rods, frames, kit-box, long-arm
        if (
            cat.includes('spare') ||
            cat.includes('motor') ||
            cat.includes('gearbox') ||
            cat.includes('float') ||
            cat.includes('fan') ||
            cat.includes('rod') ||
            cat.includes('frame') ||
            cat.includes('kit') ||
            cat.includes('cover')
        ) {
            return false;
        }
        return true;
    }
    return false;
}

/**
 * Checks if an individual product / cart item is eligible for Free Delivery under current admin rules
 */
export function isItemEligibleForFreeDelivery(
    item: any,
    generalSettings: DeliveryGeneralSettings = DEFAULT_GENERAL_SETTINGS
): boolean {
    if (!item) return false;

    // Check admin-selected products in eligibleProductSlugs / eligibleAeratorSlugs
    const chosen = generalSettings.eligibleProductSlugs || generalSettings.eligibleAeratorSlugs;
    if (Array.isArray(chosen) && chosen.length > 0) {
        if (chosen.includes('none_selected') || chosen.includes('__none__')) {
            if (chosen.length === 1) return false;
        }
        const itemSlug = String(item.slug || '').toLowerCase();
        const itemId = String(item.id || '').toLowerCase();
        return chosen.some((slugOrId) => {
            const clean = String(slugOrId).toLowerCase();
            return clean === itemSlug || clean === itemId;
        });
    }

    // Default fallback when no specific list is configured:
    const aeratorsOnly = generalSettings.freeDeliveryForAeratorsOnly ?? true;
    if (!aeratorsOnly) return true;

    return isAeratorProduct(item);
}

/**
 * Evaluates whether an entire order or cart qualifies for Free Delivery
 */
export function evaluateOrderFreeDelivery(
    items: any[],
    destinationState: string,
    rules: StateDeliveryRule[] = DEFAULT_RULES,
    generalSettings: DeliveryGeneralSettings = DEFAULT_GENERAL_SETTINGS
): {
    isFreeDelivery: boolean;
    hasEligibleAerators: boolean;
    shippingFeeText: string;
    deliveryRule: StateDeliveryRule;
    reason: string;
} {
    const baseRule = resolveDeliveryRule(destinationState, rules, generalSettings);

    // 1. Check if Free Delivery is globally enabled by admin
    const isFreeDeliveryGloballyEnabled = generalSettings.isFreeDeliveryEnabled ?? true;
    if (!isFreeDeliveryGloballyEnabled) {
        return {
            isFreeDelivery: false,
            hasEligibleAerators: false,
            shippingFeeText: 'Customer Arranged (To-Pay)',
            deliveryRule: {
                ...baseRule,
                isFreeDelivery: false,
                policyBadgeText: 'Customer Responsibility (To-Pay)',
                tagline: `Delivery in ${baseRule.timelineText} (Customer arranged transport)`,
                description: `Free delivery option is currently disabled by store administration. Dispatched via regional transport (To-Pay) or customer vehicle.`,
            },
            reason: `Free delivery option is currently disabled by store administration. Transport is customer arranged (To-Pay).`,
        };
    }

    // 2. If the destination state is not free delivery (e.g. Telangana, Tamil Nadu, WB)
    if (!baseRule.isFreeDelivery) {
        return {
            isFreeDelivery: false,
            hasEligibleAerators: false,
            shippingFeeText: 'Customer Arranged (To-Pay)',
            deliveryRule: baseRule,
            reason: `Transport is customer responsibility in ${baseRule.stateName} (dispatched via regional transport To-Pay or customer vehicle).`,
        };
    }

    // 3. Destination state is Free Delivery (e.g. Andhra Pradesh)
    const aeratorsOnly = generalSettings.freeDeliveryForAeratorsOnly ?? true;
    const minAerators = Number(generalSettings.minAeratorQtyForFreeDelivery ?? 10);

    // Calculate total quantity of eligible products in the order/cart
    let totalEligibleQty = 0;
    let hasAnyEligibleItems = false;

    (items || []).forEach((item) => {
        if (isItemEligibleForFreeDelivery(item, generalSettings)) {
            hasAnyEligibleItems = true;
            totalEligibleQty += Number(item.quantity || 1);
        }
    });

    if (!aeratorsOnly && !generalSettings.eligibleAeratorSlugs?.length) {
        // Free delivery on all items in this state without aerators restriction
        return {
            isFreeDelivery: true,
            hasEligibleAerators: true,
            shippingFeeText: 'FREE Delivery (₹0)',
            deliveryRule: baseRule,
            reason: `100% Free Door/Pond Delivery across ${baseRule.stateName}.`,
        };
    }

    if (!hasAnyEligibleItems) {
        // No eligible items found in items (only excluded items)
        const sparesRule: StateDeliveryRule = {
            ...baseRule,
            isFreeDelivery: false,
            policyBadgeText: 'Customer Responsibility (Spares / Non-eligible)',
            tagline: `Delivery in ${baseRule.timelineText} (Free delivery requires minimum ${minAerators} eligible items)`,
            description:
                `Free door & pond delivery in ${baseRule.stateName} is exclusive to orders of ${minAerators} or more eligible items. Non-eligible items are dispatched via regional transport (To-Pay) or customer vehicle.`,
            badgeColor: {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-800',
                dot: 'bg-amber-500',
            },
        };

        return {
            isFreeDelivery: false,
            hasEligibleAerators: false,
            shippingFeeText: 'Customer Arranged (To-Pay)',
            deliveryRule: sparesRule,
            reason:
                `Free delivery applies to orders of ${minAerators}+ eligible items in ${baseRule.stateName}. For non-eligible items, transport is customer arranged (To-Pay).`,
        };
    }

    // Has eligible items! Check minimum quantity threshold (Default: 10 items)
    if (totalEligibleQty >= minAerators) {
        return {
            isFreeDelivery: true,
            hasEligibleAerators: true,
            shippingFeeText: 'FREE Delivery (₹0)',
            deliveryRule: baseRule,
            reason: `Order qualifies for 100% Free Door & Pond Delivery across ${baseRule.stateName} (Order contains ${totalEligibleQty} eligible products; Min required: ${minAerators}).`,
        };
    }

    // Has eligible items, but below minimum order quantity (e.g. 1 to 9 items)
    const shortfall = minAerators - totalEligibleQty;
    const moqRule: StateDeliveryRule = {
        ...baseRule,
        isFreeDelivery: false,
        policyBadgeText: `Customer Responsibility (< ${minAerators} Items)`,
        tagline: `Delivery in ${baseRule.timelineText} (Free delivery requires minimum ${minAerators} aerator sets)`,
        description:
            `Free door & pond delivery in ${baseRule.stateName} requires a minimum order of ${minAerators} Aerator Sets. Orders with fewer than ${minAerators} aerators are dispatched via regional transport (To-Pay) or customer vehicle.`,
        badgeColor: {
            bg: 'bg-sky-50',
            border: 'border-sky-200',
            text: 'text-sky-800',
            dot: 'bg-sky-500',
        },
    };

    return {
        isFreeDelivery: false,
        hasEligibleAerators: true,
        shippingFeeText: 'Customer Arranged (To-Pay)',
        deliveryRule: moqRule,
        reason: `Free Delivery in ${baseRule.stateName} requires a minimum of ${minAerators} eligible items (Cart has ${totalEligibleQty} item${totalEligibleQty > 1 ? 's' : ''}. Add ${shortfall} more item${shortfall > 1 ? 's' : ''} to unlock 100% Free Delivery).`,
    };
}

/**
 * Checks whether the delivery UI should be displayed to the visitor.
 * On localhost / dev: Always true for testing.
 * On production: Controlled by admin general setting `enabledInProduction`.
 */
export function isDeliveryFeatureVisible(
    generalSettings?: DeliveryGeneralSettings
): boolean {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            host.startsWith('192.168.') ||
            host.startsWith('10.') ||
            host.endsWith('.local')
        ) {
            return true;
        }
    }
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    return Boolean(generalSettings?.enabledInProduction);
}

/**
 * Resolves delivery policy strictly based on STATE (State Name or State Code).
 * Checks exact match, then normalized match, then falls back to other states.
 */
export function resolveDeliveryRule(
    stateInput?: string,
    rules: StateDeliveryRule[] = DEFAULT_RULES,
    generalSettings?: DeliveryGeneralSettings
): StateDeliveryRule {
    const activeRules = rules.filter((r) => r.isActive);
    const apDefault = activeRules.find((r) => r.stateCode === 'AP') || DEFAULT_RULES[0];
    const otherDefault = activeRules.find((r) => r.stateCode === 'OTHER' || r.id === 'other_states') || DEFAULT_RULES[DEFAULT_RULES.length - 1];

    let matchedRule = apDefault;

    if (stateInput) {
        const trimmed = String(stateInput).trim();
        if (trimmed) {
            const normalized = trimmed.toLowerCase().replace(/[^a-z\s]/g, '').trim();

            // 1. Exact match on stateName or stateCode
            const exact = activeRules.find(
                (r) => r.stateName.toLowerCase() === normalized || r.stateCode.toLowerCase() === normalized
            );
            if (exact) {
                matchedRule = exact;
            } else if (normalized.includes('andhra') || normalized === 'ap') {
                matchedRule = activeRules.find((r) => r.stateCode === 'AP') || apDefault;
            } else if (normalized.includes('telangana') || normalized === 'ts' || normalized === 'tg') {
                matchedRule = activeRules.find((r) => r.stateCode === 'TS') || activeRules[1] || otherDefault;
            } else if (normalized.includes('tamil') || normalized.includes('nadu') || normalized === 'tn') {
                matchedRule = activeRules.find((r) => r.stateCode === 'TN') || activeRules[2] || otherDefault;
            } else if (normalized.includes('bengal') || normalized.includes('kolkata') || normalized === 'wb') {
                matchedRule = activeRules.find((r) => r.stateCode === 'WB') || activeRules[3] || otherDefault;
            } else if (normalized.includes('karnataka') || normalized === 'ka') {
                matchedRule = activeRules.find((r) => r.stateCode === 'KA' || r.stateName.toLowerCase().includes('karnataka')) || otherDefault;
            } else if (normalized.includes('odisha') || normalized.includes('orissa') || normalized === 'or') {
                matchedRule = activeRules.find((r) => r.stateCode === 'OR' || r.stateName.toLowerCase().includes('odisha')) || otherDefault;
            } else if (normalized.includes('kerala') || normalized === 'kl') {
                matchedRule = activeRules.find((r) => r.stateCode === 'KL' || r.stateName.toLowerCase().includes('kerala')) || otherDefault;
            } else if (normalized.includes('maharashtra') || normalized === 'mh') {
                matchedRule = activeRules.find((r) => r.stateCode === 'MH' || r.stateName.toLowerCase().includes('maharashtra')) || otherDefault;
            } else if (normalized.includes('gujarat') || normalized === 'gj') {
                matchedRule = activeRules.find((r) => r.stateCode === 'GJ' || r.stateName.toLowerCase().includes('gujarat')) || otherDefault;
            } else {
                // Substring match against any configured state
                const subMatch = activeRules.find((r) => r.stateName.toLowerCase().includes(normalized));
                matchedRule = subMatch || otherDefault;
            }
        }
    }

    if (generalSettings && generalSettings.isFreeDeliveryEnabled === false) {
        return {
            ...matchedRule,
            isFreeDelivery: false,
            policyBadgeText: 'Customer Responsibility (To-Pay)',
            tagline: `Delivery in ${matchedRule.timelineText} (Customer arranged transport)`,
            description: `Free delivery option is currently disabled by store administration. Dispatched via regional transport (To-Pay) or customer vehicle.`,
            badgeColor: getBadgeColor('customer', false, matchedRule.stateCode),
        };
    }

    return matchedRule;
}

/**
 * Backward compatibility alias for resolveDeliveryRule
 */
export const resolveDeliveryByPincode = (stateOrPin: string | number, rules?: StateDeliveryRule[]) => {
    const rule = resolveDeliveryRule(String(stateOrPin), rules);
    return {
        pincode: String(stateOrPin),
        cleanPincode: String(stateOrPin),
        stateName: rule.stateName,
        stateCode: rule.stateCode,
        isFreeDelivery: rule.isFreeDelivery,
        responsibility: rule.responsibility,
        shippingFeeText: rule.isFreeDelivery ? 'FREE Delivery (₹0)' : 'Customer Arranged (To-Pay)',
        timelineText: rule.timelineText,
        policyBadgeText: rule.policyBadgeText,
        tagline: rule.tagline,
        description: rule.description,
        matchedBy: 'state_name' as const,
        badgeColor: rule.badgeColor,
    };
};

/**
 * Standard State Rule dictionary backward-compatible with legacy imports
 */
export const STATE_DELIVERY_RULES: Record<string, StateDeliveryRule> = {
    'andhra pradesh': DEFAULT_RULES[0],
    'telangana': DEFAULT_RULES[1],
    'tamil nadu': DEFAULT_RULES[2],
    'west bengal': DEFAULT_RULES[3],
    'other states': DEFAULT_RULES[4],
};

export const DEFAULT_DELIVERY_RULE = DEFAULT_RULES[0];
