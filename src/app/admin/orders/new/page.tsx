"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    mrp: number;
    stock: number;
    category: string;
}

interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    stock: number;
}

// Category definitions for quick filters
const CATEGORIES = [
    { id: 'all', label: 'All Products' },
    { id: 'aerator-set', label: 'Aerator Sets' },
    { id: 'motor', label: 'Motors' },
    { id: 'worm-gearbox', label: 'Worm Gearbox' },
    { id: 'bevel-gearbox', label: 'Bevel Gearbox' },
    { id: 'motor-cover', label: 'Motor Cover' },
    { id: 'float', label: 'Floats' },
    { id: 'fan', label: 'Fans' },
    { id: 'frame', label: 'Frames' },
    { id: 'rod', label: 'Rods' },
    { id: 'kit-box', label: 'Kit Box' },
    { id: 'long-arm-gearbox', label: 'Long Arm Gearbox' },
    { id: 'long-arm-spare', label: 'Long Arm Spares' },
];

export default function NewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showCategoryProducts, setShowCategoryProducts] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [formData, setFormData] = useState({
        customerMobile: '',
        customerName: '',
        notes: ''
    });

    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [existingCustomer, setExistingCustomer] = useState<{ id: string; full_name: string } | null>(null);
    const [checkingCustomer, setCheckingCustomer] = useState(false);

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, slug, price, mrp, stock, category')
            .eq('is_active', true)
            .order('name');

        if (!error && data) {
            setProducts(data);
            setFilteredProducts(data);
        }
    };

    // Check if customer exists when mobile changes
    const checkCustomer = async (mobile: string) => {
        if (mobile.length < 10) {
            setExistingCustomer(null);
            return;
        }

        setCheckingCustomer(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('mobile', mobile)
            .single();

        if (!error && data) {
            setExistingCustomer(data);
            setFormData(prev => ({ ...prev, customerName: data.full_name || '' }));
        } else {
            setExistingCustomer(null);
        }
        setCheckingCustomer(false);
    };

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setFormData(prev => ({ ...prev, customerMobile: value }));
        if (value.length === 10) {
            checkCustomer(value);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        setShowProductDropdown(true);
        filterProducts(query, selectedCategory);
    };

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        filterProducts(searchQuery, categoryId);
        setShowProductDropdown(true);
        setShowCategoryProducts(true); // Show products when category is clicked
    };

    const filterProducts = (query: string, category: string) => {
        let filtered = products;

        // Filter by category first
        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }

        // Then filter by search query
        if (query) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.slug.toLowerCase().includes(query)
            );
        }

        setFilteredProducts(filtered);
    };

    const addProduct = (product: Product) => {
        // Check if already added
        if (orderItems.find(item => item.product_id === product.id)) {
            alert('Product already added. Update quantity instead.');
            return;
        }

        setOrderItems(prev => [...prev, {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            price: product.price,
            stock: product.stock
        }]);

        setSearchQuery('');
        setShowProductDropdown(false);
        setShowCategoryProducts(false); // Hide dropdown after adding
    };

    const updateQuantity = (productId: string, delta: number) => {
        setOrderItems(prev => prev.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock));
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setOrderItems(prev => prev.filter(item => item.product_id !== productId));
    };

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerMobile || formData.customerMobile.length < 10) {
            alert('Please enter a valid mobile number');
            return;
        }

        if (orderItems.length === 0) {
            alert('Please add at least one product');
            return;
        }

        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Please login again');
                router.push('/login');
                return;
            }

            const response = await fetch('/api/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    customerMobile: formData.customerMobile,
                    customerName: formData.customerName,
                    items: orderItems.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    totalAmount,
                    notes: formData.notes
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            alert(data.message || 'Order created successfully!');
            router.push('/admin/orders');
        } catch (err: any) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/orders" className="text-slate-500 hover:text-slate-700">
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900">Create New Order</h1>
                    <p className="text-sm text-slate-500">Create an order for a customer using their mobile number</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl">
                {/* Customer Details */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-medium text-slate-900 mb-4">Customer Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Mobile Number *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">+91</span>
                                <input
                                    type="text"
                                    value={formData.customerMobile}
                                    onChange={handleMobileChange}
                                    placeholder="Enter 10 digit mobile"
                                    className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                                    maxLength={10}
                                    required
                                />
                            </div>
                            {checkingCustomer && (
                                <p className="text-xs text-slate-400 mt-1">Checking customer...</p>
                            )}
                            {existingCustomer && (
                                <p className="text-xs text-green-600 mt-1">
                                    ✓ Existing customer: {existingCustomer.full_name}
                                </p>
                            )}
                            {formData.customerMobile.length === 10 && !existingCustomer && !checkingCustomer && (
                                <p className="text-xs text-amber-600 mt-1">
                                    New customer - order will be linked when they register
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                value={formData.customerName}
                                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                placeholder="Enter customer name"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any special instructions or notes..."
                            rows={2}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                        />
                    </div>
                </div>

                {/* Product Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <h2 className="text-lg font-medium text-slate-900 mb-4">Products</h2>

                    {/* Category Filters */}
                    <div className="mb-4">
                        <p className="text-sm font-medium text-slate-600 mb-2">Quick Categories:</p>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedCategory === cat.id
                                        ? 'bg-aqua-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {cat.label}
                                    {selectedCategory === cat.id && cat.id !== 'all' && (
                                        <span className="ml-1">({filteredProducts.length})</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search Products */}
                    <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => setShowProductDropdown(true)}
                            placeholder="Search products to add..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                        />

                        {/* Dropdown - show when searching OR when any category is clicked */}
                        {(showProductDropdown && searchQuery) || showCategoryProducts ? (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-3 text-sm text-slate-500">No products found</div>
                                ) : (
                                    filteredProducts.slice(0, 10).map(product => (
                                        <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => addProduct(product)}
                                            className="w-full px-4 py-2 text-left hover:bg-slate-50 flex justify-between items-center border-b last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{product.name}</p>
                                                <p className="text-xs text-slate-500">Stock: {product.stock}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">₹{product.price}</p>
                                                <PlusIcon className="w-4 h-4 text-aqua-500 ml-auto" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : null}
                    </div>

                    {/* Order Items */}
                    {orderItems.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <p>No products added yet</p>
                            <p className="text-sm">Search and add products above</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orderItems.map(item => (
                                <div
                                    key={item.product_id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                                        <p className="text-xs text-slate-500">₹{item.price} each</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.product_id, -1)}
                                                className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                                            >
                                                -
                                            </button>
                                            <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(item.product_id, 1)}
                                                className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="w-20 text-right text-sm font-semibold">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.product_id)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex justify-between items-center text-lg font-semibold">
                        <span>Total Amount</span>
                        <span className="text-aqua-600">₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link
                        href="/admin/orders"
                        className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || orderItems.length === 0}
                        className="flex-1 px-6 py-3 bg-aqua-600 text-white rounded-lg font-semibold hover:bg-aqua-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Order...' : 'Create Order'}
                    </button>
                </div>
            </form>
        </div>
    );
}
