"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PhoneIcon, MagnifyingGlassIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Profile {
    id: string;
    full_name: string;
    mobile: string;
    role: string;
    created_at: string;
}

const ADMIN_PHONES = ['8688566023', '6301183738', '9515816084'];

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Profile[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Delete Modal State
    const [customerToDelete, setCustomerToDelete] = useState<Profile | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredCustomers(
                customers.filter(c =>
                    c.mobile?.toLowerCase().includes(query) ||
                    c.full_name?.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, customers]);

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
            setFilteredCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        setDeleteLoading(true);
        setDeleteError('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                throw new Error('Admin session expired. Please log in again.');
            }

            const response = await fetch(`/api/admin/customers/${customerToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete customer');
            }

            // Remove from local list
            setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            setFilteredCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
            setCustomerToDelete(null);
        } catch (err: any) {
            setDeleteError(err.message || 'Error deleting customer');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="px-2 sm:px-4">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
                    <p className="mt-1 text-xs text-slate-600">
                        {filteredCustomers.length} registered customers
                    </p>
                </div>
            </div>

            {/* Search Box */}
            <div className="mt-4">
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by mobile number or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500"
                    />
                </div>
            </div>

            {/* Customer Grid */}
            <div className="mt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                        <p className="col-span-3 text-center py-8 text-slate-500 text-sm">Loading...</p>
                    ) : filteredCustomers.length === 0 ? (
                        <p className="col-span-3 text-center py-8 text-slate-500 text-sm">
                            {searchQuery ? 'No customers match your search.' : 'No customers found.'}
                        </p>
                    ) : (
                        filteredCustomers.map((person) => {
                            const isPersonAdmin =
                                person.role === 'admin' ||
                                ADMIN_PHONES.some(p => person.mobile?.includes(p));

                            return (
                                <div
                                    key={person.id}
                                    className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-aqua-400 hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <Link
                                        href={`/admin/customers/${person.id}`}
                                        className="flex items-center space-x-3"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="h-9 w-9 rounded-full bg-aqua-100 flex items-center justify-center text-aqua-700 font-bold text-sm">
                                                {person.full_name ? person.full_name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-aqua-600 transition-colors">
                                                {person.full_name || 'Unnamed User'}
                                            </p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <PhoneIcon className="h-3 w-3" /> {person.mobile}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                                                person.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {person.role}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Action row */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <Link
                                            href={`/admin/customers/${person.id}`}
                                            className="text-slate-600 hover:text-aqua-600 font-medium"
                                        >
                                            View Details →
                                        </Link>

                                        {!isPersonAdmin && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setCustomerToDelete(person);
                                                    setDeleteError('');
                                                }}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
                                                title="Delete customer account"
                                            >
                                                <TrashIcon className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Delete Customer Confirmation Modal */}
            {customerToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <div className="p-2 rounded-full bg-red-100">
                                <ExclamationTriangleIcon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Delete Customer Account?
                            </h3>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Are you sure you want to permanently delete{' '}
                            <strong className="text-slate-900">{customerToDelete.full_name || 'this customer'}</strong> ({customerToDelete.mobile})?
                        </p>

                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] space-y-1">
                            <p className="font-bold">What will happen:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>The customer&apos;s login credentials and account will be removed immediately.</li>
                                <li>Their profile record in the database will be permanently deleted.</li>
                                <li>Past orders will be preserved for invoicing & record-keeping.</li>
                            </ul>
                        </div>

                        {deleteError && (
                            <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                {deleteError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={() => {
                                    setCustomerToDelete(null);
                                    setDeleteError('');
                                }}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={deleteLoading}
                                onClick={handleDeleteCustomer}
                                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                                {deleteLoading ? 'Deleting Account...' : 'Yes, Permanently Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
