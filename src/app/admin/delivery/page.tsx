'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    TruckIcon,
    MapPinIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    InformationCircleIcon,
    PhoneIcon,
    BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import {
    StateDeliveryRule,
    DeliveryGeneralSettings,
    DEFAULT_RULES,
    DEFAULT_GENERAL_SETTINGS,
    resolveDeliveryByPincode,
} from '@/lib/delivery-config';

export default function AdminDeliveryPage() {
    const { session } = useAuth();
    const [rules, setRules] = useState<StateDeliveryRule[]>(DEFAULT_RULES);
    const [general, setGeneral] = useState<DeliveryGeneralSettings>(DEFAULT_GENERAL_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Live Pincode Tester State
    const [testPincodeInput, setTestPincodeInput] = useState<string>('524001');

    // New Zone Modal State
    const [newZoneModalOpen, setNewZoneModalOpen] = useState(false);
    const [newZone, setNewZone] = useState({
        stateName: '',
        stateCode: '',
        isFreeDelivery: false,
        estimatedDaysMin: 3,
        estimatedDaysMax: 7,
        timelineText: '3 to 7 Days',
        policyBadgeText: 'Customer Responsibility (3-7 Days)',
        tagline: 'Delivery in 3 to 7 days (Customer arranged transport)',
        description: 'Transport is customer responsibility. Dispatched via regional logistics or customer arranged vehicle.',
        pincodePrefixes: '',
    });

    // New Vehicle Type Input
    const [newVehicleInput, setNewVehicleInput] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/delivery/settings');
            const data = await res.json();
            if (data.success) {
                if (data.rules && data.rules.length > 0) {
                    setRules(data.rules);
                }
                if (data.general) {
                    setGeneral(data.general);
                }
            }
        } catch (err: any) {
            console.error('Error fetching delivery settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/delivery/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules, general }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Delivery timelines & shipping fee policies saved successfully!' });
                if (data.rules && data.rules.length > 0) {
                    setRules(data.rules);
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (err: any) {
            console.error('Error saving delivery settings:', err);
            setMessage({ type: 'error', text: err.message || 'Error saving settings' });
        } finally {
            setSaving(false);
        }
    };

    const updateRuleField = (index: number, field: keyof StateDeliveryRule, value: any) => {
        setRules((prev) => {
            const updated = [...prev];
            const rule = { ...updated[index], [field]: value };

            // Automatic timeline text & responsibility syncing when fee/days change
            if (field === 'isFreeDelivery') {
                rule.responsibility = value ? 'karthik_traders' : 'customer';
                rule.policyBadgeText = value
                    ? 'FREE Delivery'
                    : `Customer Responsibility (${rule.timelineText})`;
                rule.tagline = value
                    ? `Free door & farm pond delivery in ${rule.timelineText}`
                    : `Delivery in ${rule.timelineText} (Customer arranged transport)`;
            } else if (field === 'estimatedDaysMin' || field === 'estimatedDaysMax') {
                const min = field === 'estimatedDaysMin' ? Number(value) : rule.estimatedDaysMin;
                const max = field === 'estimatedDaysMax' ? Number(value) : rule.estimatedDaysMax;
                rule.timelineText = `${min} to ${max} Days`;
                if (!rule.isFreeDelivery) {
                    rule.policyBadgeText = `Customer Responsibility (${rule.timelineText})`;
                }
            }

            updated[index] = rule;
            return updated;
        });
    };

    const handleAddZone = () => {
        if (!newZone.stateName.trim()) {
            alert('Please enter a State Name');
            return;
        }

        const id = newZone.stateName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const prefixes = newZone.pincodePrefixes
            .split(',')
            .map((s) => s.trim().replace(/\D/g, ''))
            .filter(Boolean);

        const newRule: StateDeliveryRule = {
            id,
            stateName: newZone.stateName.trim(),
            stateCode: (newZone.stateCode || newZone.stateName.slice(0, 2)).toUpperCase(),
            isFreeDelivery: newZone.isFreeDelivery,
            responsibility: newZone.isFreeDelivery ? 'karthik_traders' : 'customer',
            estimatedDaysMin: Number(newZone.estimatedDaysMin),
            estimatedDaysMax: Number(newZone.estimatedDaysMax),
            timelineText: newZone.timelineText || `${newZone.estimatedDaysMin} to ${newZone.estimatedDaysMax} Days`,
            policyBadgeText: newZone.isFreeDelivery ? 'FREE Delivery' : newZone.policyBadgeText,
            tagline: newZone.tagline,
            description: newZone.description,
            pincodePrefixes: prefixes,
            isActive: true,
            sortOrder: rules.length + 1,
            badgeColor: {
                bg: newZone.isFreeDelivery ? 'bg-emerald-50' : 'bg-slate-50',
                border: newZone.isFreeDelivery ? 'border-emerald-200' : 'border-slate-200',
                text: newZone.isFreeDelivery ? 'text-emerald-800' : 'text-slate-800',
                dot: newZone.isFreeDelivery ? 'bg-emerald-500' : 'bg-slate-500',
            },
        };

        setRules((prev) => [...prev, newRule]);
        setNewZoneModalOpen(false);
        setNewZone({
            stateName: '',
            stateCode: '',
            isFreeDelivery: false,
            estimatedDaysMin: 3,
            estimatedDaysMax: 7,
            timelineText: '3 to 7 Days',
            policyBadgeText: 'Customer Responsibility (3-7 Days)',
            tagline: 'Delivery in 3 to 7 days (Customer arranged transport)',
            description: 'Transport is customer responsibility. Dispatched via regional logistics or customer arranged vehicle.',
            pincodePrefixes: '',
        });
    };

    const handleDeleteZone = async (ruleId: string, index: number) => {
        const CORE_IDS = ['andhra_pradesh', 'telangana', 'tamil_nadu', 'west_bengal', 'other_states'];
        if (CORE_IDS.includes(ruleId)) {
            alert('Core state rules cannot be deleted. You can edit their timeline, fee policy, or toggle them.');
            return;
        }

        if (!confirm('Are you sure you want to delete this custom delivery zone?')) return;

        try {
            await fetch(`/api/admin/delivery/settings?id=${ruleId}`, { method: 'DELETE' });
            setRules((prev) => prev.filter((_, idx) => idx !== index));
        } catch (err: any) {
            console.error('Error deleting zone:', err);
        }
    };

    // Live Pincode test evaluation
    const liveTestResult = useMemo(() => {
        return resolveDeliveryByPincode(testPincodeInput, rules);
    }, [testPincodeInput, rules]);

    // Add Vehicle Preset
    const handleAddVehiclePreset = () => {
        if (!newVehicleInput.trim()) return;
        if (general.vehiclePresets.includes(newVehicleInput.trim())) return;
        setGeneral((prev) => ({
            ...prev,
            vehiclePresets: [...prev.vehiclePresets, newVehicleInput.trim()],
        }));
        setNewVehicleInput('');
    };

    const handleRemoveVehiclePreset = (vName: string) => {
        setGeneral((prev) => ({
            ...prev,
            vehiclePresets: prev.vehiclePresets.filter((v) => v !== vName),
        }));
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-bold text-slate-600">Loading delivery configuration...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Top Bar Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
                <div>
                    <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl shadow-2xs">
                            🚚
                        </span>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-poppins">
                                Delivery Timelines & Shipping Fee Manager
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage state delivery timelines, free delivery vs customer arranged transport, and automatic pincode resolution
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setNewZoneModalOpen(true)}
                        className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add New State / Zone</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="h-10 px-5 rounded-xl bg-[#0B7A4B] hover:bg-[#09633D] text-white text-xs font-extrabold inline-flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Notification message */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs ${
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                >
                    <span>{message.text}</span>
                    <button
                        type="button"
                        onClick={() => setMessage(null)}
                        className="text-xs underline hover:opacity-80 cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Interactive Live Pincode Simulator Card */}
            <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-sky-50/60 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-blue-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🔍</span>
                        <h2 className="text-sm font-extrabold text-blue-950 font-poppins">
                            Live Pincode Simulator (Test Customer Experience)
                        </h2>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Real-Time Evaluation
                    </span>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                    Type any Indian 6-digit Pincode to test how the website detects destination state, delivery timeline, and whether shipping fee is <strong>FREE</strong> or <strong>Customer Arranged</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                            Enter Test Pincode
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                maxLength={6}
                                value={testPincodeInput}
                                onChange={(e) => setTestPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="524001"
                                className="w-full h-11 px-3.5 rounded-xl border border-blue-300 bg-white font-mono text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                            />
                            <span className="absolute right-3 top-3 text-xs text-slate-400">
                                {testPincodeInput.length}/6
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
                            <span>Try:</span>
                            <button
                                type="button"
                                onClick={() => setTestPincodeInput('524001')}
                                className="underline text-blue-600 hover:text-blue-800"
                            >
                                524001 (AP)
                            </button>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() => setTestPincodeInput('500001')}
                                className="underline text-blue-600 hover:text-blue-800"
                            >
                                500001 (TS)
                            </button>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() => setTestPincodeInput('600001')}
                                className="underline text-blue-600 hover:text-blue-800"
                            >
                                600001 (TN)
                            </button>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() => setTestPincodeInput('700001')}
                                className="underline text-blue-600 hover:text-blue-800"
                            >
                                700001 (WB)
                            </button>
                        </div>
                    </div>

                    {/* Result Box */}
                    <div className="md:col-span-2 p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">
                                    Detected: {liveTestResult.stateName}
                                </span>
                                {liveTestResult.matchedPrefix && (
                                    <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                        Prefix &apos;{liveTestResult.matchedPrefix}&apos;
                                    </span>
                                )}
                            </div>

                            <span
                                className={`text-xs font-black px-3 py-1 rounded-full border ${
                                    liveTestResult.isFreeDelivery
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                        : 'bg-sky-100 border-sky-300 text-sky-800'
                                }`}
                            >
                                {liveTestResult.isFreeDelivery ? '🟢 FREE Delivery (₹0)' : '🔵 Customer Arranged (To-Pay)'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                    Transit Timeline
                                </span>
                                <span className="font-extrabold text-emerald-700 font-poppins">
                                    ⏱️ {liveTestResult.timelineText}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                    Responsibility
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {liveTestResult.responsibility === 'karthik_traders'
                                        ? 'Karthik Traders Pays & Arranges'
                                        : 'Customer Responsibility (To-Pay)'}
                                </span>
                            </div>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-relaxed">
                            {liveTestResult.description}
                        </div>
                    </div>
                </div>
            </div>

            {/* State Delivery Rules List */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 font-poppins">
                            State Delivery Rules & Timelines ({rules.length})
                        </h2>
                        <p className="text-xs text-slate-500">
                            Configure transit days and whether shipping fee is Free or Customer Arranged for each state
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    {rules.map((rule, index) => {
                        const isCore = ['andhra_pradesh', 'telangana', 'tamil_nadu', 'west_bengal', 'other_states'].includes(
                            rule.id
                        );

                        return (
                            <div
                                key={rule.id || index}
                                className={`rounded-2xl border-2 bg-white p-5 shadow-xs transition-shadow hover:shadow-md ${
                                    rule.isFreeDelivery ? 'border-emerald-300' : 'border-slate-300'
                                }`}
                            >
                                {/* Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                                                rule.isFreeDelivery
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {rule.stateCode}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 font-poppins">
                                                    {rule.stateName}
                                                </h3>
                                                {isCore && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        Core State
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-500 font-mono">
                                                ID: {rule.id}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Free vs Customer Arranged Switch */}
                                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-bold">
                                            <button
                                                type="button"
                                                onClick={() => updateRuleField(index, 'isFreeDelivery', true)}
                                                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                                    rule.isFreeDelivery
                                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                🟢 Free Delivery
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateRuleField(index, 'isFreeDelivery', false)}
                                                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                                    !rule.isFreeDelivery
                                                        ? 'bg-blue-700 text-white shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                🔵 Customer Arranged
                                            </button>
                                        </div>

                                        {!isCore && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteZone(rule.id, index)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Custom Zone"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    {/* Timeline Min Days */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Min Days
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={rule.estimatedDaysMin}
                                            onChange={(e) => updateRuleField(index, 'estimatedDaysMin', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Timeline Max Days */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Max Days
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={rule.estimatedDaysMax}
                                            onChange={(e) => updateRuleField(index, 'estimatedDaysMax', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Display Timeline Text */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Timeline Display Text
                                        </label>
                                        <input
                                            type="text"
                                            value={rule.timelineText}
                                            onChange={(e) => updateRuleField(index, 'timelineText', e.target.value)}
                                            placeholder="e.g. 3 to 7 Days"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Policy Badge Text */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Badge Text
                                        </label>
                                        <input
                                            type="text"
                                            value={rule.policyBadgeText}
                                            onChange={(e) => updateRuleField(index, 'policyBadgeText', e.target.value)}
                                            placeholder="e.g. FREE Delivery"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Pincode Prefixes (Comma-separated) */}
                                    <div className="lg:col-span-4">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Matching Pincode Prefixes (Comma-separated 2 or 3-digit prefixes)
                                        </label>
                                        <input
                                            type="text"
                                            value={Array.isArray(rule.pincodePrefixes) ? rule.pincodePrefixes.join(', ') : ''}
                                            onChange={(e) => {
                                                const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                                updateRuleField(index, 'pincodePrefixes', parts);
                                            }}
                                            placeholder="e.g. 51, 52, 53, 524"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            When customer enters a 6-digit pincode starting with any of these prefixes, this rule will be applied automatically.
                                        </p>
                                    </div>

                                    {/* Tagline & Description */}
                                    <div className="lg:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Customer Tagline
                                        </label>
                                        <input
                                            type="text"
                                            value={rule.tagline}
                                            onChange={(e) => updateRuleField(index, 'tagline', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Customer Notice / Description
                                        </label>
                                        <input
                                            type="text"
                                            value={rule.description}
                                            onChange={(e) => updateRuleField(index, 'description', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Warehouse Dispatch Location & Vehicle Presets Card */}
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                    <BuildingOffice2Icon className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-extrabold text-slate-900 font-poppins">
                        Warehouse Origin & Vehicle Presets
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs mb-6">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Warehouse City
                        </label>
                        <input
                            type="text"
                            value={general.warehouseCity}
                            onChange={(e) => setGeneral({ ...general, warehouseCity: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Warehouse State
                        </label>
                        <input
                            type="text"
                            value={general.warehouseState}
                            onChange={(e) => setGeneral({ ...general, warehouseState: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Warehouse Dispatch Phone
                        </label>
                        <input
                            type="text"
                            value={general.warehousePhone}
                            onChange={(e) => setGeneral({ ...general, warehousePhone: e.target.value })}
                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800"
                        />
                    </div>
                </div>

                {/* Vehicle Presets */}
                <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Preset Transport Vehicle Types (Shown in Dispatch Dropdown)
                    </label>

                    <div className="flex flex-wrap gap-2 mb-3">
                        {general.vehiclePresets.map((vp) => (
                            <span
                                key={vp}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                            >
                                <span>{vp}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveVehiclePreset(vp)}
                                    className="text-slate-400 hover:text-rose-600 font-bold text-sm cursor-pointer"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2 max-w-md">
                        <input
                            type="text"
                            placeholder="Add vehicle type (e.g. 20ft Container Lorry)"
                            value={newVehicleInput}
                            onChange={(e) => setNewVehicleInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVehiclePreset()}
                            className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs"
                        />
                        <button
                            type="button"
                            onClick={handleAddVehiclePreset}
                            className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="mt-8 flex justify-end">
                <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="h-11 px-8 rounded-xl bg-[#0B7A4B] hover:bg-[#09633D] text-white text-sm font-extrabold inline-flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            <span>Saving Changes...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Save All Delivery Rules</span>
                        </>
                    )}
                </button>
            </div>

            {/* Add Custom Zone Modal */}
            {newZoneModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
                    onClick={() => setNewZoneModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-black text-slate-900 font-poppins">
                            Add New State / Delivery Zone
                        </h3>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="col-span-2">
                                <label className="block font-bold text-slate-700 uppercase mb-1">State Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Karnataka"
                                    value={newZone.stateName}
                                    onChange={(e) => setNewZone({ ...newZone, stateName: e.target.value })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">State Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. KA"
                                    value={newZone.stateCode}
                                    onChange={(e) => setNewZone({ ...newZone, stateCode: e.target.value.toUpperCase() })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Shipping Fee Policy</label>
                                <select
                                    value={newZone.isFreeDelivery ? 'free' : 'customer'}
                                    onChange={(e) => setNewZone({ ...newZone, isFreeDelivery: e.target.value === 'free' })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                >
                                    <option value="customer">Customer Arranged (To-Pay)</option>
                                    <option value="free">FREE Delivery (Karthik Traders)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Min Days</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newZone.estimatedDaysMin}
                                    onChange={(e) => setNewZone({ ...newZone, estimatedDaysMin: Number(e.target.value) })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Max Days</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newZone.estimatedDaysMax}
                                    onChange={(e) => setNewZone({ ...newZone, estimatedDaysMax: Number(e.target.value) })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block font-bold text-slate-700 uppercase mb-1">
                                    Pincode Prefixes (Comma-separated)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 56, 57, 58, 59"
                                    value={newZone.pincodePrefixes}
                                    onChange={(e) => setNewZone({ ...newZone, pincodePrefixes: e.target.value })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setNewZoneModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddZone}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                            >
                                Add Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
