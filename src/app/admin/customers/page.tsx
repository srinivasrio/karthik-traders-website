"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PhoneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Profile {
    id: string;
    full_name: string;
    mobile: string;
    role: string;
    created_at: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Profile[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
                        filteredCustomers.map((person) => (
                            <Link
                                key={person.id}
                                href={`/admin/customers/${person.id}`}
                                className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-aqua-400 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-9 w-9 rounded-full bg-aqua-100 flex items-center justify-center text-aqua-700 font-bold text-sm">
                                            {person.full_name ? person.full_name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {person.full_name || 'Unnamed User'}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <PhoneIcon className="h-3 w-3" /> {person.mobile}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${person.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {person.role}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
