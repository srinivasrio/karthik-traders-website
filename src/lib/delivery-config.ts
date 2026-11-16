/**
 * State-wise Delivery Configuration for Karthik Traders
 * Defines delivery policies, charges, timelines, and vehicle presets.
 */

export interface StateDeliveryRule {
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
    badgeColor: {
        bg: string;
        border: string;
        text: string;
        dot: string;
    };
}

export const STATE_DELIVERY_RULES: Record<string, StateDeliveryRule> = {
    'andhra pradesh': {
        stateName: 'Andhra Pradesh',
        stateCode: 'AP',
        isFreeDelivery: true,
        responsibility: 'karthik_traders',
        estimatedDaysMin: 3,
        estimatedDaysMax: 7,
        timelineText: '3 to 7 Days',
        policyBadgeText: 'FREE Delivery',
        tagline: 'Free door & farm pond delivery in 3 to 7 days',
        description: 'Karthik Traders provides 100% Free Door/Pond Delivery across all aquaculture districts in Andhra Pradesh.',
        badgeColor: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            dot: 'bg-emerald-500',
        },
    },
    'telangana': {
        stateName: 'Telangana',
        stateCode: 'TS',
        isFreeDelivery: false,
        responsibility: 'customer',
        estimatedDaysMin: 3,
        estimatedDaysMax: 7,
        timelineText: '3 to 7 Days',
        policyBadgeText: 'Customer Responsibility (3-7 Days)',
        tagline: 'Delivery in 3 to 7 days (Customer arranged transport)',
        description: 'Transport is customer responsibility. Goods dispatched via regional transport (To-Pay) or customer arranged vehicle.',
        badgeColor: {
            bg: 'bg-sky-50',
            border: 'border-sky-200',
            text: 'text-sky-800',
            dot: 'bg-sky-500',
        },
    },
    'tamil nadu': {
        stateName: 'Tamil Nadu',
        stateCode: 'TN',
        isFreeDelivery: false,
        responsibility: 'customer',
        estimatedDaysMin: 3,
        estimatedDaysMax: 7,
        timelineText: '3 to 7 Days',
        policyBadgeText: 'Customer Responsibility (3-7 Days)',
        tagline: 'Delivery in 3 to 7 days (Customer arranged transport)',
        description: 'Transport is customer responsibility. Dispatched via interstate transport or customer arranged vehicle.',
        badgeColor: {
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            text: 'text-indigo-800',
            dot: 'bg-indigo-500',
        },
    },
    'west bengal': {
        stateName: 'West Bengal',
        stateCode: 'WB',
        isFreeDelivery: false,
        responsibility: 'customer',
        estimatedDaysMin: 10,
        estimatedDaysMax: 15,
        timelineText: '10 to 15 Days',
        policyBadgeText: 'Customer Responsibility (10-15 Days)',
        tagline: 'Delivery in 10 to 15 days (Customer arranged freight)',
        description: 'Long-distance freight is customer responsibility. Loaded onto interstate logistics carriers or customer vehicle.',
        badgeColor: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-800',
            dot: 'bg-purple-500',
        },
    },
};

export const DEFAULT_DELIVERY_RULE: StateDeliveryRule = {
    stateName: 'Other States',
    stateCode: 'OTHER',
    isFreeDelivery: false,
    responsibility: 'customer',
    estimatedDaysMin: 5,
    estimatedDaysMax: 10,
    timelineText: '5 to 10 Days',
    policyBadgeText: 'Customer Arranged Transport',
    tagline: 'Delivery in 5 to 10 days (Customer arranged transport)',
    description: 'Transport is customer responsibility. Dispatched from Nellore via regional or national freight transport.',
    badgeColor: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        dot: 'bg-slate-500',
    },
};

/**
 * Standard list of vehicle types used for delivering aerator equipment
 */
export const PRESET_VEHICLE_TYPES = [
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
];

/**
 * Normalizes state name string for matching
 */
export function normalizeStateName(input?: string): string {
    if (!input) return '';
    return input.trim().toLowerCase().replace(/[^a-z\s]/g, '').trim();
}

/**
 * Infers state from standard Indian 6-digit Pincode prefix
 */
export function getStateFromPincode(pincode?: string | number): string | null {
    if (!pincode) return null;
    const cleanPin = String(pincode).replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length < 2) return null;

    const prefix2 = parseInt(cleanPin.slice(0, 2), 10);
    const prefix3 = parseInt(cleanPin.slice(0, 3), 10);

    // Andhra Pradesh: 515-535
    if (prefix3 >= 515 && prefix3 <= 535) return 'Andhra Pradesh';

    // Telangana: 500-509
    if (prefix3 >= 500 && prefix3 <= 509) return 'Telangana';

    // Tamil Nadu: 600-643
    if (prefix3 >= 600 && prefix3 <= 643) return 'Tamil Nadu';

    // West Bengal: 700-743
    if (prefix3 >= 700 && prefix3 <= 743) return 'West Bengal';

    // Fallbacks based on 2-digit zones:
    if (prefix2 >= 51 && prefix2 <= 53) return 'Andhra Pradesh';
    if (prefix2 === 50) return 'Telangana';
    if (prefix2 >= 60 && prefix2 <= 64) return 'Tamil Nadu';
    if (prefix2 >= 70 && prefix2 <= 74) return 'West Bengal';

    return null;
}

/**
 * Resolves the State Delivery Rule by checking state name first, then pincode.
 */
export function resolveDeliveryRule(stateOrPincode?: string): StateDeliveryRule {
    if (!stateOrPincode) return STATE_DELIVERY_RULES['andhra pradesh']; // Default to primary home state

    const normalized = normalizeStateName(stateOrPincode);

    // Check direct match
    if (STATE_DELIVERY_RULES[normalized]) {
        return STATE_DELIVERY_RULES[normalized];
    }

    // Check partial name match
    if (normalized.includes('andhra') || normalized === 'ap') {
        return STATE_DELIVERY_RULES['andhra pradesh'];
    }
    if (normalized.includes('telangana') || normalized === 'ts' || normalized === 'tg') {
        return STATE_DELIVERY_RULES['telangana'];
    }
    if (normalized.includes('tamil') || normalized.includes('nadu') || normalized === 'tn') {
        return STATE_DELIVERY_RULES['tamil nadu'];
    }
    if (normalized.includes('bengal') || normalized.includes('kolkata') || normalized === 'wb') {
        return STATE_DELIVERY_RULES['west bengal'];
    }

    // Try pincode resolution
    const stateFromPin = getStateFromPincode(stateOrPincode);
    if (stateFromPin) {
        const normPinState = normalizeStateName(stateFromPin);
        if (STATE_DELIVERY_RULES[normPinState]) {
            return STATE_DELIVERY_RULES[normPinState];
        }
    }

    return DEFAULT_DELIVERY_RULE;
}
