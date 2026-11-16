'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    TruckIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    BuildingOffice2Icon,
    ShieldCheckIcon,
    SparklesIcon,
    EyeSlashIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import {
    StateDeliveryRule,
    DeliveryGeneralSettings,
    DEFAULT_RULES,
    DEFAULT_GENERAL_SETTINGS,
    INDIAN_STATES_LIST,
    resolveDeliveryRule,
    evaluateOrderFreeDelivery,
    isItemEligibleForFreeDelivery,
} from '@/lib/delivery-config';
import { aeratorSets } from '@/data/products';

export default function AdminDeliveryPage() {
    const { session } = useAuth();
    const [rules, setRules] = useState<StateDeliveryRule[]>(DEFAULT_RULES);
    const [general, setGeneral] = useState<DeliveryGeneralSettings>(DEFAULT_GENERAL_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Live State & Product Simulator State
    const [testStateInput, setTestStateInput] = useState<string>('Andhra Pradesh');
    const [testProductType, setTestProductType] = useState<'aerator' | 'spares' | 'mixed'>('aerator');

    // New State Modal State
    const [newZoneModalOpen, setNewZoneModalOpen] = useState(false);
    const [newZone, setNewZone] = useState({
        stateName: 'Karnataka',
        stateCode: 'KA',
        isFreeDelivery: false,
        estimatedDaysMin: 3,
        estimatedDaysMax: 7,
        timelineText: '3 to 7 Days',
        policyBadgeText: 'Customer Responsibility (3-7 Days)',
        tagline: 'Delivery in 3 to 7 days (Customer arranged transport)',
        description: 'Transport is customer responsibility. Dispatched from Nellore via regional carrier (To-Pay) or customer arranged vehicle.',
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
                setMessage({ type: 'success', text: 'Delivery policies, aerator eligibility & settings saved successfully!' });
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

            if (field === 'isFreeDelivery') {
                rule.responsibility = value ? 'karthik_traders' : 'customer';
                rule.policyBadgeText = value
                    ? 'FREE Delivery'
                    : `Customer Responsibility (${rule.timelineText})`;
                rule.tagline = value
                    ? `Free door & farm pond delivery in ${rule.timelineText}`
                    : `Delivery in ${rule.timelineText} (Customer arranged transport)`;
            }

            if (field === 'estimatedDaysMin' || field === 'estimatedDaysMax') {
                const min = field === 'estimatedDaysMin' ? Number(value) : rule.estimatedDaysMin;
                const max = field === 'estimatedDaysMax' ? Number(value) : rule.estimatedDaysMax;
                rule.timelineText = `${min} to ${max} Days`;
                if (!rule.isFreeDelivery) {
                    rule.policyBadgeText = `Customer Responsibility (${rule.timelineText})`;
                    rule.tagline = `Delivery in ${rule.timelineText} (Customer arranged transport)`;
                }
            }

            updated[index] = rule;
            return updated;
        });
    };

    const handleAddZone = () => {
        if (!newZone.stateName.trim()) {
            alert('Please select or enter a State Name');
            return;
        }

        const id = newZone.stateName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        const newRule: StateDeliveryRule = {
            id,
            stateName: newZone.stateName,
            stateCode: newZone.stateCode || newZone.stateName.slice(0, 2).toUpperCase(),
            isFreeDelivery: newZone.isFreeDelivery,
            responsibility: newZone.isFreeDelivery ? 'karthik_traders' : 'customer',
            estimatedDaysMin: Number(newZone.estimatedDaysMin),
            estimatedDaysMax: Number(newZone.estimatedDaysMax),
            timelineText: newZone.timelineText,
            policyBadgeText: newZone.isFreeDelivery ? 'FREE Delivery' : newZone.policyBadgeText,
            tagline: newZone.tagline,
            description: newZone.description,
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
    };

    const handleDeleteZone = (id: string) => {
        if (confirm('Are you sure you want to remove this State Rule?')) {
            setRules((prev) => prev.filter((r) => r.id !== id));
        }
    };

    // Aerator Set Selection Handlers
    const isAeratorSelected = (slug: string) => {
        if (!general.eligibleAeratorSlugs || general.eligibleAeratorSlugs.length === 0) {
            return true; // Default: all aerator sets are eligible
        }
        return general.eligibleAeratorSlugs.includes(slug);
    };

    const handleToggleAerator = (slug: string) => {
        const allSlugs = aeratorSets.map((p) => p.slug);
        const currentList =
            general.eligibleAeratorSlugs && general.eligibleAeratorSlugs.length > 0
                ? [...general.eligibleAeratorSlugs]
                : allSlugs;

        const nextList = currentList.includes(slug)
            ? currentList.filter((s) => s !== slug)
            : [...currentList, slug];

        setGeneral((prev) => ({
            ...prev,
            eligibleAeratorSlugs: nextList,
        }));
    };

    const handleSelectAllAerators = () => {
        setGeneral((prev) => ({
            ...prev,
            eligibleAeratorSlugs: aeratorSets.map((p) => p.slug),
        }));
    };

    const handleDeselectAllAerators = () => {
        setGeneral((prev) => ({
            ...prev,
            eligibleAeratorSlugs: ['none_selected'],
        }));
    };

    // Simulator evaluation
    const liveTestResult = useMemo(() => {
        const mockItems =
            testProductType === 'aerator'
                ? [{ category: 'aerator-set', slug: 'seaboss-2hp-4-paddle-pr14b', name: 'Sea Boss 2HP 4-Paddle' }]
                : testProductType === 'spares'
                ? [
                      { category: 'fan', slug: '4-paddle-fan', name: '4-Paddle Fan' },
                      { category: 'float', slug: 'virgin-hdpe-float', name: 'Virgin HDPE Float' },
                  ]
                : [
                      { category: 'aerator-set', slug: 'seaboss-2hp-4-paddle-pr14b', name: 'Sea Boss 2HP 4-Paddle' },
                      { category: 'fan', slug: '4-paddle-fan', name: '4-Paddle Fan' },
                  ];

        return evaluateOrderFreeDelivery(mockItems, testStateInput, rules, general);
    }, [testStateInput, testProductType, rules, general]);

    // Vehicle Presets handlers
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
                                State Delivery Timelines & Shipping Fee Manager
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Delivery fees and transit timelines are calculated strictly based on customer&apos;s state
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
                        <span>Add State</span>
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

            {/* Production Staging Banner (Requirement 3: Test on localhost, hide on production for now) */}
            <div
                className={`mb-8 rounded-2xl border-2 p-5 transition-all shadow-xs ${
                    general.enabledInProduction
                        ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/60'
                        : 'border-amber-300 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/70'
                }`}
            >
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                                general.enabledInProduction
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                            {general.enabledInProduction ? (
                                <EyeIcon className="w-5 h-5" />
                            ) : (
                                <EyeSlashIcon className="w-5 h-5" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-extrabold text-slate-900 font-poppins">
                                    Website Staging & Production Visibility
                                </h2>
                                <span
                                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                        general.enabledInProduction
                                            ? 'bg-emerald-600 text-white border-emerald-700'
                                            : 'bg-amber-600 text-white border-amber-700'
                                    }`}
                                >
                                    {general.enabledInProduction
                                        ? '🌐 Live on Production'
                                        : '🔒 Hidden on Production (Staging Mode)'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                {general.enabledInProduction ? (
                                    <>
                                        Delivery timeline and state shipping options are <strong>LIVE</strong> for
                                        all customers visiting karthiktraders.in.
                                    </>
                                ) : (
                                    <>
                                        Delivery feature is <strong>HIDDEN</strong> from live customers on the production website.
                                        You can test and verify all delivery options on <strong>http://localhost:3000</strong>.
                                        When you are ready to make it live for customers, toggle the switch below and save.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white px-4 py-2 rounded-xl border border-slate-300 shadow-2xs">
                            <input
                                type="checkbox"
                                checked={Boolean(general.enabledInProduction)}
                                onChange={(e) =>
                                    setGeneral({
                                        ...general,
                                        enabledInProduction: e.target.checked,
                                    })
                                }
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800">
                                {general.enabledInProduction
                                    ? 'Enabled on Production'
                                    : 'Enable on Production'}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Aerator Set Free Delivery Manager (Requirement 1 & 2: Free Delivery is for Aerator Sets Only) */}
            <div className="mb-8 rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-slate-900 font-poppins">
                                    Aerator Sets Free Delivery Eligibility
                                </h2>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                    Free Delivery Rule
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Configure whether Free Delivery is exclusive to Aerator Sets and select eligible models
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle Free Delivery for Aerators Only */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none bg-indigo-50/70 border border-indigo-200 px-3.5 py-1.5 rounded-xl">
                            <input
                                type="checkbox"
                                checked={general.freeDeliveryForAeratorsOnly ?? true}
                                onChange={(e) =>
                                    setGeneral({
                                        ...general,
                                        freeDeliveryForAeratorsOnly: e.target.checked,
                                    })
                                }
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs font-extrabold text-indigo-950">
                                Free Delivery for Aerator Sets Only
                            </span>
                        </label>

                        {/* Quick Select All / Deselect All */}
                        <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold">
                            <button
                                type="button"
                                onClick={handleSelectAllAerators}
                                className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={handleDeselectAllAerators}
                                className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                Deselect All
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    💡 <strong>Aquaculture Policy:</strong> In Andhra Pradesh, Karthik Traders covers 100% door & farm pond
                    transport fees for full <strong>Aerator Sets</strong>. Individual spare parts (fans, floats, rods, motors, gearboxes)
                    are dispatched via customer-arranged transport (To-Pay) unless ordered together with an Aerator Set.
                </div>

                {/* Aerator Models Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aeratorSets.map((product) => {
                        const isSelected = isAeratorSelected(product.slug);
                        const isSeaboss = product.brand === 'seaboss';

                        return (
                            <div
                                key={product.slug}
                                onClick={() => handleToggleAerator(product.slug)}
                                className={`rounded-xl border-2 p-3.5 flex items-start gap-3 transition-all cursor-pointer select-none ${
                                    isSelected
                                        ? 'border-indigo-500 bg-indigo-50/40 shadow-2xs'
                                        : 'border-slate-200 bg-slate-50/40 hover:border-slate-300 opacity-60'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by parent div click
                                    className="w-4 h-4 mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span
                                            className={`text-[10px] font-black uppercase px-2 py-0.2 rounded ${
                                                isSeaboss
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-emerald-600 text-white'
                                            }`}
                                        >
                                            {isSeaboss ? 'SEA BOSS' : 'AQUA LION'}
                                        </span>
                                        <span className="text-xs font-extrabold text-slate-900 truncate">
                                            {product.model}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate">{product.name}</p>
                                    <div className="mt-1 flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-slate-700">
                                            ₹{product.salePrice?.toLocaleString('en-IN')}
                                        </span>
                                        <span
                                            className={`text-[10px] font-bold ${
                                                isSelected ? 'text-indigo-700' : 'text-slate-400'
                                            }`}
                                        >
                                            {isSelected ? '✓ Free Delivery Eligible' : 'Excluded'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Interactive Live State & Product Simulator Card */}
            <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-sky-50/60 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-blue-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <h2 className="text-sm font-extrabold text-blue-950 font-poppins">
                            Live State & Cart Delivery Preview (Simulator)
                        </h2>
                    </div>
                    <span className="text-[11px] font-bold text-blue-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                        Real-Time Simulator
                    </span>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                    Test how shipping fee and transit days appear for different combinations of <strong>Destination State</strong> and <strong>Cart Products</strong> (Aerator Sets vs Spares).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                                Choose Destination State
                            </label>
                            <select
                                value={testStateInput}
                                onChange={(e) => setTestStateInput(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-blue-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                            >
                                {rules.map((r) => (
                                    <option key={r.id} value={r.stateName}>
                                        {r.stateName}
                                    </option>
                                ))}
                            </select>

                            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-bold">
                                <span className="text-slate-500">Quick:</span>
                                {['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'West Bengal'].map((sName) => (
                                    <button
                                        key={sName}
                                        type="button"
                                        onClick={() => setTestStateInput(sName)}
                                        className="px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 cursor-pointer"
                                    >
                                        {sName.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                                Choose Customer Cart Items
                            </label>
                            <div className="flex flex-col gap-1.5 text-xs font-semibold">
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="testItemType"
                                        value="aerator"
                                        checked={testProductType === 'aerator'}
                                        onChange={() => setTestProductType('aerator')}
                                        className="text-blue-600"
                                    />
                                    <span>Aerator Set Only</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="testItemType"
                                        value="spares"
                                        checked={testProductType === 'spares'}
                                        onChange={() => setTestProductType('spares')}
                                        className="text-blue-600"
                                    />
                                    <span>Spare Parts Only (No Aerator)</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="testItemType"
                                        value="mixed"
                                        checked={testProductType === 'mixed'}
                                        onChange={() => setTestProductType('mixed')}
                                        className="text-blue-600"
                                    />
                                    <span>Combined: Aerator + Spares</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Result Box */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-white border border-blue-200 shadow-2xs flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                                {testStateInput} · {testProductType === 'aerator' ? 'Aerator Set' : testProductType === 'spares' ? 'Spares Only' : 'Aerator + Spares'}
                            </span>

                            <span
                                className={`text-xs font-black px-3 py-1 rounded-full border ${
                                    liveTestResult.isFreeDelivery
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                        : 'bg-amber-100 border-amber-300 text-amber-800'
                                }`}
                            >
                                {liveTestResult.isFreeDelivery
                                    ? '🟢 FREE Delivery (₹0)'
                                    : '🔵 Customer Arranged (To-Pay)'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                    Transit Timeline
                                </span>
                                <span className="font-extrabold text-emerald-700 font-poppins">
                                    ⏱️ {liveTestResult.deliveryRule.timelineText}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                    Delivery Responsibility
                                </span>
                                <span className="font-semibold text-slate-800">
                                    {liveTestResult.isFreeDelivery
                                        ? 'Karthik Traders Pays (Free Door/Pond Delivery)'
                                        : 'Customer Arranged Transport (To-Pay)'}
                                </span>
                            </div>
                        </div>

                        <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                            <strong>Policy Result:</strong> {liveTestResult.reason}
                        </div>
                    </div>
                </div>
            </div>

            {/* State Delivery Rules List */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 font-poppins">
                            Configured State Delivery Rules ({rules.length})
                        </h2>
                        <p className="text-xs text-slate-500">
                            Configure transit timeline and fee policy for each destination state
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
                                                        ? 'bg-slate-800 text-white shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                🔵 Customer Arranged
                                            </button>
                                        </div>

                                        {/* Status Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => updateRuleField(index, 'isActive', !rule.isActive)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                                                rule.isActive
                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                    : 'bg-slate-100 text-slate-500 border-slate-300'
                                            }`}
                                        >
                                            {rule.isActive ? 'Active' : 'Disabled'}
                                        </button>

                                        {!isCore && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteZone(rule.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Delete State Rule"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Rule Edit Fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Min Days
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={rule.estimatedDaysMin}
                                            onChange={(e) =>
                                                updateRuleField(index, 'estimatedDaysMin', Number(e.target.value))
                                            }
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Max Days
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={rule.estimatedDaysMax}
                                            onChange={(e) =>
                                                updateRuleField(index, 'estimatedDaysMax', Number(e.target.value))
                                            }
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Timeline Display Text
                                        </label>
                                        <input
                                            type="text"
                                            value={rule.timelineText}
                                            onChange={(e) => updateRuleField(index, 'timelineText', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Policy Badge Text
                                        </label>
                                        <input
                                            type="text"
                                            value={rule.policyBadgeText}
                                            onChange={(e) => updateRuleField(index, 'policyBadgeText', e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="lg:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            Tagline (Header / Card subtitle)
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
                                            Customer Description Note
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

            {/* Add Custom State Modal */}
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
                            Add State Delivery Rule
                        </h3>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="col-span-2">
                                <label className="block font-bold text-slate-700 uppercase mb-1">Select State *</label>
                                <select
                                    value={newZone.stateName}
                                    onChange={(e) => {
                                        const s = e.target.value;
                                        setNewZone({
                                            ...newZone,
                                            stateName: s,
                                            stateCode: s.slice(0, 2).toUpperCase(),
                                        });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                >
                                    {INDIAN_STATES_LIST.map((st) => (
                                        <option key={st} value={st}>
                                            {st}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Min Transit Days</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newZone.estimatedDaysMin}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setNewZone({
                                            ...newZone,
                                            estimatedDaysMin: val,
                                            timelineText: `${val} to ${newZone.estimatedDaysMax} Days`,
                                        });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Max Transit Days</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newZone.estimatedDaysMax}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setNewZone({
                                            ...newZone,
                                            estimatedDaysMax: val,
                                            timelineText: `${newZone.estimatedDaysMin} to ${val} Days`,
                                        });
                                    }}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block font-bold text-slate-700 uppercase mb-1">Timeline Text</label>
                                <input
                                    type="text"
                                    value={newZone.timelineText}
                                    onChange={(e) => setNewZone({ ...newZone, timelineText: e.target.value })}
                                    className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setNewZoneModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleAddZone}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                            >
                                Add Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
