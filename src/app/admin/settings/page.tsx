
"use client";

import { useAuth } from '@/context/AuthContext';

export default function AdminSettingsPage() {
    const { user, profile } = useAuth();

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">Settings</h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <a
                        href="/"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Back to Home
                    </a>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Admin Profile</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">Your specific account details.</p>
                </div>
                <div className="border-t border-slate-200">
                    <dl>
                        <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Full name</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{profile?.full_name}</dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Role</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2 capitalize">{profile?.role}</dd>
                        </div>
                        <div className="bg-slate-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-slate-500">Mobile</dt>
                            <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{profile?.mobile}</dd>
                        </div>

                    </dl>
                </div>
            </div>

        </div>

    );
}
