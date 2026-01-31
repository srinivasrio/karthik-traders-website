
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    ShoppingBagIcon,
    UserGroupIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';


function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState({
        totalOrders: 0,
        customers: 0,
        pendingOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Total Orders
                const { count: totalOrders } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true });

                // 2. Fetch Customers (Profiles with role customer)
                const { count: customers } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'customer');

                // 3. Fetch Pending Orders
                const { count: pendingOrders } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                setDashboardStats({
                    totalOrders: totalOrders || 0,
                    customers: customers || 0,
                    pendingOrders: pendingOrders || 0
                });

                // 4. Fetch Recent Orders
                const { data: orders } = await supabase
                    .from('orders')
                    .select(`
                        id, 
                        order_number, 
                        customer_name, 
                        total_amount, 
                        status, 
                        created_at
                    `)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setRecentOrders(orders || []);

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statsData = [
        { name: 'Total Orders', stat: dashboardStats.totalOrders.toString(), icon: ShoppingBagIcon },
        { name: 'Customers', stat: dashboardStats.customers.toString(), icon: UserGroupIcon },
        { name: 'Pending Orders', stat: dashboardStats.pendingOrders.toString(), icon: ClockIcon },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aqua-600"></div>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-lg leading-6 font-medium text-slate-900">Overview</h3>

            <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {statsData.map((item) => (
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
                        {recentOrders.length === 0 ? (
                            <li className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-slate-500 truncate">No recent orders</p>
                                </div>
                            </li>
                        ) : (
                            recentOrders.map((order) => (
                                <li key={order.id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold text-aqua-600 truncate">
                                                Order #{order.order_number || order.id.slice(0, 8)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {order.customer_name} • ₹{Number(order.total_amount).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                <div className="mt-4 text-right">
                    <Link href="/admin/orders" className="text-sm font-medium text-aqua-600 hover:text-aqua-500 transition-colors">
                        View all orders &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
