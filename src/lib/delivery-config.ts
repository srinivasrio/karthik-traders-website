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
};

export const PRESET_VEHICLE_TYPES = DEFAULT_GENERAL_SETTINGS.vehiclePresets;

/**
 * Resolves delivery policy strictly based on STATE (State Name or State Code).
 * Checks exact match, then normalized match, then falls back to other states.
 */
export function resolveDeliveryRule(
    stateInput?: string,
    rules: StateDeliveryRule[] = DEFAULT_RULES
): StateDeliveryRule {
    const activeRules = rules.filter((r) => r.isActive);
    const apDefault = activeRules.find((r) => r.stateCode === 'AP') || DEFAULT_RULES[0];
    const otherDefault = activeRules.find((r) => r.stateCode === 'OTHER' || r.id === 'other_states') || DEFAULT_RULES[DEFAULT_RULES.length - 1];

    if (!stateInput) return apDefault;

    const trimmed = String(stateInput).trim();
    if (!trimmed) return apDefault;

    const normalized = trimmed.toLowerCase().replace(/[^a-z\s]/g, '').trim();

    // 1. Exact match on stateName or stateCode
    const exact = activeRules.find(
        (r) => r.stateName.toLowerCase() === normalized || r.stateCode.toLowerCase() === normalized
    );
    if (exact) return exact;

    // 2. Fuzzy matches for common state names
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
    if (normalized.includes('karnataka') || normalized === 'ka') {
        const ka = activeRules.find((r) => r.stateCode === 'KA' || r.stateName.toLowerCase().includes('karnataka'));
        if (ka) return ka;
    }
    if (normalized.includes('odisha') || normalized.includes('orissa') || normalized === 'or') {
        const od = activeRules.find((r) => r.stateCode === 'OR' || r.stateName.toLowerCase().includes('odisha'));
        if (od) return od;
    }
    if (normalized.includes('kerala') || normalized === 'kl') {
        const kl = activeRules.find((r) => r.stateCode === 'KL' || r.stateName.toLowerCase().includes('kerala'));
        if (kl) return kl;
    }
    if (normalized.includes('maharashtra') || normalized === 'mh') {
        const mh = activeRules.find((r) => r.stateCode === 'MH' || r.stateName.toLowerCase().includes('maharashtra'));
        if (mh) return mh;
    }
    if (normalized.includes('gujarat') || normalized === 'gj') {
        const gj = activeRules.find((r) => r.stateCode === 'GJ' || r.stateName.toLowerCase().includes('gujarat'));
        if (gj) return gj;
    }

    // 3. Substring match against any configured state
    const subMatch = activeRules.find((r) => r.stateName.toLowerCase().includes(normalized));
    if (subMatch) return subMatch;

    return otherDefault;
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
