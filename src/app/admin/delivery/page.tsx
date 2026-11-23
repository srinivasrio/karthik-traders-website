'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { auth as firebaseAuth } from '@/lib/firebase';
import {
    TruckIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    BuildingOffice2Icon,
    ShieldCheckIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
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
import {
    aeratorSets,
    motors,
    allGearboxes,
    allSpares,
    longArmProducts,
    Product,
} from '@/data/products';

export type ProductCategoryGroup = 'aerators' | 'motors' | 'gearboxes' | 'spares' | 'long-arm';

export interface CatalogProductItem {
    product: Product;
    categoryGroup: ProductCategoryGroup;
    groupLabel: string;
    badgeBg: string;
    badgeText: string;
}

const CATALOG_ITEMS: CatalogProductItem[] = [
    ...aeratorSets.map((p) => ({
        product: p,
        categoryGroup: 'aerators' as const,
        groupLabel: 'Aerator Set',
        badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        badgeText: 'AERATOR',
    })),
    ...motors.map((p) => ({
        product: p,
        categoryGroup: 'motors' as const,
        groupLabel: 'Motor',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        badgeText: 'MOTOR',
    })),
    ...allGearboxes.map((p) => ({
        product: p,
        categoryGroup: 'gearboxes' as const,
        groupLabel: 'Gearbox',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        badgeText: 'GEARBOX',
    })),
    ...allSpares.map((p) => ({
        product: p,
        categoryGroup: 'spares' as const,
        groupLabel: 'Spare Part',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        badgeText: 'SPARE',
    })),
    ...longArmProducts.map((p) => ({
        product: p,
        categoryGroup: 'long-arm' as const,
        groupLabel: 'Long Arm Aerator',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
        badgeText: 'LONG ARM',
    })),
];

function parseProductImage(imagesVal: any): string | null {
    if (!imagesVal) return null;
    if (Array.isArray(imagesVal) && imagesVal.length > 0) return String(imagesVal[0]);
    if (typeof imagesVal === 'string') {
        const trimmed = imagesVal.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]);
            } catch (e) {}
        }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const inner = trimmed.slice(1, -1).split(',')[0]?.replace(/^"|"$/g, '').trim();
            if (inner) return inner;
        }
        return trimmed;
    }
    return null;
}

type CategoryTab = 'all' | 'aerators' | 'motors' | 'gearboxes' | 'spares' | 'long-arm';

export default function AdminDeliveryPage() {
    const { session } = useAuth();
    const [rules, setRules] = useState<StateDeliveryRule[]>(DEFAULT_RULES);
    const [general, setGeneral] = useState<DeliveryGeneralSettings>(DEFAULT_GENERAL_SETTINGS);
    const [catalogItems, setCatalogItems] = useState<CatalogProductItem[]>(CATALOG_ITEMS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Live State & Product Simulator State
    const [testStateInput, setTestStateInput] = useState<string>('Andhra Pradesh');
    const [testProductType, setTestProductType] = useState<
        'aerator' | 'motor' | 'gearbox' | 'spares' | 'long-arm' | 'mixed'
    >('aerator');
    const [testAeratorQty, setTestAeratorQty] = useState<number>(10);

    // Free Delivery Category Tabs & Search Filter
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<CategoryTab>('all');
    const [productSearchQuery, setProductSearchQuery] = useState<string>('');

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

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        let token = session?.access_token;
        if (!token) {
            try {
                const { data } = await supabase.auth.getSession();
                token = data?.session?.access_token;
            } catch (e) {
                // Ignore
            }
        }
        if (!token) {
            try {
                const fbUser = firebaseAuth.currentUser;
                if (fbUser) {
                    token = await fbUser.getIdToken();
                }
            } catch (e) {
                // Ignore
            }
        }
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    useEffect(() => {
        fetchSettings();
    }, [session?.access_token]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/admin/delivery/settings', {
                headers,
            });
            const data = await res.json();
            if (data.success) {
                if (data.rules && data.rules.length > 0) {
                    setRules(data.rules);
                }
                if (data.general) {
                    setGeneral(data.general);
                }
            } else if (data.error) {
                console.error('Error fetching delivery settings:', data.error);
            }

            // Fetch live products directly from database so names and prices are ALWAYS up-to-date
            try {
                const { data: dbProducts } = await supabase
                    .from('products')
                    .select('*')
                    .order('name');

                if (dbProducts && dbProducts.length > 0) {
                    const liveItems: CatalogProductItem[] = dbProducts.map((dbProduct: any) => {
                        const cat = (dbProduct.category || '').toLowerCase();
                        let categoryGroup: ProductCategoryGroup = 'spares';
                        let groupLabel = 'Spare Part';
                        let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        let badgeText = 'SPARE';

                        if (cat === 'aerators' || cat === 'aerator-set') {
                            categoryGroup = 'aerators';
                            groupLabel = 'Aerator Set';
                            badgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                            badgeText = 'AERATOR';
                        } else if (cat === 'motors' || cat === 'motor') {
                            categoryGroup = 'motors';
                            groupLabel = 'Motor';
                            badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
                            badgeText = 'MOTOR';
                        } else if (cat === 'gearboxes' || cat === 'gearbox' || cat === 'worm-gearbox' || cat === 'bevel-gearbox') {
                            categoryGroup = 'gearboxes';
                            groupLabel = 'Gearbox';
                            badgeBg = 'bg-purple-100 text-purple-800 border-purple-200';
                            badgeText = 'GEARBOX';
                        } else if (cat === 'long-arm' || cat === 'long-arm-gearbox' || cat === 'long-arm-spare') {
                            categoryGroup = 'long-arm';
                            groupLabel = 'Long Arm Aerator';
                            badgeBg = 'bg-sky-100 text-sky-800 border-sky-200';
                            badgeText = 'LONG ARM';
                        }

                        const specs = dbProduct.specifications || {};
                        const model = specs.model || specs['Model number'] || specs.Model || dbProduct.model;
                        const brand = dbProduct.brand || specs.brand || specs.Brand || 'seaboss';
                        const firstImg = parseProductImage(dbProduct.images);

                        return {
                            product: {
                                id: dbProduct.id,
                                slug: dbProduct.slug,
                                name: dbProduct.name,
                                model: model,
                                brand: brand,
                                category: dbProduct.category,
                                mrp: Number(dbProduct.mrp || dbProduct.price),
                                salePrice: Number(dbProduct.price),
                                features: Array.isArray(specs.features) ? specs.features : [],
                                specifications: specs,
                                inStock: dbProduct.stock > 0,
                                images: firstImg ? [firstImg] : [],
                                isActive: dbProduct.is_active !== false,
                            },
                            categoryGroup,
                            groupLabel,
                            badgeBg,
                            badgeText,
                        };
                    });

                    setCatalogItems(liveItems);
                }
            } catch (dbErr) {
                console.warn('Could not fetch live products for delivery catalog, using fallback:', dbErr);
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
            const headers = await getAuthHeaders();
            const res = await fetch('/api/admin/delivery/settings', {
                method: 'POST',
                headers,
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

    // Free Delivery Multi-Category Product Selection Handlers
    const currentEligibleSlugs = useMemo(() => {
        const chosen = general.eligibleProductSlugs || general.eligibleAeratorSlugs;
        if (!chosen || chosen.length === 0) {
            // Default: aerator sets are eligible
            return catalogItems
                .filter((item) => item.categoryGroup === 'aerators')
                .map((item) => item.product.slug);
        }
        if (chosen.includes('none_selected') && chosen.length === 1) {
            return [];
        }
        return chosen;
    }, [general.eligibleProductSlugs, general.eligibleAeratorSlugs, catalogItems]);

    const isProductSelected = (slug: string) => {
        return currentEligibleSlugs.includes(slug);
    };

    const setEligibleSlugs = (slugs: string[]) => {
        const finalSlugs = slugs.length === 0 ? ['none_selected'] : slugs;
        const aeratorSlugs = catalogItems
            .filter((item) => item.categoryGroup === 'aerators')
            .map((item) => item.product.slug);
        const hasNonAerator = slugs.some((s) => !aeratorSlugs.includes(s));
        setGeneral((prev) => ({
            ...prev,
            eligibleAeratorSlugs: finalSlugs,
            eligibleProductSlugs: finalSlugs,
            freeDeliveryForAeratorsOnly: !hasNonAerator,
        }));
    };

    const handleToggleProduct = (slug: string) => {
        const next = currentEligibleSlugs.includes(slug)
            ? currentEligibleSlugs.filter((s) => s !== slug)
            : [...currentEligibleSlugs, slug];
        setEligibleSlugs(next);
    };

    // 1-Click Quick Presets
    const handleSelectAeratorsOnly = () => {
        setEligibleSlugs(
            catalogItems
                .filter((item) => item.categoryGroup === 'aerators')
                .map((item) => item.product.slug)
        );
    };

    const handleSelectMotorsOnly = () => {
        setEligibleSlugs(
            catalogItems
                .filter((item) => item.categoryGroup === 'motors')
                .map((item) => item.product.slug)
        );
    };

    const handleSelectGearboxesOnly = () => {
        setEligibleSlugs(
            catalogItems
                .filter((item) => item.categoryGroup === 'gearboxes')
                .map((item) => item.product.slug)
        );
    };

    const handleSelectSparesOnly = () => {
        setEligibleSlugs(
            catalogItems
                .filter((item) => item.categoryGroup === 'spares')
                .map((item) => item.product.slug)
        );
    };

    const handleSelectLongArmOnly = () => {
        setEligibleSlugs(
            catalogItems
                .filter((item) => item.categoryGroup === 'long-arm')
                .map((item) => item.product.slug)
        );
    };

    const handleSelectAllStoreProducts = () => {
        setEligibleSlugs(catalogItems.map((item) => item.product.slug));
    };

    const handleClearAllProducts = () => {
        setEligibleSlugs([]);
    };

    // Category group selection handlers
    const handleSelectActiveCategoryGroup = (group: ProductCategoryGroup) => {
        const groupSlugs = catalogItems
            .filter((item) => item.categoryGroup === group)
            .map((item) => item.product.slug);
        const combined = Array.from(new Set([...currentEligibleSlugs, ...groupSlugs]));
        setEligibleSlugs(combined);
    };

    const handleDeselectActiveCategoryGroup = (group: ProductCategoryGroup) => {
        const groupSlugs = new Set(
            catalogItems
                .filter((item) => item.categoryGroup === group)
                .map((item) => item.product.slug)
        );
        const remaining = currentEligibleSlugs.filter((s) => !groupSlugs.has(s));
        setEligibleSlugs(remaining);
    };

    // Filtered products list based on category tab & search
    const filteredCatalogItems = useMemo(() => {
        let list = catalogItems;
        if (selectedCategoryTab !== 'all') {
            list = list.filter((item) => item.categoryGroup === selectedCategoryTab);
        }
        if (productSearchQuery.trim()) {
            const q = productSearchQuery.toLowerCase().trim();
            list = list.filter(
                (item) =>
                    item.product.name.toLowerCase().includes(q) ||
                    (item.product.model && item.product.model.toLowerCase().includes(q)) ||
                    item.product.slug.toLowerCase().includes(q) ||
                    item.product.brand.toLowerCase().includes(q)
            );
        }
        return list;
    }, [selectedCategoryTab, productSearchQuery, catalogItems]);

    // Live counts per category
    const categoryStats = useMemo(() => {
        const stats: Record<ProductCategoryGroup, { total: number; selected: number }> = {
            aerators: {
                total: catalogItems.filter((i) => i.categoryGroup === 'aerators').length,
                selected: 0,
            },
            motors: {
                total: catalogItems.filter((i) => i.categoryGroup === 'motors').length,
                selected: 0,
            },
            gearboxes: {
                total: catalogItems.filter((i) => i.categoryGroup === 'gearboxes').length,
                selected: 0,
            },
            spares: {
                total: catalogItems.filter((i) => i.categoryGroup === 'spares').length,
                selected: 0,
            },
            'long-arm': {
                total: catalogItems.filter((i) => i.categoryGroup === 'long-arm').length,
                selected: 0,
            },
        };

        catalogItems.forEach((item) => {
            if (currentEligibleSlugs.includes(item.product.slug)) {
                stats[item.categoryGroup].selected++;
            }
        });

        return stats;
    }, [currentEligibleSlugs, catalogItems]);

    // Simulator evaluation
    const liveTestResult = useMemo(() => {
        const mockItems =
            testProductType === 'aerator'
                ? [{ category: 'aerator-set', slug: 'seaboss-2hp-4-paddle-pr14b', name: 'Sea Boss 2HP 4-Paddle Aerator', quantity: testAeratorQty }]
                : testProductType === 'motor'
                ? [{ category: 'motor', slug: 'aqualion-2hp-energy-efficient-aerator-motor', name: 'Aqua Lion 2HP Motor', quantity: testAeratorQty }]
                : testProductType === 'gearbox'
                ? [{ category: 'worm-gearbox', slug: 'seaboss-cast-iron-worm-gearbox-ratio-14-1', name: 'Cast Iron Worm Gearbox', quantity: testAeratorQty }]
                : testProductType === 'spares'
                ? [
                      { category: 'fan', slug: '4-paddle-fan', name: '4-Paddle Fan', quantity: testAeratorQty },
                      { category: 'float', slug: 'virgin-hdpe-float', name: 'Virgin HDPE Float', quantity: 2 },
                  ]
                : testProductType === 'long-arm'
                ? [{ category: 'long-arm-gearbox', slug: 'seaboss-long-arm-gearbox-heavy-duty', name: 'Sea Boss Long Arm Aerator', quantity: testAeratorQty }]
                : [
                      { category: 'aerator-set', slug: 'seaboss-2hp-4-paddle-pr14b', name: 'Sea Boss 2HP 4-Paddle Aerator', quantity: testAeratorQty },
                      { category: 'motor', slug: 'aqualion-2hp-energy-efficient-aerator-motor', name: 'Aqua Lion 2HP Motor', quantity: 1 },
                      { category: 'fan', slug: '4-paddle-fan', name: '4-Paddle Fan', quantity: 2 },
                  ];

        return evaluateOrderFreeDelivery(mockItems, testStateInput, rules, general);
    }, [testStateInput, testProductType, testAeratorQty, rules, general]);

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
                                Delivery & Shipping Manager
                            </h1>
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

            {/* Master Free Delivery & Minimum Order Quantity Manager */}
            <div className={`mb-8 rounded-2xl border-2 p-6 shadow-xs transition-all ${
                (general.isFreeDeliveryEnabled ?? true)
                    ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30'
                    : 'border-slate-300 bg-slate-50/80'
            }`}>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs ${
                            (general.isFreeDeliveryEnabled ?? true)
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-300 text-slate-700'
                        }`}>
                            🚚
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-black text-slate-900 font-poppins">
                                    Free Delivery Master Control
                                </h2>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    (general.isFreeDeliveryEnabled ?? true)
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                    {(general.isFreeDeliveryEnabled ?? true) ? '🟢 FREE DELIVERY ENABLED' : '🔴 FREE DELIVERY DISABLED'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Master Free Delivery Toggle Switch */}
                    <div className="flex items-center gap-3">
                        <label className={`flex items-center gap-3 cursor-pointer select-none px-4 py-2 rounded-xl border transition-all ${
                            (general.isFreeDeliveryEnabled ?? true)
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}>
                            <input
                                type="checkbox"
                                checked={general.isFreeDeliveryEnabled ?? true}
                                onChange={(e) =>
                                    setGeneral({
                                        ...general,
                                        isFreeDeliveryEnabled: e.target.checked,
                                    })
                                }
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="text-xs font-black">
                                {(general.isFreeDeliveryEnabled ?? true) ? 'Free Delivery: ACTIVE' : 'Free Delivery: DISABLED'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Settings Grid: MOQ and Production Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Minimum Order Quantity Input */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                    Minimum Aerator Quantity for Free Delivery
                                </label>
                                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    Current: {general.minAeratorQtyForFreeDelivery ?? 10} Sets
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={general.minAeratorQtyForFreeDelivery ?? 10}
                                onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                    setGeneral({
                                        ...general,
                                        minAeratorQtyForFreeDelivery: val,
                                    });
                                }}
                                className="w-24 h-10 px-3 rounded-xl border border-slate-300 bg-slate-50 text-center font-mono font-black text-sm text-slate-900 focus:bg-white focus:border-blue-600 outline-none"
                            />
                            <span className="text-xs font-bold text-slate-600">Aerator Sets</span>

                            <div className="flex items-center gap-1.5 ml-auto text-[11px] font-bold">
                                {[5, 10, 15, 20].map((qty) => (
                                    <button
                                        key={qty}
                                        type="button"
                                        onClick={() =>
                                            setGeneral({
                                                ...general,
                                                minAeratorQtyForFreeDelivery: qty,
                                            })
                                        }
                                        className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                            (general.minAeratorQtyForFreeDelivery ?? 10) === qty
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {qty} Sets {qty === 10 ? '★' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Production Live Visibility Toggle */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                    Live Website Visibility
                                </label>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    (general.enabledInProduction ?? true)
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {(general.enabledInProduction ?? true) ? 'LIVE' : 'HIDDEN'}
                                </span>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={general.enabledInProduction ?? true}
                                onChange={(e) =>
                                    setGeneral({
                                        ...general,
                                        enabledInProduction: e.target.checked,
                                    })
                                }
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-extrabold text-slate-800">
                                Show delivery policies live on production (karthiktraders.in)
                            </span>
                        </label>
                    </div>
                </div>
            </div>
            {/* Aerator Sets & Multi-Category Free Delivery Eligibility */}
            <div className="mb-8 rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-xs">
                {/* Section Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg">
                            <SparklesIcon className="w-5 h-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 font-poppins">
                                    Aerator Sets Free Delivery Eligibility
                                </h2>
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    {currentEligibleSlugs.length} of {catalogItems.length} Products Eligible
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Configure Free Delivery eligibility for Aerators, Motors, Gearboxes, Spares, and Long Arm. Admin can select products for aerators only, motors only, or for all products.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Toggle Free Delivery for Aerators Only */}
                        <label className="flex items-center gap-2 cursor-pointer select-none bg-indigo-50/70 border border-indigo-200 px-3 py-1.5 rounded-xl">
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
                                Aerator Sets Only Mode
                            </span>
                        </label>
                    </div>
                </div>

                {/* 1-Click Quick Preset Buttons Bar */}
                <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>Quick 1-Click Presets:</span>
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                            Apply one-click product eligibility across the store
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSelectAeratorsOnly}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                currentEligibleSlugs.length === categoryStats.aerators.total &&
                                categoryStats.aerators.total > 0 &&
                                catalogItems
                                    .filter((i) => i.categoryGroup === 'aerators')
                                    .every((p) => currentEligibleSlugs.includes(p.product.slug))
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                            }`}
                        >
                            <span>Aerators Only</span>
                            <span className="text-[10px] opacity-80">({categoryStats.aerators.total})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectMotorsOnly}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                currentEligibleSlugs.length === categoryStats.motors.total &&
                                categoryStats.motors.total > 0 &&
                                catalogItems
                                    .filter((i) => i.categoryGroup === 'motors')
                                    .every((p) => currentEligibleSlugs.includes(p.product.slug))
                                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                    : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                            }`}
                        >
                            <span>Motors Only</span>
                            <span className="text-[10px] opacity-80">({categoryStats.motors.total})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectGearboxesOnly}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                currentEligibleSlugs.length === categoryStats.gearboxes.total &&
                                categoryStats.gearboxes.total > 0 &&
                                catalogItems
                                    .filter((i) => i.categoryGroup === 'gearboxes')
                                    .every((p) => currentEligibleSlugs.includes(p.product.slug))
                                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                    : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                            }`}
                        >
                            <span>Gearboxes Only</span>
                            <span className="text-[10px] opacity-80">({categoryStats.gearboxes.total})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectSparesOnly}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                currentEligibleSlugs.length === categoryStats.spares.total &&
                                categoryStats.spares.total > 0 &&
                                catalogItems
                                    .filter((i) => i.categoryGroup === 'spares')
                                    .every((p) => currentEligibleSlugs.includes(p.product.slug))
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                            }`}
                        >
                            <span>Spares Only</span>
                            <span className="text-[10px] opacity-80">({categoryStats.spares.total})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectLongArmOnly}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                currentEligibleSlugs.length === categoryStats['long-arm'].total &&
                                categoryStats['long-arm'].total > 0 &&
                                catalogItems
                                    .filter((i) => i.categoryGroup === 'long-arm')
                                    .every((p) => currentEligibleSlugs.includes(p.product.slug))
                                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                                    : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                            }`}
                        >
                            <span>Long Arm Only</span>
                            <span className="text-[10px] opacity-80">({categoryStats['long-arm'].total})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSelectAllStoreProducts}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-1.5 ${
                                currentEligibleSlugs.length === catalogItems.length && catalogItems.length > 0
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                            }`}
                        >
                            <span>For All Products</span>
                            <span className="text-[10px] opacity-80">({catalogItems.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleClearAllProducts}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 transition-all cursor-pointer ml-auto"
                        >
                            ✕ Clear All
                        </button>
                    </div>
                </div>

                {/* Category Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 mb-4">
                    {(
                        [
                            { id: 'all', label: 'All Products', total: catalogItems.length, selected: currentEligibleSlugs.length },
                            { id: 'aerators', label: 'Aerator Sets', total: categoryStats.aerators.total, selected: categoryStats.aerators.selected },
                            { id: 'motors', label: 'Motors', total: categoryStats.motors.total, selected: categoryStats.motors.selected },
                            { id: 'gearboxes', label: 'Gearboxes', total: categoryStats.gearboxes.total, selected: categoryStats.gearboxes.selected },
                            { id: 'spares', label: 'Spare Parts', total: categoryStats.spares.total, selected: categoryStats.spares.selected },
                            { id: 'long-arm', label: 'Long Arm', total: categoryStats['long-arm'].total, selected: categoryStats['long-arm'].selected },
                        ] as const
                    ).map((tab) => {
                        const isTabActive = selectedCategoryTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCategoryTab(tab.id as CategoryTab)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                                    isTabActive
                                        ? 'bg-[#0B1A33] text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                                        isTabActive
                                            ? 'bg-white/20 text-white'
                                            : tab.selected > 0
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {tab.selected}/{tab.total}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar & Tab Group Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            placeholder="Search products by model, name, or brand..."
                            className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                        {productSearchQuery && (
                            <button
                                type="button"
                                onClick={() => setProductSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Group select/deselect for currently selected category */}
                    {selectedCategoryTab !== 'all' && (
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => handleSelectActiveCategoryGroup(selectedCategoryTab as ProductCategoryGroup)}
                                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-colors cursor-pointer"
                            >
                                + Select All in this Category
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeselectActiveCategoryGroup(selectedCategoryTab as ProductCategoryGroup)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            >
                                - Deselect Category
                            </button>
                        </div>
                    )}
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredCatalogItems.map((item) => {
                        const isSelected = isProductSelected(item.product.slug);
                        const isSeaboss = item.product.brand === 'seaboss';
                        const firstImage = item.product.images?.[0];

                        return (
                            <div
                                key={item.product.slug}
                                onClick={() => handleToggleProduct(item.product.slug)}
                                className={`rounded-xl border-2 p-3.5 flex flex-col justify-between gap-2.5 transition-all cursor-pointer select-none ${
                                    isSelected
                                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-400'
                                        : 'border-slate-200 bg-white hover:border-slate-300 opacity-70 hover:opacity-100'
                                }`}
                            >
                                {/* Top Header: Category Tag, Brand & Checkbox */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${item.badgeBg}`}>
                                            {item.badgeText}
                                        </span>
                                        <span
                                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-white ${
                                                isSeaboss ? 'bg-blue-600' : 'bg-emerald-600'
                                            }`}
                                        >
                                            {isSeaboss ? 'SEA BOSS' : 'AQUA LION'}
                                        </span>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}} // handled by card click
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>

                                {/* Product Info & Thumbnail */}
                                <div className="flex items-center gap-3">
                                    {firstImage ? (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                                            <img
                                                src={firstImage}
                                                alt={item.product.name}
                                                className="w-full h-full object-contain"
                                                loading="lazy"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-xl">
                                            📦
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-extrabold text-slate-900 truncate">
                                            {item.product.model || item.product.name}
                                        </h3>
                                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                            {item.product.name}
                                        </p>
                                    </div>
                                </div>

                                {/* Price & Free Delivery Status */}
                                <div className="mt-1 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-slate-800">
                                        ₹{item.product.salePrice?.toLocaleString('en-IN')}
                                    </span>
                                    <span
                                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                            isSelected
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {isSelected ? '✓ Free Delivery' : 'Excluded'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredCatalogItems.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-xs font-bold">
                        No products matched &quot;{productSearchQuery}&quot; in this category.
                    </div>
                )}

                {/* Category Breakdown Counters Footer */}
                <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-extrabold text-slate-700">
                        Category Eligibility Summary:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Aerators: {categoryStats.aerators.selected}/{categoryStats.aerators.total}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            Motors: {categoryStats.motors.selected}/{categoryStats.motors.total}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                            Gearboxes: {categoryStats.gearboxes.selected}/{categoryStats.gearboxes.total}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Spares: {categoryStats.spares.selected}/{categoryStats.spares.total}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                            Long Arm: {categoryStats['long-arm'].selected}/{categoryStats['long-arm'].total}
                        </span>
                    </div>
                </div>
            </div>

            {/* Interactive Live State & Product Simulator Card */}
            <div className="mb-8 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-sky-50/60 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-blue-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-base">📍</span>
                        <h2 className="text-sm font-extrabold text-blue-950 font-poppins">
                            Live State & Cart Delivery Preview
                        </h2>
                    </div>
                </div>

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
                                        value="motor"
                                        checked={testProductType === 'motor'}
                                        onChange={() => setTestProductType('motor')}
                                        className="text-blue-600"
                                    />
                                    <span>Motor Only</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="testItemType"
                                        value="gearbox"
                                        checked={testProductType === 'gearbox'}
                                        onChange={() => setTestProductType('gearbox')}
                                        className="text-blue-600"
                                    />
                                    <span>Gearbox Only</span>
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
                                    <span>Spare Parts Only</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="testItemType"
                                        value="long-arm"
                                        checked={testProductType === 'long-arm'}
                                        onChange={() => setTestProductType('long-arm')}
                                        className="text-blue-600"
                                    />
                                    <span>Long Arm Aerator Only</span>
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
                                    <span>Combined Mixed Cart</span>
                                </label>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-blue-200/60">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                                        Item Order Quantity
                                    </label>
                                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                        testAeratorQty >= (general.minAeratorQtyForFreeDelivery ?? 10)
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {testAeratorQty >= (general.minAeratorQtyForFreeDelivery ?? 10) ? 'Eligible' : 'Below Minimum'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={testAeratorQty}
                                        onChange={(e) => setTestAeratorQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                        className="w-16 h-8 px-2 rounded-lg border border-blue-300 bg-white font-mono font-bold text-center text-xs text-slate-900"
                                    />
                                    <span className="text-[11px] font-bold text-slate-600">Units</span>
                                    <div className="flex items-center gap-1 ml-auto text-[10px] font-bold">
                                        {[1, 5, 10, 15].map((q) => (
                                            <button
                                                key={q}
                                                type="button"
                                                onClick={() => setTestAeratorQty(q)}
                                                className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                                    testAeratorQty === q
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                                                }`}
                                            >
                                                {q} {q === 10 ? '★' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Result Box */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-white border border-blue-200 shadow-2xs flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                                {testStateInput} · {testProductType === 'aerator' ? `${testAeratorQty} Aerator Set(s)` : testProductType === 'motor' ? `${testAeratorQty} Motor(s)` : testProductType === 'gearbox' ? `${testAeratorQty} Gearbox(es)` : testProductType === 'spares' ? `${testAeratorQty} Spare Part(s)` : testProductType === 'long-arm' ? `${testAeratorQty} Long Arm Aerator(s)` : `${testAeratorQty} Unit(s) + Mixed Cart`}
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
