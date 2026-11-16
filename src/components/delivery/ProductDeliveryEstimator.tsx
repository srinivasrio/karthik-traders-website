'use client';

import { useState, useEffect } from 'react';
import {
    TruckIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    CameraIcon,
    MapPinIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import {
    DEFAULT_RULES,
    resolveDeliveryRule,
    resolveDeliveryByPincode,
    StateDeliveryRule,
    PincodeDeliveryLookupResult,
} from '@/lib/delivery-config';

interface ProductDeliveryEstimatorProps {
    compact?: boolean;
    className?: string;
}

export default function ProductDeliveryEstimator({
    compact = false,
    className = '',
}: ProductDeliveryEstimatorProps) {
    const [rules, setRules] = useState<StateDeliveryRule[]>(DEFAULT_RULES);
    const [selectedState, setSelectedState] = useState<string>('Andhra Pradesh');
    const [pincodeInput, setPincodeInput] = useState<string>('');
    const [pincodeResult, setPincodeResult] = useState<PincodeDeliveryLookupResult | null>(null);

    // Fetch dynamic rules configured by admin
    useEffect(() => {
        fetch('/api/delivery/config')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.rules && data.rules.length > 0) {
                    setRules(data.rules);
                }
            })
            .catch(() => {});
    }, []);

    const activeRule = resolveDeliveryRule(pincodeResult ? pincodeResult.cleanPincode : selectedState, rules);

    const handleSelectState = (stateName: string) => {
        setSelectedState(stateName);
        setPincodeInput('');
        setPincodeResult(null);
    };

    const handlePincodeChange = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 6);
        setPincodeInput(digits);

        if (digits.length >= 2) {
            const res = resolveDeliveryByPincode(digits, rules);
            setPincodeResult(res);
            setSelectedState(res.stateName);
        } else {
            setPincodeResult(null);
        }
    };

    const quickStates = rules
        .filter((r) => r.isActive && r.id !== 'other_states')
        .slice(0, 4);

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
                    <span>Farm Delivery & Shipping Fee Estimator</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dispatched from Nellore, AP</span>
                </span>
            </div>

            {/* Quick State Selector Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {quickStates.map((st) => {
                    const isSelected = selectedState === st.stateName;
                    return (
                        <button
                            key={st.id}
                            type="button"
                            onClick={() => handleSelectState(st.stateName)}
                            className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                    ? 'bg-[#0B1A33] border-[#0B1A33] text-white shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <span>{st.stateName}</span>
                            {st.isFreeDelivery && (
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                                        isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                >
                                    FREE
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Pincode Search Bar with dynamic detection */}
            <div className="flex items-center h-10 px-3 rounded-xl border border-slate-300 bg-slate-50/70 focus-within:border-blue-600 focus-within:bg-white transition-colors">
                <MapPinIcon className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="Enter 6-digit Pincode to check shipping fee & timeline (e.g. 524001)..."
                    className="w-full text-xs font-mono font-medium text-slate-900 outline-none bg-transparent placeholder:font-sans placeholder:text-slate-400"
                />
                {pincodeInput && (
                    <button
                        type="button"
                        onClick={() => handlePincodeChange('')}
                        className="text-xs text-slate-400 hover:text-slate-700 font-bold ml-1 cursor-pointer"
                    >
                        ✕
                    </button>
                )}
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
                                {pincodeResult ? `Pincode ${pincodeResult.cleanPincode} · ${activeRule.stateName}` : activeRule.stateName}
                            </span>
                        </div>

                        {/* Shipping Fee Indicator */}
                        <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-xs text-slate-600 font-semibold">Shipping Fee:</span>
                            <span
                                className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                                    activeRule.isFreeDelivery
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}
                            >
                                {activeRule.isFreeDelivery ? '🟢 FREE Delivery (₹0)' : '🔵 Customer Arranged (To-Pay)'}
                            </span>
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
                    {activeRule.isFreeDelivery ? (
                        <>
                            🚚 <strong className="text-emerald-800">100% Free Door/Pond Delivery</strong> in <strong>{activeRule.timelineText}</strong> provided directly by Karthik Traders across {activeRule.stateName}.
                        </>
                    ) : (
                        <>
                            📦 Delivery in <strong>{activeRule.timelineText}</strong>. Transport is customer responsibility (dispatched via regional/interstate carrier To-Pay or customer arranged vehicle).
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
