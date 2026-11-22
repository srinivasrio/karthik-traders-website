'use client';

import { useState, useEffect } from 'react';
import {
    TruckIcon,
    CameraIcon,
    MapPinIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import {
    DEFAULT_RULES,
    DEFAULT_GENERAL_SETTINGS,
    resolveDeliveryRule,
    evaluateOrderFreeDelivery,
    isDeliveryFeatureVisible,
    StateDeliveryRule,
    DeliveryGeneralSettings,
    INDIAN_STATES_LIST,
    isAeratorProduct,
    isItemEligibleForFreeDelivery,
} from '@/lib/delivery-config';

interface ProductDeliveryEstimatorProps {
    compact?: boolean;
    className?: string;
    product?: any;
}

export default function ProductDeliveryEstimator({
    compact = false,
    className = '',
    product,
}: ProductDeliveryEstimatorProps) {
    const [rules, setRules] = useState<StateDeliveryRule[]>(DEFAULT_RULES);
    const [general, setGeneral] = useState<DeliveryGeneralSettings>(DEFAULT_GENERAL_SETTINGS);
    const [selectedState, setSelectedState] = useState<string>('Andhra Pradesh');
    const [loaded, setLoaded] = useState(false);

    // Fetch dynamic rules configured by admin
    useEffect(() => {
        fetch('/api/delivery/config')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    if (data.rules && data.rules.length > 0) setRules(data.rules);
                    if (data.general) setGeneral(data.general);
                }
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    }, []);

    // Check visibility in production (Hidden on production for now, test on localhost)
    const isVisible = isDeliveryFeatureVisible(general);
    if (!isVisible) {
        return null;
    }

    // Evaluate delivery policy for this product and destination state
    const evalResult = evaluateOrderFreeDelivery(
        product ? [product] : [{ category: 'aerator-set' }],
        selectedState,
        rules,
        general
    );

    const activeRule = evalResult.deliveryRule;
    const isAerator = product ? isAeratorProduct(product) : true;
    const isApState = selectedState === 'Andhra Pradesh';
    const minMoq = general.minAeratorQtyForFreeDelivery ?? 10;

    const quickStates = ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'West Bengal'];

    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm font-poppins">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                        <TruckIcon className="w-4 h-4" />
                    </span>
                    <span>State Delivery & Shipping Policy</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dispatched from Nellore, AP</span>
                </span>
            </div>

            {/* Quick State Selector Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {quickStates.map((stName) => {
                    const isAp = stName === 'Andhra Pradesh';
                    const isFreeActive = (general.isFreeDeliveryEnabled ?? true) && isAp && isAerator;
                    const isSelected = selectedState === stName;
                    return (
                        <button
                            key={stName}
                            type="button"
                            onClick={() => setSelectedState(stName)}
                            className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${isSelected
                                ? 'bg-[#0B1A33] border-[#0B1A33] text-white shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <span>{stName}</span>
                            {isFreeActive && (
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                >
                                    FREE (10+)
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* State Dropdown Selector for All States */}
            <div className="flex items-center gap-2">
                <label htmlFor="state-select" className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    Select Your State:
                </label>
                <select
                    id="state-select"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-colors cursor-pointer"
                >
                    {INDIAN_STATES_LIST.map((st) => {
                        const stEval = evaluateOrderFreeDelivery(
                            product ? [product] : [{ category: 'aerator-set' }],
                            st,
                            rules,
                            general
                        );
                        return (
                            <option key={st} value={st}>
                                {st} ({stEval.isFreeDelivery ? 'FREE Delivery' : 'Customer Arranged'} · {stEval.deliveryRule.timelineText})
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Dynamic Shipping Fee & Timeline Status Card */}
            <div
                className={`p-3.5 rounded-xl border ${activeRule.badgeColor.border} ${activeRule.badgeColor.bg} flex flex-col gap-2.5 transition-all`}
            >
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-2.5 h-2.5 rounded-full ${activeRule.badgeColor.dot} animate-pulse`} />
                            <span className="font-extrabold text-sm text-slate-900">
                                {activeRule.stateName}
                            </span>
                        </div>

                        {/* Shipping Fee Indicator */}
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-600 font-semibold">Shipping Fee:</span>
                            {isApState && isAerator && (general.isFreeDeliveryEnabled ?? true) ? (
                                <>
                                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-emerald-600 text-white">
                                        🟢 FREE Delivery on {minMoq}+ Aerators (₹0)
                                    </span>
                                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                        Min {minMoq} Sets for Free Delivery
                                    </span>
                                </>
                            ) : (
                                <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                                    🔵 Customer Arranged (To-Pay)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Timeline Pill */}
                    <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                            Estimated Timeline
                        </span>
                        <span className="text-sm font-black text-emerald-800 font-poppins block mt-0.5">
                            ⏱️ {activeRule.timelineText}
                        </span>
                    </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1 border-t border-slate-200/50">
                    {isApState && isAerator && (general.isFreeDeliveryEnabled ?? true) ? (
                        <>
                            🚚 <strong className="text-emerald-800">100% Free Door/Pond Delivery</strong> in <strong>{activeRule.timelineText}</strong> provided directly by Karthik Traders across {activeRule.stateName} for orders of <strong>{minMoq} or more Aerator Sets</strong>! (Smaller orders under {minMoq} aerators are dispatched via regional transport To-Pay).
                        </>
                    ) : (
                        <>
                            📦 Delivery in <strong>{activeRule.timelineText}</strong>. Transport is customer responsibility (dispatched via regional/interstate carrier To-Pay or customer arranged vehicle).
                            {product && !isAerator && isApState && (
                                <span className="block mt-1 text-[11px] text-slate-600 font-semibold">
                                    ℹ️ Free delivery is exclusive to orders of {minMoq}+ Aerator Sets in Andhra Pradesh. Spares are dispatched via customer arranged transport (To-Pay).
                                </span>
                            )}
                            {!(general.isFreeDeliveryEnabled ?? true) && (
                                <span className="block mt-1 text-[11px] text-slate-600 font-semibold">
                                    ℹ️ Free delivery option is currently disabled by store administration.
                                </span>
                            )}
                        </>
                    )}
                </p>
            </div>

            {/* Vehicle Loading Transparency Notice */}
            {!compact && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-col gap-1.5">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <CameraIcon className="w-4 h-4 text-indigo-600" />
                        <span>Live Vehicle Load Transparency</span>
                    </span>
                    <p className="leading-relaxed">
                        After goods are loaded onto the vehicle at our Nellore facility, your <strong>Vehicle Number</strong>, <strong>Driver Phone</strong>, and <strong>Photo of the loaded vehicle</strong> appear automatically in your customer dashboard!
                    </p>
                </div>
            )}
        </div>
    );
}
