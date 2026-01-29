
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ShoppingBagIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const stats = [
    { name: 'Total Orders', stat: '0', icon: ShoppingBagIcon },
    { name: 'Customers', stat: '0', icon: UserGroupIcon },
    { name: 'Pending Orders', stat: '0', icon: ClockIcon },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    // Real stats state can be added here

    useEffect(() => {
        // Fetch stats logic (Mock for now to verify layout)
        setLoading(false);
    }, []);

    return (
        <div>
            <h3 className="text-lg leading-6 font-medium text-slate-900">Overview</h3>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.name} className="relative bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden border border-slate-100">
                        <dt>
                            <div className="absolute bg-aqua-500 rounded-md p-3">
                                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 text-sm font-medium text-slate-500 truncate">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline">
                            <p className="text-2xl font-semibold text-slate-900">{item.stat}</p>
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-8">
                <h2 className="text-lg leading-6 font-medium text-slate-900 mb-4">Recent Activity</h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-slate-100">
                    <ul role="list" className="divide-y divide-slate-200">
                        <li className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-aqua-600 truncate">No recent orders</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
