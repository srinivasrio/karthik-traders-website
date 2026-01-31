"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const CATEGORIES = [
    { value: 'aerator-set', label: 'Aerator Set' },
    { value: 'motor', label: 'Motor' },
    { value: 'worm-gearbox', label: 'Worm Gearbox' },
    { value: 'bevel-gearbox', label: 'Bevel Gearbox' },
    { value: 'long-arm-gearbox', label: 'Long Arm Gearbox' },
    { value: 'long-arm-spare', label: 'Long Arm Spare' },
    { value: 'kit-box', label: 'Kit Box' },
    { value: 'rod', label: 'Rod' },
    { value: 'frame', label: 'Frame' },
    { value: 'fan', label: 'Fan' },
    { value: 'float', label: 'Float' },
    { value: 'motor-cover', label: 'Motor Cover' },
];

export default function NewProductPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs">Loading...</div>}>
            <NewProductContent />
        </Suspense>
    );
}

function NewProductContent() {
    const searchParams = useSearchParams();
    const fromCategory = searchParams.get('fromCategory') || 'all';
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Auto-generate slug from name
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
        setLoading(true);

        try {
            if (!formData.name || !formData.price || !formData.slug) {
                alert('Please fill in required fields (Name, Price)');
                setLoading(false);
                return;
            }

            // Parse images as array (comma-separated URLs)
            const imagesArray = formData.images
                ? formData.images.split(',').map(url => url.trim()).filter(Boolean)
                : [];

            // Parse specifications as JSON
            let specificationsJson = null;
            if (formData.specifications) {
                try {
                    specificationsJson = JSON.parse(formData.specifications);
                } catch {
                    // If not valid JSON, treat as key-value pairs
                    specificationsJson = { features: formData.specifications };
                }
            }

            const { error } = await supabase.from('products').insert([
                {
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
                }
            ]);

            if (error) throw error;

            const redirectUrl = fromCategory && fromCategory !== 'all'
                ? `/admin/products?category=${fromCategory}`
                : '/admin/products';

            router.push(redirectUrl);
        } catch (error: any) {
            console.error('Error adding product:', error);
            alert('Failed to add product: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">Add New Product</h2>
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

                <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug (URL)</label>
                    <div className="mt-1">
                        <input
                            type="text"
                            name="slug"
                            id="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border bg-slate-50"
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Auto-generated from name. Used in URLs.</p>
                </div>

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

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                    <div className="mt-1">
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border border-slate-300 rounded-md p-2"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="specifications" className="block text-sm font-medium text-slate-700">Features / Specifications</label>
                    <div className="mt-1">
                        <textarea
                            id="specifications"
                            name="specifications"
                            rows={4}
                            placeholder='Enter features or JSON: {"power": "2HP", "warranty": "1 year"}'
                            value={formData.specifications}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border border-slate-300 rounded-md p-2"
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Enter as text or JSON format</p>
                </div>

                <div>
                    <label htmlFor="images" className="block text-sm font-medium text-slate-700">Image URLs</label>
                    <div className="mt-1">
                        <textarea
                            id="images"
                            name="images"
                            rows={2}
                            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                            value={formData.images}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-aqua-500 focus:border-aqua-500 block w-full sm:text-sm border-slate-300 rounded-md p-2 border"
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Comma-separated image URLs</p>
                </div>

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
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-aqua-600 hover:bg-aqua-700 disabled:opacity-70"
                    >
                        {loading ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
