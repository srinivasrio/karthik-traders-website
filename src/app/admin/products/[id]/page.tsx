"use client";

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
    { value: 'aerators', label: 'Aerators' },
    { value: 'spares', label: 'Spares' },
    { value: 'motors', label: 'Motors' },
    { value: 'gearboxes', label: 'Gearboxes' },
    { value: 'long-arm', label: 'Long Arm' },
];

export default function EditProductPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading...</div>}>
            <EditProductContent />
        </Suspense>
    );
}

function EditProductContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const fromCategory = searchParams.get('fromCategory') || 'all';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category: 'aerators',
        price: '',
        mrp: '',
        stock: '',
        images: '',
        specifications: '',
        is_active: true
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        name: data.name || '',
                        slug: data.slug || '',
                        description: data.description || '',
                        category: data.category || 'aerators',
                        price: data.price?.toString() || '',
                        mrp: data.mrp?.toString() || '',
                        stock: data.stock?.toString() || '0',
                        images: Array.isArray(data.images) ? data.images.join(', ') : '',
                        specifications: data.specifications ? JSON.stringify(data.specifications, null, 2) : '',
                        is_active: data.is_active ?? true
                    });
                }
            } catch (error) {
                console.error("Error fetching product", error);
                alert('Error loading product');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Parse images as array
            const imagesArray = formData.images
                ? formData.images.split(',').map(url => url.trim()).filter(Boolean)
                : [];

            // Parse specifications as JSON
            let specificationsJson = null;
            if (formData.specifications) {
                try {
                    specificationsJson = JSON.parse(formData.specifications);
                } catch {
                    specificationsJson = { features: formData.specifications };
                }
            }

            const { error } = await supabase
                .from('products')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description || null,
                    category: formData.category,
                    price: parseFloat(formData.price),
                    mrp: formData.mrp ? parseFloat(formData.mrp) : null,
                    stock: parseInt(formData.stock) || 0,
                    images: imagesArray,
                    specifications: specificationsJson,
                    is_active: formData.is_active
                })
                .eq('id', id);

            if (error) throw error;

            const redirectUrl = fromCategory && fromCategory !== 'all'
                ? `/admin/products?category=${fromCategory}`
                : '/admin/products';

            router.push(redirectUrl);
        } catch (error: any) {
            console.error('Error updating product:', error);
            alert('Failed to update product: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading product...</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">Edit Product</h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Product Name *</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={handleNameChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Slug Input Removed */}

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700">Category *</label>
                    <div className="mt-1">
                        <select
                            name="category"
                            id="category"
                            required
                            value={formData.category}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-slate-700">Price (₹) *</label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="price"
                                id="price"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                className="focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="mrp" className="block text-sm font-medium text-slate-700">MRP (₹)</label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="mrp"
                                id="mrp"
                                min="0"
                                step="0.01"
                                value={formData.mrp}
                                onChange={handleChange}
                                className="focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-slate-700">Stock Quantity</label>
                    <div className="mt-1">
                        <input
                            type="number"
                            name="stock"
                            id="stock"
                            min="0"
                            value={formData.stock}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                        />
                    </div>
                </div>

                {/* Description Input Removed */}

                {/* Specifications Input Removed */}

                {/* Images Input Removed */}

                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="is_active"
                            name="is_active"
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="focus:ring-aqua-500 h-4 w-4 text-aqua-600 border-slate-300 rounded"
                        />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="is_active" className="font-medium text-slate-700">Active Product</label>
                        <p className="text-slate-500">Uncheck to hide from the store.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        href={fromCategory && fromCategory !== 'all' ? `/admin/products?category=${fromCategory}` : "/admin/products"}
                        className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-aqua-600 hover:bg-aqua-700 disabled:opacity-70"
                    >
                        {saving ? 'Saving...' : 'Update Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
