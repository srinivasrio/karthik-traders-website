/**
 * Dynamic State-wise & Pincode Delivery Configuration for Karthik Traders
 * Manages delivery policies, shipping fees (Free vs Customer Arranged),
 * timelines, and vehicle presets dynamically loaded from DB / JSON.
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
    pincodePrefixes: string[];
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
}

export interface PincodeDeliveryLookupResult {
    pincode: string;
    cleanPincode: string;
    stateName: string;
    stateCode: string;
    isFreeDelivery: boolean;
    responsibility: 'karthik_traders' | 'customer';
    shippingFeeText: string;
    timelineText: string;
    policyBadgeText: string;
    tagline: string;
    description: string;
    matchedBy: 'pincode_prefix' | 'state_name' | 'default_fallback';
    matchedPrefix?: string;
    badgeColor: {
        bg: string;
        border: string;
        text: string;
        dot: string;
    };
}

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

    const prefixes = Array.isArray(raw.pincode_prefixes)
        ? raw.pincode_prefixes
        : Array.isArray(raw.pincodePrefixes)
        ? raw.pincodePrefixes
        : [];

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
        pincodePrefixes: prefixes.map(String),
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
};

export const PRESET_VEHICLE_TYPES = DEFAULT_GENERAL_SETTINGS.vehiclePresets;

/**
 * Resolves delivery policy strictly by 6-digit Pincode.
 * Matches 3-digit prefix first, then 2-digit prefix, then falls back to other states.
 */
export function resolveDeliveryByPincode(
    pincode: string | number,
    rules: StateDeliveryRule[] = DEFAULT_RULES
): PincodeDeliveryLookupResult {
    const clean = String(pincode || '').replace(/\D/g, '').slice(0, 6);
    const activeRules = rules.filter((r) => r.isActive);

    if (clean.length >= 2) {
        // Find best match by sorting prefix length descending (e.g. 524 before 52)
        let bestMatchRule: StateDeliveryRule | null = null;
        let matchedPrefix = '';

        for (const rule of activeRules) {
            for (const prefix of rule.pincodePrefixes || []) {
                const cleanPrefix = String(prefix).trim();
                if (cleanPrefix && clean.startsWith(cleanPrefix)) {
                    if (cleanPrefix.length > matchedPrefix.length) {
                        matchedPrefix = cleanPrefix;
                        bestMatchRule = rule;
                    }
                }
            }
        }

        if (bestMatchRule) {
            return {
                pincode: String(pincode),
                cleanPincode: clean,
                stateName: bestMatchRule.stateName,
                stateCode: bestMatchRule.stateCode,
                isFreeDelivery: bestMatchRule.isFreeDelivery,
                responsibility: bestMatchRule.responsibility,
                shippingFeeText: bestMatchRule.isFreeDelivery ? 'FREE Delivery (₹0)' : 'Customer Arranged (To-Pay)',
                timelineText: bestMatchRule.timelineText,
                policyBadgeText: bestMatchRule.policyBadgeText,
                tagline: bestMatchRule.tagline,
                description: bestMatchRule.description,
                matchedBy: 'pincode_prefix',
                matchedPrefix,
                badgeColor: bestMatchRule.badgeColor,
            };
        }
    }

    // Default fallback rule (e.g. other_states)
    const fallbackRule =
        activeRules.find((r) => r.id === 'other_states' || r.stateCode === 'OTHER') ||
        activeRules[activeRules.length - 1] ||
        DEFAULT_RULES[DEFAULT_RULES.length - 1];

    return {
        pincode: String(pincode),
        cleanPincode: clean,
        stateName: fallbackRule.stateName,
        stateCode: fallbackRule.stateCode,
        isFreeDelivery: fallbackRule.isFreeDelivery,
        responsibility: fallbackRule.responsibility,
        shippingFeeText: fallbackRule.isFreeDelivery ? 'FREE Delivery (₹0)' : 'Customer Arranged (To-Pay)',
        timelineText: fallbackRule.timelineText,
        policyBadgeText: fallbackRule.policyBadgeText,
        tagline: fallbackRule.tagline,
        description: fallbackRule.description,
        matchedBy: 'default_fallback',
        badgeColor: fallbackRule.badgeColor,
    };
}

/**
 * Universal resolver: checks pincode first if numeric or 6 digits;
 * otherwise resolves by State Name / Code.
 */
export function resolveDeliveryRule(
    stateOrPincode?: string,
    rules: StateDeliveryRule[] = DEFAULT_RULES
): StateDeliveryRule {
    const activeRules = rules.filter((r) => r.isActive);
    const apDefault = activeRules.find((r) => r.stateCode === 'AP') || DEFAULT_RULES[0];
    const otherDefault = activeRules.find((r) => r.stateCode === 'OTHER') || DEFAULT_RULES[DEFAULT_RULES.length - 1];

    if (!stateOrPincode) return apDefault;

    const trimmed = String(stateOrPincode).trim();

    // 1. If numeric or looks like a pincode, resolve by pincode
    const numericOnly = trimmed.replace(/\D/g, '');
    if (numericOnly.length >= 2 && (/^\d+$/.test(trimmed) || numericOnly.length === 6)) {
        const pinResult = resolveDeliveryByPincode(numericOnly, activeRules);
        const matched = activeRules.find((r) => r.stateCode === pinResult.stateCode);
        if (matched) return matched;
    }

    // 2. Resolve by State Name / Code
    const normalized = trimmed.toLowerCase().replace(/[^a-z\s]/g, '').trim();

    // Exact state name match
    const exact = activeRules.find((r) => r.stateName.toLowerCase() === normalized || r.stateCode.toLowerCase() === normalized);
    if (exact) return exact;

    // Fuzzy state matches
    if (normalized.includes('andhra') || normalized === 'ap') {
        return activeRules.find((r) => r.stateCode === 'AP') || apDefault;
    }
    if (normalized.includes('telangana') || normalized === 'ts' || normalized === 'tg') {
        return activeRules.find((r) => r.stateCode === 'TS') || activeRules[1] || otherDefault;
    }
    if (normalized.includes('tamil') || normalized.includes('nadu') || normalized === 'tn') {
        return activeRules.find((r) => r.stateCode === 'TN') || activeRules[2] || otherDefault;
    }
    if (normalized.includes('bengal') || normalized.includes('kolkata') || normalized === 'wb') {
        return activeRules.find((r) => r.stateCode === 'WB') || activeRules[3] || otherDefault;
    }

    return otherDefault;
}

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
