'use client';

import { useState } from 'react';
import {
    TruckIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    CameraIcon,
    PhoneIcon,
    ShieldCheckIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import {
    STATE_DELIVERY_RULES,
    resolveDeliveryRule,
    StateDeliveryRule,
} from '@/lib/delivery-config';

interface ProductDeliveryEstimatorProps {
    compact?: boolean;
    className?: string;
}

export default function ProductDeliveryEstimator({
    compact = false,
    className = '',
}: ProductDeliveryEstimatorProps) {
    const [selectedState, setSelectedState] = useState<string>('Andhra Pradesh');
    const [pincodeInput, setPincodeInput] = useState<string>('');
    const [activeRule, setActiveRule] = useState<StateDeliveryRule>(
        STATE_DELIVERY_RULES['andhra pradesh']
    );

    const handleSelectState = (stateName: string) => {
        setSelectedState(stateName);
        setPincodeInput('');
        setActiveRule(resolveDeliveryRule(stateName));
    };

    const handlePincodeChange = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 6);
        setPincodeInput(digits);
        if (digits.length >= 3) {
            const rule = resolveDeliveryRule(digits);
            setActiveRule(rule);
            setSelectedState(rule.stateName);
        }
    };

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
                    <span>Farm Delivery & Dispatch Timelines</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dispatched from Nellore, AP</span>
                </span>
            </div>

            {/* Quick State Selector Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {[
                    { name: 'Andhra Pradesh', label: 'Andhra Pradesh', free: true },
                    { name: 'Telangana', label: 'Telangana', free: false },
                    { name: 'Tamil Nadu', label: 'Tamil Nadu', free: false },
                    { name: 'West Bengal', label: 'West Bengal', free: false },
                ].map((st) => {
                    const isSelected = selectedState === st.name;
                    return (
                        <button
                            key={st.name}
                            type="button"
                            onClick={() => handleSelectState(st.name)}
                            className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                    ? 'bg-[#0B1A33] border-[#0B1A33] text-white shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            <span>{st.label}</span>
                            {st.free && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                                    isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                    FREE
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Pincode Search Bar */}
            <div className="flex items-center h-10 px-3 rounded-xl border border-slate-300 bg-slate-50/70 focus-within:border-indigo-600 focus-within:bg-white transition-colors">
                <MapPinIcon className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="Or enter 6-digit pond pincode (e.g. 524001)..."
                    className="w-full text-xs font-mono font-medium text-slate-900 outline-none bg-transparent placeholder:font-sans placeholder:text-slate-400"
                />
                {pincodeInput && (
                    <button
                        type="button"
                        onClick={() => handlePincodeChange('')}
                        className="text-xs text-slate-400 hover:text-slate-700 font-bold ml-1"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Active Policy Status Card */}
            <div
                className={`p-3.5 rounded-xl border ${activeRule.badgeColor.border} ${activeRule.badgeColor.bg} flex flex-col gap-2`}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span
                                className={`w-2 h-2 rounded-full ${activeRule.badgeColor.dot}`}
                            />
                            <span className="font-extrabold text-sm text-slate-900">
                                {activeRule.stateName}
                            </span>
                            <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    activeRule.isFreeDelivery
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-800'
                                }`}
                            >
                                {activeRule.isFreeDelivery ? 'Free Delivery' : 'Customer Arranged'}
                            </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900 mt-1">
                            Estimated Delivery: <strong className="text-emerald-700 font-poppins">{activeRule.timelineText}</strong>
                        </span>
                    </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {activeRule.isFreeDelivery ? (
                        <>
                            🚚 <strong className="text-emerald-800">100% Free Door/Pond Delivery</strong> in {activeRule.timelineText} provided directly by Karthik Traders across Andhra Pradesh.
                        </>
                    ) : (
                        <>
                            📦 Transport responsibility is by customer in {activeRule.timelineText}. Dispatched via regional logistics (To-Pay) or customer arranged vehicle.
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
                        After goods are loaded at our facility, you can view your <strong>Vehicle Number</strong>, <strong>Vehicle Type</strong>, <strong>Driver Phone</strong>, and a <strong>Photo of the loaded vehicle</strong> directly in your customer dashboard!
                    </p>
                </div>
            )}
        </div>
    );
}
