"use client";

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    Squares2X2Icon,
    TableCellsIcon,
    TrashIcon,
    EyeIcon,
    EyeSlashIcon,
    PencilIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CATEGORY_FILTERS, BRANDS } from '@/data/admin-constants';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface Product {
    id: string;
    name: string;
    slug: string;
    category: string;
    brand: string | null;
    price: number;
    mrp: number | null;
    stock: number;
    is_active: boolean;
    images: string[] | null;
    specifications?: any;
    warranty?: string;
    created_at?: string;
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

const ITEMS_PER_PAGE = 20;

export default function AdminProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading...</div>}>
            <ProductsContent />
        </Suspense>
    );
}

function ProductsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialCategory = searchParams.get('category') || 'all';
    const initialBrand = searchParams.get('brand') || 'all';

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState(initialCategory);
    const [activeBrand, setActiveBrand] = useState(initialBrand);
    const [sortBy, setSortBy] = useState('name-asc');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null; name: string }>({
        open: false, id: null, name: '',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        setActiveFilter(searchParams.get('category') || 'all');
        setActiveBrand(searchParams.get('brand') || 'all');
    }, [searchParams]);

    const updateUrlParams = (params: Record<string, string>) => {
        const p = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([k, v]) => {
            if (v === 'all' || !v) p.delete(k);
            else p.set(k, v);
        });
        router.push(`/admin/products?${p.toString()}`);
    };

    useEffect(() => {
        let filtered = products;

        // Category filter
        const filter = CATEGORY_FILTERS.find(f => f.id === activeFilter);
        if (filter && filter.categories.length > 0) {
            filtered = filtered.filter(p => filter.categories.includes(p.category));
        }

        // Brand filter
        if (activeBrand !== 'all') {
            filtered = filtered.filter(p => {
                const pBrand = p.brand || p.specifications?.brand || '';
                return pBrand === activeBrand;
            });
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => {
                const model = p.specifications?.model || p.specifications?.['Model number'] || '';
                return (
                    p.name.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    (p.brand || '').toLowerCase().includes(q) ||
                    model.toLowerCase().includes(q)
                );
            });
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low': return a.price - b.price;
                case 'price-high': return b.price - a.price;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'stock-low': return a.stock - b.stock;
                case 'stock-high': return b.stock - a.stock;
                case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                default: return 0;
            }
        });

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [searchQuery, products, activeFilter, activeBrand, sortBy]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // All product data is stored directly on the products table:
            // - images: text[] column
            // - specifications: jsonb column (contains brand, features, components, warranty, etc.)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('category')
                .order('name');

            if (error) {
                console.error('Error fetching products:', error);
                throw error;
            }

            const formattedProducts = (data || []).map((p: any) => {
                const specsObj = parseSpecifications(p.specifications);

                // Images are stored as text[] on the products table
                const imagesList = parseImages(p.images);

                // Features and components are stored inside the specifications JSONB
                const featuresList = parseFeatures(specsObj.features);
                specsObj.features = featuresList;

                const componentsList = parseComponents(specsObj.components || specsObj.set_components);
                specsObj.components = componentsList;

                const resolvedBrand = p.brand || specsObj.brand || specsObj.Brand || null;
                const resolvedWarranty = p.warranty || specsObj.warranty || specsObj.Warranty || '';
                const resolvedCategory = specsObj.category || p.category;

                return {
                    ...p,
                    brand: resolvedBrand,
                    warranty: resolvedWarranty,
                    category: resolvedCategory,
                    images: imagesList,
                    specifications: specsObj,
                } as Product;
            });

            setProducts(formattedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };


    const deleteProduct = async (id: string) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            alert('Error deleting product: ' + error.message);
        } else {
            fetchProducts();
        }
        setDeleteModal({ open: false, id: null, name: '' });
    };

    const toggleVisibility = async (id: string, currentActive: boolean) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: !currentActive })
            .eq('id', id);
        if (error) alert('Error: ' + error.message);
        else fetchProducts();
    };

    const bulkToggleVisibility = async (visible: boolean) => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds);
        for (const id of ids) {
            await supabase.from('products').update({ is_active: visible }).eq('id', id);
        }
        setSelectedIds(new Set());
        fetchProducts();
    };

    const bulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected products?`)) return;
        const ids = Array.from(selectedIds);
        for (const id of ids) {
            await supabase.from('products').delete().eq('id', id);
        }
        setSelectedIds(new Set());
        fetchProducts();
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
        }
    };

    const formatCategory = (category: string) =>
        category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const getBrandLabel = (product: Product) => {
        const b = product.brand || product.specifications?.brand || '';
        const def = BRANDS.find(br => br.value === b);
        return def ? def.label : '';
    };

    const getBrandColor = (product: Product) => {
        const b = product.brand || product.specifications?.brand || '';
        const def = BRANDS.find(br => br.value === b);
        return def?.bgClass || 'bg-slate-100 text-slate-600';
    };

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="px-1 sm:px-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold text-slate-900">Products</h1>
                    <p className="text-xs text-slate-500">
                        {filteredProducts.length} of {products.length} products
                    </p>
                </div>
                <Link
                    href={`/admin/products/new?fromCategory=${activeFilter}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-aqua-600 rounded-lg hover:bg-aqua-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Product
                </Link>
            </div>

            {/* Search + Sort + View Toggle */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, model, brand..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 bg-white"
                    >
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="price-low">Price: Low → High</option>
                        <option value="price-high">Price: High → Low</option>
                        <option value="stock-low">Stock: Low → High</option>
                        <option value="stock-high">Stock: High → Low</option>
                        <option value="newest">Newest First</option>
                    </select>
                    <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-aqua-50 text-aqua-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Table view"
                        >
                            <TableCellsIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-aqua-50 text-aqua-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid view"
                        >
                            <Squares2X2Icon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {CATEGORY_FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => updateUrlParams({ category: filter.id })}
                        className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all duration-200 ${
                            activeFilter === filter.id
                                ? 'bg-aqua-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
                <span className="w-px h-6 bg-slate-200 self-center mx-1" />
                {[{ value: 'all', label: 'All Brands' }, ...BRANDS].map(b => (
                    <button
                        key={b.value}
                        onClick={() => updateUrlParams({ brand: b.value })}
                        className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all duration-200 ${
                            activeBrand === b.value
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="mt-3 flex items-center gap-3 p-2.5 bg-aqua-50 border border-aqua-200 rounded-lg">
                    <span className="text-xs font-medium text-aqua-700">{selectedIds.size} selected</span>
                    <div className="flex gap-1.5 ml-auto">
                        <button
                            onClick={() => bulkToggleVisibility(true)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                        >
                            <EyeIcon className="h-3 w-3" /> Show
                        </button>
                        <button
                            onClick={() => bulkToggleVisibility(false)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                        >
                            <EyeSlashIcon className="h-3 w-3" /> Hide
                        </button>
                        <button
                            onClick={bulkDelete}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-red-50 border border-red-200 rounded text-red-600 hover:bg-red-100"
                        >
                            <TrashIcon className="h-3 w-3" /> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="mt-8 flex items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="mt-8 text-center py-16">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-700">No products found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {searchQuery ? 'Try adjusting your search or filters.' : 'Get started by adding your first product.'}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/admin/products/new"
                            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-xs font-medium text-white bg-aqua-600 rounded-lg hover:bg-aqua-700"
                        >
                            <PlusIcon className="h-4 w-4" /> Add Product
                        </Link>
                    )}
                </div>
            ) : viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-2 py-2.5 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-3.5 w-3.5 text-aqua-600 rounded border-slate-300 focus:ring-aqua-500"
                                        />
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Product</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Brand</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Category</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Price</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Stock</th>
                                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase">Status</th>
                                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedProducts.map(product => {
                                    const img = product.images && product.images.length > 0 ? product.images[0] : null;
                                    const brandLabel = getBrandLabel(product);
                                    const brandColor = getBrandColor(product);
                                    const model = product.specifications?.model || product.specifications?.['Model number'] || '';

                                    return (
                                        <tr key={product.id} className={`hover:bg-slate-50 transition-colors ${!product.is_active ? 'opacity-60' : ''}`}>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(product.id)}
                                                    onChange={() => toggleSelect(product.id)}
                                                    className="h-3.5 w-3.5 text-aqua-600 rounded border-slate-300 focus:ring-aqua-500"
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                        {img ? (
                                                            <img
                                                                src={img}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-[8px]">IMG</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-900 truncate max-w-[250px]">{product.name}</p>
                                                        {model && <p className="text-[10px] text-slate-400 truncate">{model}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                {brandLabel && (
                                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${brandColor}`}>
                                                        {brandLabel}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                    {formatCategory(product.category)}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <p className="text-xs font-medium text-slate-900">₹{product.price.toLocaleString('en-IN')}</p>
                                                {product.mrp && product.mrp > product.price && (
                                                    <p className="text-[10px] text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`text-xs font-medium ${
                                                    product.stock <= 0 ? 'text-red-600' :
                                                    product.stock < 10 ? 'text-amber-600' : 'text-green-600'
                                                }`}>
                                                    {product.stock}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <button
                                                    onClick={() => toggleVisibility(product.id, product.is_active)}
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                                        product.is_active
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {product.is_active ? 'Visible' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/admin/products/${product.id}?fromCategory=${activeFilter}`}
                                                        className="p-1.5 text-slate-400 hover:text-aqua-600 hover:bg-aqua-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="h-3.5 w-3.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, id: product.id, name: product.name })}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {paginatedProducts.map(product => {
                        const img = product.images && product.images.length > 0 ? product.images[0] : null;
                        const brandLabel = getBrandLabel(product);
                        const brandDef = BRANDS.find(br => br.value === (product.brand || product.specifications?.brand));

                        return (
                            <div key={product.id} className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${!product.is_active ? 'opacity-60' : ''}`}>
                                {/* Image */}
                                <div className="relative aspect-square bg-slate-50">
                                    {img ? (
                                        <img src={img} alt={product.name} className="w-full h-full object-contain p-3"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
                                            </svg>
                                        </div>
                                    )}
                                    {brandDef && brandDef.value !== 'generic' && (
                                        <span className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: brandDef.color }}>
                                            {brandLabel}
                                        </span>
                                    )}
                                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                                </div>

                                {/* Content */}
                                <div className="p-2.5 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-slate-900 leading-snug line-clamp-2">{product.name}</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-sm font-bold text-green-600">₹{product.price.toLocaleString('en-IN')}</span>
                                        {product.mrp && product.mrp > product.price && (
                                            <span className="text-[10px] text-slate-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-medium ${
                                            product.stock <= 0 ? 'text-red-500' :
                                            product.stock < 10 ? 'text-amber-500' : 'text-green-500'
                                        }`}>
                                            Stock: {product.stock}
                                        </span>
                                        <span className="text-[9px] px-1 py-0.5 bg-slate-100 text-slate-500 rounded">
                                            {formatCategory(product.category)}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 pt-1">
                                        <Link
                                            href={`/admin/products/${product.id}?fromCategory=${activeFilter}`}
                                            className="flex-1 text-center text-[10px] font-medium py-1 bg-aqua-50 text-aqua-700 rounded hover:bg-aqua-100 transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setDeleteModal({ open: true, id: product.id, name: product.name })}
                                            className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                        >
                                            <TrashIcon className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Page {currentPage} of {totalPages} • {filteredProducts.length} products
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page: number;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`min-w-[28px] h-7 text-xs font-medium rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-aqua-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, id: null, name: '' })}
                onConfirm={() => deleteModal.id && deleteProduct(deleteModal.id)}
                title="Delete Product"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
}
