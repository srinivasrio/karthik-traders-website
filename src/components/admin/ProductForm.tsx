"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    PlusIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import { CATEGORIES, BRANDS, SPEC_TEMPLATES, CATEGORY_GROUPS } from '@/data/admin-constants';
import ImageUploader from './ImageUploader';
import ProductPreviewCard from './ProductPreviewCard';

function mapCategoryToDb(cat: string): string {
    const valid = ['aerators', 'spares', 'motors', 'gearboxes', 'long-arm'];
    if (valid.includes(cat)) return cat;
    if (cat === 'aerator-set') return 'aerators';
    if (cat === 'motor') return 'motors';
    if (['worm-gearbox', 'bevel-gearbox'].includes(cat)) return 'gearboxes';
    if (['long-arm-gearbox', 'long-arm-spare'].includes(cat)) return 'long-arm';
    return 'spares';
}

interface SpecRow {
    id: string;
    key: string;
    value: string;
}

interface ComponentRow {
    item: string;
    spec: string;
    quantity: string;
}

interface ProductFormProps {
    mode: 'create' | 'edit';
    productId?: string;
    returnUrl?: string;
}

function parseImages(imagesVal: any): string[] {
    if (!imagesVal) return [];
    if (Array.isArray(imagesVal)) {
        return imagesVal.map(String).filter(Boolean);
    }
    if (typeof imagesVal === 'string') {
        const trimmed = imagesVal.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
            } catch (e) {
                // ignore
            }
        }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const inner = trimmed.slice(1, -1);
            const items: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < inner.length; i++) {
                const char = inner[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    items.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            if (current.trim()) {
                items.push(current.trim());
            }
            return items.map(item => {
                let cleaned = item;
                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.slice(1, -1);
                }
                return cleaned.replace(/\\"/g, '"').trim();
            }).filter(Boolean);
        }
        return [trimmed];
    }
    return [];
}

function parseSpecifications(specsVal: any): Record<string, any> {
    if (!specsVal) return {};
    if (typeof specsVal === 'string') {
        const trimmed = specsVal.trim();
        try {
            const parsed = JSON.parse(trimmed);
            return parseSpecifications(parsed);
        } catch (e) {
            return {};
        }
    }
    if (Array.isArray(specsVal)) {
        const obj: Record<string, any> = {};
        specsVal.forEach((s: any) => {
            if (s && typeof s === 'object' && s.key) {
                obj[s.key] = s.value;
            }
        });
        return obj;
    }
    if (typeof specsVal === 'object') {
        return { ...specsVal };
    }
    return {};
}

function parseFeatures(featuresVal: any): string[] {
    if (!featuresVal) return [];
    if (Array.isArray(featuresVal)) {
        return featuresVal.map((f: any) => {
            if (typeof f === 'string') return f;
            if (f && typeof f === 'object') {
                return f.feature_text || f.text || f.value || '';
            }
            return String(f);
        }).filter(Boolean);
    }
    if (typeof featuresVal === 'string') {
        const trimmed = featuresVal.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                return parseFeatures(parsed);
            } catch (e) {
                // ignore
            }
        }
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return parseImages(trimmed);
        }
        if (trimmed.includes('\n')) {
            return trimmed.split('\n').map(s => s.trim()).filter(Boolean);
        }
        if (trimmed.includes(';')) {
            return trimmed.split(';').map(s => s.trim()).filter(Boolean);
        }
        return [trimmed];
    }
    return [];
}

function parseComponents(compsVal: any): Array<{ item: string; spec: string; quantity: string }> {
    if (!compsVal) return [];
    if (Array.isArray(compsVal)) {
        return compsVal.map((c: any) => {
            if (!c || typeof c !== 'object') return null;
            return {
                item: String(c.item || c.name || c.component_name || ''),
                spec: String(c.spec || c.details || c.component_details || ''),
                quantity: String(c.quantity ?? ''),
            };
        }).filter(Boolean) as Array<{ item: string; spec: string; quantity: string }>;
    }
    if (typeof compsVal === 'string') {
        const trimmed = compsVal.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                return parseComponents(parsed);
            } catch (e) {
                // ignore
            }
        }
    }
    return [];
}

export default function ProductForm({ mode, productId, returnUrl = '/admin/products' }: ProductFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(mode === 'edit');
    const [showPreview, setShowPreview] = useState(false);

    // Section collapse state
    const [sections, setSections] = useState({
        basic: true,
        pricing: true,
        images: true,
        description: false,
        specs: false,
        features: false,
        components: false,
    });

    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [model, setModel] = useState('');
    const [brand, setBrand] = useState('custom');
    const [customBrand, setCustomBrand] = useState('');
    const [category, setCategory] = useState('aerator-set');
    const [mrp, setMrp] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [stock, setStock] = useState('0');
    const [stockStatus, setStockStatus] = useState('in-stock');
    const [warranty, setWarranty] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isBestSelling, setIsBestSelling] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [specs, setSpecs] = useState<SpecRow[]>([
        { id: Math.random().toString(36).substring(2, 9), key: '', value: '' }
    ]);
    const [existingFeatures, setExistingFeatures] = useState<string[]>([]);
    const [components, setComponents] = useState<ComponentRow[]>([
        { item: '', spec: '', quantity: '' },
    ]);

    // Generate slug from name
    const generateSlug = (n: string) =>
        n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const handleNameChange = (val: string) => {
        setName(val);
        if (mode === 'create') {
            setSlug(generateSlug(val));
        }
    };

    // Auto-set stock status based on stock count
    useEffect(() => {
        const s = parseInt(stock) || 0;
        if (s <= 0) setStockStatus('out-of-stock');
        else if (s < 10) setStockStatus('limited');
        else setStockStatus('in-stock');
    }, [stock]);

    // Load existing product for edit mode
    useEffect(() => {
        if (mode !== 'edit' || !productId) return;

        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Product not found');

                setName(data.name || '');
                setSlug(data.slug || '');
                setMrp(data.mrp?.toString() || '');
                setSellingPrice(data.price?.toString() || '');
                setStock(data.stock?.toString() || '0');
                const specsData = parseSpecifications(data.specifications);
                setCategory(specsData.category || data.category || 'aerator-set');
                setWarranty(data.warranty || specsData.warranty || '');
                setDescription(data.description || '');
                setIsActive(data.is_active ?? true);
                setIsBestSelling(data.is_best_selling ?? false);
                setImages(parseImages(data.images));

                // Extract brand
                const b = data.brand || specsData.brand || 'generic';
                if (b !== 'aqualion' && b !== 'seaboss') {
                    setBrand('custom');
                    setCustomBrand(b);
                } else {
                    setBrand(b);
                    setCustomBrand('');
                }

                // Extract model
                const m = specsData.model ||
                    specsData['Model number'] ||
                    specsData.Model || '';
                setModel(m);

                // Extract specs (filter out internal keys)
                const internalKeys = ['brand', 'model', 'features', 'components', 'warranty', 'weight', 'category'];
                const specRows: SpecRow[] = Object.entries(specsData)
                    .filter(([k]) => !internalKeys.includes(k.toLowerCase()))
                    .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
                    .map(([k, v]) => ({
                        id: Math.random().toString(36).substring(2, 9),
                        key: k,
                        value: String(v)
                    }));

                if (specRows.length > 0) {
                    setSpecs(specRows);
                    setSections(prev => ({ ...prev, specs: true }));
                } else {
                    setSpecs([{ id: Math.random().toString(36).substring(2, 9), key: '', value: '' }]);
                }

                // Extract features (preserved for backward compatibility, not managed in UI)
                const feats = parseFeatures(specsData.features || data.features);
                if (feats.length > 0) {
                    setExistingFeatures(feats);
                }

                // Extract components
                const comps = parseComponents(specsData.components || data.set_components || specsData.set_components);
                if (comps.length > 0) {
                    setComponents(comps);
                    setSections(prev => ({ ...prev, components: true }));
                }

                if (data.description) {
                    setSections(prev => ({ ...prev, description: true }));
                }
            } catch (err: any) {
                console.error('Error fetching product:', err);
                alert('Error loading product: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [mode, productId]);

    // Load spec template
    const loadSpecTemplate = () => {
        // Check if it's the PR20CMB model (so we don't modify its template)
        const isPR20 = 
            productId === 'aqualion-pr20cmb' || 
            (name || '').toLowerCase().includes('pr 20 cmb') || 
            (model || '').toLowerCase().includes('pr 20 cmb');

        if (isPR20) {
            alert("Aqualion PR20CMB has a locked specification template and cannot be modified.");
            return;
        }

        const template = SPEC_TEMPLATES[category];
        if (!template) return;

        // Map existing specs by lowercased key to keep their values, ids, etc.
        const existingSpecsMap = new Map<string, typeof specs[number]>();
        specs.forEach(s => {
            const cleanKey = (s.key || '').trim().toLowerCase();
            if (cleanKey && !existingSpecsMap.has(cleanKey)) {
                existingSpecsMap.set(cleanKey, s);
            }
        });

        const finalizedSpecs: typeof specs = [];
        const templateKeysAdded = new Set<string>();

        // 1. Add template keys in the exact template order
        template.forEach(k => {
            const cleanKey = k.trim().toLowerCase();
            const existingSpec = existingSpecsMap.get(cleanKey);

            if (existingSpec) {
                // Keep existing spec's key (original casing), value, and id
                finalizedSpecs.push(existingSpec);
            } else {
                // Generate a new blank spec row
                finalizedSpecs.push({
                    id: Math.random().toString(36).substring(2, 9),
                    key: k,
                    value: ''
                });
            }
            templateKeysAdded.add(cleanKey);
        });

        // 2. Append any non-template custom specs that the user had manually added
        specs.forEach(s => {
            const cleanKey = (s.key || '').trim().toLowerCase();
            if (cleanKey && !templateKeysAdded.has(cleanKey)) {
                finalizedSpecs.push(s);
            } else if (!cleanKey && s.value) {
                // Keep empty keys that have values
                finalizedSpecs.push(s);
            }
        });

        setSpecs(finalizedSpecs);
    };

    // Spec handlers
    const updateSpec = (id: string, field: 'key' | 'value', val: string) => {
        setSpecs(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    };
    const addSpec = () => {
        setSpecs(prev => [
            ...prev,
            { id: Math.random().toString(36).substring(2, 9), key: '', value: '' }
        ]);
    };
    const removeSpec = (id: string) => {
        setSpecs(prev => {
            const filtered = prev.filter(s => s.id !== id);
            return filtered;
        });
    };

    // Feature handlers removed. Existing features preserved on load.

    // Component handlers
    const updateComponent = (index: number, field: keyof ComponentRow, val: string) => {
        setComponents(prev => prev.map((c, i) => i === index ? { ...c, [field]: val } : c));
    };
    const addComponent = () => setComponents(prev => [...prev, { item: '', spec: '', quantity: '' }]);
    const removeComponent = (index: number) => setComponents(prev => prev.filter((_, i) => i !== index));

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Build specifications JSONB
    const buildSpecifications = (brandValue: string) => {
        const result: Record<string, any> = {};

        // Add spec rows
        specs.forEach(s => {
            if (s.key.trim() && s.value.trim()) {
                result[s.key.trim()] = s.value.trim();
            }
        });

        // Add brand & model for backwards compatibility
        result.brand = brandValue;
        if (model) result.model = model;

        // Add existing features array for backward compatibility
        if (existingFeatures && existingFeatures.length > 0) {
            result.features = existingFeatures;
        }

        // Add components array
        const cleanComponents = components
            .filter(c => c.item.trim())
            .map(c => ({
                item: c.item.trim(),
                spec: c.spec.trim(),
                quantity: isNaN(Number(c.quantity)) ? c.quantity : Number(c.quantity) || c.quantity,
            }));
        if (cleanComponents.length > 0) {
            result.components = cleanComponents;
        }

        // Warranty
        if (warranty) result.warranty = warranty;
        result.category = category;

        return result;
    };

    const validate = (): string | null => {
        if (!name.trim()) return 'Product name is required';
        if (!slug.trim()) return 'Slug is required';
        if (!sellingPrice || parseFloat(sellingPrice) <= 0) return 'Selling price must be greater than 0';
        if (brand === 'custom' && !customBrand.trim()) return 'Custom brand name is required';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validate();
        if (validationError) {
            alert(validationError);
            return;
        }

        setSaving(true);

        try {
            const brandValue = brand === 'custom' ? customBrand.trim() : brand;
            const productData = {
                name: name.trim(),
                slug: slug.trim(),
                category: mapCategoryToDb(category),
                price: parseFloat(sellingPrice),
                mrp: mrp ? parseFloat(mrp) : null,
                stock: parseInt(stock) || 0,
                description: description.trim() || null,
                images,
                specifications: buildSpecifications(brandValue),
                is_active: isActive,
                is_best_selling: isBestSelling,
                brand: brandValue,
            };

            if (mode === 'create') {
                const { error } = await supabase.from('products').insert([productData]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', productId);
                if (error) throw error;
            }

            router.push(returnUrl);
        } catch (err: any) {
            console.error('Error saving product:', err);
            alert('Failed to save product: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600" />
            </div>
        );
    }

    const discount = parseFloat(mrp) > 0 && parseFloat(sellingPrice) > 0 && parseFloat(mrp) > parseFloat(sellingPrice)
        ? Math.round(((parseFloat(mrp) - parseFloat(sellingPrice)) / parseFloat(mrp)) * 100)
        : 0;

    const isAeratorSet = category === 'aerator-set' || category === 'aerators';

    return (
        <div className="max-w-5xl mx-auto px-2 sm:px-4 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        {mode === 'create' ? 'Add New Product' : 'Edit Product'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {mode === 'create' ? 'Fill in the details to create a new product' : `Editing: ${name || 'Untitled'}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <SparklesIcon className="h-3.5 w-3.5" />
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex gap-6">
                    {/* Main Form */}
                    <div className="flex-1 space-y-4">

                        {/* === BASIC INFO === */}
                        <SectionCard
                            title="Basic Information"
                            open={sections.basic}
                            onToggle={() => toggleSection('basic')}
                        >
                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Product Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => handleNameChange(e.target.value)}
                                        required
                                        placeholder="e.g., AQUA LION 2HP 4 Paddle Wheel Aerator Set"
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 transition-shadow"
                                    />
                                    {slug && (
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Slug: <span className="font-mono">{slug}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Model + Brand row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Model Number</label>
                                        <input
                                            type="text"
                                            value={model}
                                            onChange={e => setModel(e.target.value)}
                                            placeholder="e.g., PR 20 B"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Brand <span className="text-red-400">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            {BRANDS.map(b => (
                                                <button
                                                    key={b.value}
                                                    type="button"
                                                    onClick={() => setBrand(b.value)}
                                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all duration-150 ${
                                                        brand === b.value
                                                            ? 'border-aqua-500 bg-aqua-50 text-aqua-700 shadow-sm'
                                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                                                        style={{ backgroundColor: b.color }}
                                                    />
                                                    {b.label}
                                                </button>
                                            ))}
                                        </div>
                                        {brand === 'custom' && (
                                            <div className="mt-3 transition-all duration-300">
                                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                                    Enter Custom Brand Name <span className="text-red-400">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customBrand}
                                                    onChange={e => setCustomBrand(e.target.value)}
                                                    placeholder="e.g., CRI, Standard, Kirloskar"
                                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Category <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 bg-white"
                                    >
                                        {CATEGORY_GROUPS.map(group => (
                                            <optgroup key={group.group} label={group.group}>
                                                {CATEGORIES
                                                    .filter(c => group.categories.includes(c.value))
                                                    .map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))
                                                }
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Visibility & Best Selling toggles */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={e => setIsActive(e.target.checked)}
                                            className="h-4 w-4 text-aqua-600 focus:ring-aqua-500 border-slate-300 rounded"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Visible on store</span>
                                            <p className="text-[10px] text-slate-500">Uncheck to hide from customers</p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={isBestSelling}
                                            onChange={e => setIsBestSelling(e.target.checked)}
                                            className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300 rounded"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                                Best Selling
                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                                            </span>
                                            <p className="text-[10px] text-slate-500">Mark product as best selling</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </SectionCard>

                        {/* === PRICING & STOCK === */}
                        <SectionCard
                            title="Pricing & Stock"
                            open={sections.pricing}
                            onToggle={() => toggleSection('pricing')}
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            MRP (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={mrp}
                                            onChange={e => setMrp(e.target.value)}
                                            min="0"
                                            step="1"
                                            placeholder="34000"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Selling Price (₹) <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={sellingPrice}
                                            onChange={e => setSellingPrice(e.target.value)}
                                            required
                                            min="0"
                                            step="1"
                                            placeholder="32999"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount</label>
                                        <div className={`px-3 py-2 text-sm rounded-lg border ${
                                            discount > 0 ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}>
                                            {discount > 0 ? `${discount}% OFF` : 'No discount'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                                        <input
                                            type="number"
                                            value={stock}
                                            onChange={e => setStock(e.target.value)}
                                            min="0"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                        />
                                        <p className="text-[10px] mt-1 flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                stockStatus === 'in-stock' ? 'bg-green-500' :
                                                stockStatus === 'limited' ? 'bg-amber-500' : 'bg-red-500'
                                            }`} />
                                            <span className={
                                                stockStatus === 'in-stock' ? 'text-green-600' :
                                                stockStatus === 'limited' ? 'text-amber-600' : 'text-red-600'
                                            }>
                                                {stockStatus === 'in-stock' ? 'In Stock' :
                                                 stockStatus === 'limited' ? 'Limited Stock' : 'Out of Stock'}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Warranty</label>
                                        <input
                                            type="text"
                                            value={warranty}
                                            onChange={e => setWarranty(e.target.value)}
                                            placeholder="e.g., 1 Year Warranty"
                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* === IMAGES === */}
                        <SectionCard
                            title="Product Images"
                            open={sections.images}
                            onToggle={() => toggleSection('images')}
                        >
                            <ImageUploader images={images} onChange={setImages} category={category} />
                        </SectionCard>

                        {/* === DESCRIPTION === */}
                        <SectionCard
                            title="Description"
                            open={sections.description}
                            onToggle={() => toggleSection('description')}
                            badge={description ? 'Filled' : undefined}
                        >
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={5}
                                placeholder="Detailed product description..."
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 resize-y"
                            />
                        </SectionCard>

                        {/* === SPECIFICATIONS === */}
                        <SectionCard
                            title="Specifications"
                            open={sections.specs}
                            onToggle={() => toggleSection('specs')}
                            badge={specs.filter(s => s.key && s.value).length > 0 ? `${specs.filter(s => s.key && s.value).length} specs` : undefined}
                            action={
                                <button
                                    type="button"
                                    onClick={loadSpecTemplate}
                                    className="text-[10px] text-aqua-600 hover:text-aqua-700 font-medium"
                                >
                                    Load Template
                                </button>
                            }
                        >
                            <div className="space-y-2">
                                {specs.map((spec) => (
                                    <div key={spec.id} className="flex gap-2 items-start">
                                        <input
                                            type="text"
                                            value={spec.key}
                                            onChange={e => updateSpec(spec.id, 'key', e.target.value)}
                                            placeholder="Spec name"
                                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                        />
                                        <textarea
                                            value={spec.value}
                                            onChange={e => updateSpec(spec.id, 'value', e.target.value)}
                                            placeholder="Value (can be multiline)"
                                            rows={Math.max(1, (spec.value || '').split('\n').length)}
                                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 min-h-[32px] resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSpec(spec.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addSpec}
                                    className="flex items-center gap-1 text-xs text-aqua-600 hover:text-aqua-700 font-medium py-1"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" /> Add Specification
                                </button>
                            </div>
                        </SectionCard>

                        {/* === SET COMPONENTS (Aerator sets only) === */}
                        {isAeratorSet && (
                            <SectionCard
                                title="Set Components"
                                open={sections.components}
                                onToggle={() => toggleSection('components')}
                                badge={components.filter(c => c.item.trim()).length > 0 ? `${components.filter(c => c.item.trim()).length} parts` : undefined}
                            >
                                <div className="space-y-2">
                                    {/* Header */}
                                    <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-500 uppercase px-1">
                                        <div className="col-span-4">Component</div>
                                        <div className="col-span-5">Specification</div>
                                        <div className="col-span-2">Qty</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    {components.map((comp, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                            <input
                                                type="text"
                                                value={comp.item}
                                                onChange={e => updateComponent(i, 'item', e.target.value)}
                                                placeholder="e.g., MOTOR"
                                                className="col-span-12 sm:col-span-4 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                            />
                                            <input
                                                type="text"
                                                value={comp.spec}
                                                onChange={e => updateComponent(i, 'spec', e.target.value)}
                                                placeholder="e.g., 2HP Heavy Duty"
                                                className="col-span-8 sm:col-span-5 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                            />
                                            <input
                                                type="text"
                                                value={comp.quantity}
                                                onChange={e => updateComponent(i, 'quantity', e.target.value)}
                                                placeholder="Qty"
                                                className="col-span-3 sm:col-span-2 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeComponent(i)}
                                                className="col-span-1 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors justify-self-center"
                                            >
                                                <TrashIcon className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addComponent}
                                        className="flex items-center gap-1 text-xs text-aqua-600 hover:text-aqua-700 font-medium py-1"
                                    >
                                        <PlusIcon className="h-3.5 w-3.5" /> Add Component
                                    </button>
                                </div>
                            </SectionCard>
                        )}

                        {/* === ACTIONS === */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <Link
                                href={returnUrl}
                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 text-sm font-medium text-white bg-aqua-600 rounded-lg hover:bg-aqua-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {saving
                                    ? 'Saving...'
                                    : mode === 'create' ? 'Create Product' : 'Update Product'
                                }
                            </button>
                        </div>
                    </div>

                    {/* Preview Sidebar */}
                    {showPreview && (
                        <div className="hidden sm:block w-72 flex-shrink-0">
                            <div className="sticky top-20">
                                <ProductPreviewCard
                                    name={name}
                                    model={model}
                                    brand={brand === 'custom' ? customBrand : brand}
                                    category={category}
                                    mrp={mrp}
                                    sellingPrice={sellingPrice}
                                    warranty={warranty}
                                    stockStatus={stockStatus}
                                    images={images}
                                    features={existingFeatures}
                                    isBestSelling={isBestSelling}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

// === Collapsible Section Card ===
function SectionCard({
    title,
    open,
    onToggle,
    children,
    badge,
    action,
}: {
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badge?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer select-none focus:outline-none focus:bg-slate-50"
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                    {badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 bg-aqua-100 text-aqua-700 rounded-full">
                            {badge}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {action && open && (
                        <div onClick={e => e.stopPropagation()}>
                            {action}
                        </div>
                    )}
                    {open ? (
                        <ChevronUpIcon className="h-4 w-4 text-slate-400" />
                    ) : (
                        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                    )}
                </div>
            </div>
            {open && (
                <div className="px-4 pb-4 pt-1">
                    {children}
                </div>
            )}
        </div>
    );
}
