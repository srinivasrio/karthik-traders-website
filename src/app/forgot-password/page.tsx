"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Step = 'phone' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { signInWithOTP } = useAuth();

    // State
    const [step, setStep] = useState<Step>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Process State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Helper
    const formatPhone = (phone: string) => {
        let p = phone.trim();
        if (!p.startsWith('+')) p = '+91' + p;
        return p;
    };

    // Helper: Convert technical errors to user-friendly messages
    const getUserFriendlyError = (err: any): string => {
        const message = err?.message || '';

        // Firebase/reCAPTCHA errors
        if (message.includes('reCAPTCHA')) {
            return 'Verification service temporarily unavailable. Please try again.';
        }
        if (message.includes('too-many-requests') || message.includes('TOO_MANY_ATTEMPTS')) {
            return 'Too many attempts. Please wait a few minutes and try again.';
        }
        if (message.includes('invalid-phone-number')) {
            return 'Please enter a valid phone number.';
        }
        if (message.includes('network-request-failed')) {
            return 'Network error. Please check your connection and try again.';
        }
        if (message.includes('quota-exceeded')) {
            return 'Service temporarily unavailable. Please try again later.';
        }
        if (message.includes('app-not-verified')) {
            return 'Verification service error. Please refresh and try again.';
        }

        // Return a generic message for unknown technical errors
        if (message.includes('Firebase') || message.includes('auth/') || message.length > 100) {
            return 'Something went wrong. Please try again.';
        }

        return message || 'An unexpected error occurred. Please try again.';
    };

    // --- STEP 1: SEND OTP ---
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formattedPhone = formatPhone(phoneNumber);
            const result = await signInWithOTP(formattedPhone);
            setConfirmationResult(result);
            setStep('otp');
        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: VERIFY OTP ---
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!confirmationResult) return;

        try {
            await confirmationResult.confirm(otp);
            // OTP Verified.
            setStep('reset');
        } catch (err: any) {
            setError(getUserFriendlyError(err) || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 3: RESET PASSWORD ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (newPassword.length < 8) {
                throw new Error("Password must be at least 8 characters long");
            }
            if (newPassword !== confirmNewPassword) {
                throw new Error("Passwords do not match");
            }

            // We need to update the password in Supabase.
            // Since we just verified the phone with Firebase, we know the user owns the phone.
            // But we need to use a server-side route to update the password for the Supabase user
            // associated with this phone number (via the Firebase ID Token we just got).

            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) throw new Error("Authentication failed");

            const idToken = await user.getIdToken();

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            // Success
            alert('Password reset successfully! Please login with your new password.');
            router.push('/login');

        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full mb-4">
                <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-aqua-600 transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Login
                </Link>
            </div>

            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        Forgot Password
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {step === 'phone' && "Enter your mobile number to reset password"}
                        {step === 'otp' && "Verify it's you"}
                        {step === 'reset' && "Set a new password"}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div id="recaptcha-container"></div>

                {/* STEP 1: PHONE */}
                {step === 'phone' && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium !text-black">Mobile Number</label>
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                placeholder="e.g. 9876543210"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-aqua-600 hover:bg-aqua-700 disabled:opacity-50"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium !text-black">Enter OTP sent to {phoneNumber}</label>
                            <input
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm tracking-widest text-center text-lg bg-white text-black"
                                placeholder="123456"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="text-xs text-slate-500 hover:text-slate-700"
                            >
                                Change Number
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {step === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium !text-black">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                placeholder="••••••••"
                            />
                            <p className="mt-1 text-xs text-slate-500">Min 8 characters</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium !text-black">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-aqua-600 hover:bg-aqua-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating Password...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
