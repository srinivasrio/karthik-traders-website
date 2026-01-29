
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CompleteProfilePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        // If profile has full_name, redirect to dashboard
        if (!authLoading && profile?.full_name) {
            router.push('/dashboard');
        }
    }, [user, profile, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!user) throw new Error('No user found');

            const updates = {
                full_name: fullName,
                // We might want to store email in profile too, or update auth user
                // For now, let's just update profile metadata
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Also update email in Auth if provided and different (requires confirmation usually, so maybe skip for now or do it carefully)
            // skipping auth email update for simplicity in this MVP step, relying on phone.

            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aqua-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
                        Complete your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Please tell us your name to continue.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="full-name" className="block text-sm font-medium text-black">Full Name</label>
                            <input
                                id="full-name"
                                name="full-name"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm mt-1"
                                placeholder="Ex. Karthik Kumar"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        {/* Optional Email Field - can be added later if needed for notifications */}
                        {/* 
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email (Optional)</label>
              <input
                 ...
              />
            </div> 
            */}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-aqua-600 hover:bg-aqua-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aqua-500 disabled:opacity-70"
                        >
                            {loading ? 'Saving...' : 'Continue to Dashboard'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
