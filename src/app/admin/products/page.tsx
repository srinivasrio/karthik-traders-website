"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlusIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    mrp: number | null;
    stock: number;
    is_active: boolean;
}

const categoryFilters = [
    { id: 'all', label: 'All', categories: [] },
    { id: 'aerators', label: 'Aerators', categories: ['aerators'] },
    { id: 'motors', label: 'Motors', categories: ['motors'] },
    { id: 'gearboxes', label: 'Gearboxes', categories: ['gearboxes'] },
    { id: 'spares', label: 'Spares', categories: ['spares'] },
    { id: 'long-arm', label: 'Long Arm', categories: ['long-arm'] },
];

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [editingStock, setEditingStock] = useState<string | null>(null);
    const [newStock, setNewStock] = useState<number>(0);
    const [editingStatus, setEditingStatus] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState<boolean>(true);
    const [sortBy, setSortBy] = useState<string>('name-asc');

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        let filtered = products;

        // Apply category filter
        const filter = categoryFilters.find(f => f.id === activeFilter);
        if (filter && filter.categories.length > 0) {
            filtered = filtered.filter(p => filter.categories.includes(p.category));
        }

        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'stock-low':
                    return a.stock - b.stock;
                case 'stock-high':
                    return b.stock - a.stock;
                default:
                    return 0;
            }
        });

        setFilteredProducts(filtered);
    }, [searchQuery, products, activeFilter, sortBy]);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, slug, category, price, mrp, stock, is_active')
                .order('category')
                .order('name');

            if (error) throw error;
            setProducts(data || []);
            setFilteredProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            alert('Error deleting product: ' + error.message);
        } else {
            fetchProducts();
        }
    };

    const startEditStatus = (id: string, currentStatus: boolean) => {
        setEditingStatus(id);
        setNewStatus(currentStatus);
    };

    const saveStatus = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: newStatus })
            .eq('id', id);

        if (error) {
            alert('Error updating status: ' + error.message);
        } else {
            setEditingStatus(null);
            fetchProducts();
        }
    };

    const startEditStock = (id: string, currentStock: number) => {
        setEditingStock(id);
        setNewStock(currentStock);
    };

    const saveStock = async (id: string) => {
        const { error } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', id);

        if (error) {
            alert('Error updating stock: ' + error.message);
        } else {
            setEditingStock(null);
            fetchProducts();
        }
    };

    const formatCategory = (category: string) => {
        return category.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <div className="px-2 sm:px-4">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Products</h1>
                    <p className="mt-1 text-xs text-slate-600">
                        {filteredProducts.length} products in catalog
                    </p>
                </div>
                <div className="mt-3 sm:mt-0">
                    <div className="mt-3 sm:mt-0">
                        {/* Add Product Removed */}
                    </div>
                </div>
            </div>

            {/* Search Box and Sort */}
            <div className="mt-4 flex gap-3">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 bg-white transition-all duration-200 hover:border-aqua-400"
                >
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="stock-low">Stock: Low to High</option>
                    <option value="stock-high">Stock: High to Low</option>
                </select>
            </div>

            {/* Category Filter Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
                {categoryFilters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${activeFilter === filter.id
                            ? 'bg-aqua-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-sm'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Products Table */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase">Name</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase">Category</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase">Price</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase">Stock</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-slate-600 uppercase">Visibility</th>
                                <th className="px-3 py-2 text-right text-[10px] font-semibold text-slate-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">Loading...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                                        {searchQuery ? 'No products match your search.' : 'No products found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2">
                                            <p className="text-xs font-medium text-slate-900 truncate max-w-[200px]">
                                                {product.name}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                {formatCategory(product.category)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <p className="text-xs text-slate-900">₹{product.price}</p>
                                            {product.mrp && product.mrp > product.price && (
                                                <p className="text-[10px] text-slate-400 line-through">₹{product.mrp}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {editingStock === product.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={newStock}
                                                        onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                                                        className="w-16 px-1.5 py-0.5 text-xs border border-slate-300 rounded"
                                                        min="0"
                                                    />
                                                    <button
                                                        onClick={() => saveStock(product.id)}
                                                        className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingStock(null)}
                                                        className="text-[10px] px-1.5 py-0.5 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEditStock(product.id, product.stock)}
                                                    className="flex items-center gap-1 text-xs text-slate-900 hover:text-aqua-600"
                                                >
                                                    <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : ''}`}>
                                                        {product.stock}
                                                    </span>
                                                    <PencilIcon className="h-3 w-3 text-slate-400" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {editingStatus === product.id ? (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={newStatus ? 'active' : 'out'}
                                                        onChange={(e) => setNewStatus(e.target.value === 'active')}
                                                        className="px-1.5 py-0.5 text-xs border border-slate-300 rounded"
                                                    >
                                                        <option value="active">Visible</option>
                                                        <option value="out">Hidden</option>
                                                    </select>
                                                    <button
                                                        onClick={() => saveStatus(product.id)}
                                                        className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700 transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingStatus(null)}
                                                        className="text-[10px] px-1.5 py-0.5 bg-slate-300 text-slate-700 rounded hover:bg-slate-400 transition-all duration-200 hover:scale-105 active:scale-95"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEditStatus(product.id, product.is_active)}
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${product.is_active
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {product.is_active ? 'Visible' : 'Hidden'}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Link
                                                href={`/admin/products/${product.id}`}
                                                className="text-[10px] text-aqua-600 hover:text-aqua-800 mr-2"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => deleteProduct(product.id)}
                                                className="text-[10px] text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
