
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ViewState = 'login' | 'signup';
type SignupStep = 'phone' | 'otp' | 'details';

const AUTH_DOMAIN = 'karthiktraders.com';

export default function LoginPage() {
    const router = useRouter();
    const { signInWithOTP } = useAuth(); // Use context for firebase phone auth

    // View State
    const [view, setView] = useState<ViewState>('login');
    const [signupStep, setSignupStep] = useState<SignupStep>('phone');

    // Form State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Process State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Helpers
    const formatPhone = (phone: string) => {
        let p = phone.trim();
        if (!p.startsWith('+')) p = '+91' + p;
        return p;
    };

    const getEmail = (phone: string) => {
        return `${formatPhone(phone).replace('+', '')}@${AUTH_DOMAIN}`;
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
        if (message.includes('Invalid login credentials')) {
            return 'Invalid phone number or password.';
        }

        // Return a generic message for unknown technical errors
        if (message.includes('Firebase') || message.includes('auth/') || message.length > 100) {
            return 'Something went wrong. Please try again.';
        }

        return message || 'An unexpected error occurred. Please try again.';
    };

    // --- LOGIN FLOW ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const email = getEmail(phoneNumber);
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                // Handle auth errors without console.error
                setError(error.message === 'Invalid login credentials'
                    ? 'Invalid phone number or password'
                    : error.message);
                setLoading(false);
                return;
            }



            router.push('/dashboard');
        } catch (err: any) {
            // Only catch unexpected errors
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    // --- SIGNUP FLOW ---
    const handleSignupSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formattedPhone = formatPhone(phoneNumber);
            const result = await signInWithOTP(formattedPhone);
            setConfirmationResult(result);
            setSignupStep('otp');
        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSignupVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!confirmationResult) return;

        try {
            await confirmationResult.confirm(otp);
            // OTP Verified, move to details
            setSignupStep('details');
        } catch (err: any) {
            setError(getUserFriendlyError(err) || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignupCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validation
            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters long");
            }
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }
            if (!termsAccepted) {
                throw new Error("You must accept the Terms & Conditions and Privacy Policy");
            }

            // Get Firebase ID Token
            if (!confirmationResult || !confirmationResult.verificationId) throw new Error("Session expired");

            // Note: firebaseUser is available in auth instance, but confirmationResult doesn't give it directly after confirm in v9 modular style easily without result.user
            // But we can get current user from auth
            // Actually, confirm() returns UserCredential which has .user
            // We need to re-confirm or if we are already signed in to Firebase?
            // The previous step `confirmationResult.confirm(otp)` verified it and signed the user into FIREBASE.
            // So `auth.currentUser` should be set. 
            // We need to pass the ID Token.

            // However, since we defined `handleSignupVerifyOTP` separately, we need to access the user.
            // But `confirm` was called in previous step.
            // Let's get the token from the context or auth instance?
            // `useAuth` exposes `firebaseUser`.

            // Wait, we need the token.
            // Let's assume the user is signed in to Firebase now.
            // We need to import `auth` to get currentUser if context doesn't update fast enough, 
            // but context `firebaseUser` should be there. 

            // Actually, simpler: pass the `idToken` from the verify step? 
            // No, state separation.
            // Let's use the `auth` import directly to be sure.

            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) throw new Error("Phone verification failed or expired");

            const idToken = await user.getIdToken();

            // Call API
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    password,
                    fullName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            }

            // Sync session to client supbase
            const { error: sessionError } = await supabase.auth.setSession(data.session);
            if (sessionError) throw sessionError;

            router.push('/dashboard');

        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full mb-4">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-aqua-600 transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </Link>
            </div>
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900">
                        {view === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {view === 'login'
                            ? 'Sign in to access your dashboard'
                            : 'Join Karthik Traders today'}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* LOGIN VIEW */}
                {view === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-6">
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
                        <div>
                            <label className="block text-sm font-medium !text-black">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-sm font-medium text-aqua-600 hover:text-aqua-500">
                                Forgot Password?
                            </Link>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-aqua-600 hover:bg-aqua-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aqua-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => { setView('signup'); setSignupStep('phone'); setError(''); }}
                                className="text-sm font-medium text-aqua-600 hover:text-aqua-500"
                            >
                                Don't have an account? Sign Up
                            </button>
                        </div>
                    </form>
                )}

                {/* SIGNUP VIEW */}
                {view === 'signup' && (
                    <div className="space-y-6">
                        {/* Step 1: Phone */}
                        {signupStep === 'phone' && (
                            <form onSubmit={handleSignupSendOTP} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium !text-black">Mobile Number (Verification)</label>
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
                                    {loading ? 'Sending OTP...' : 'Get OTP'}
                                </button>
                            </form>
                        )}

                        {/* Step 2: OTP */}
                        {signupStep === 'otp' && (
                            <form onSubmit={handleSignupVerifyOTP} className="space-y-6">
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
                                        onClick={() => setSignupStep('phone')}
                                        className="text-xs text-slate-500 hover:text-slate-700"
                                    >
                                        Change Number
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Details */}
                        {signupStep === 'details' && (
                            <form onSubmit={handleSignupCreateAccount} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium !text-black">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium !text-black">Set Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium !text-black">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-aqua-500 focus:border-aqua-500 sm:text-sm bg-white text-black"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="terms"
                                            name="terms"
                                            type="checkbox"
                                            required
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="focus:ring-aqua-500 h-4 w-4 text-aqua-600 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="terms" className="font-medium text-slate-700">
                                            I agree to the{' '}
                                            <a href="/terms-conditions" target="_blank" className="text-aqua-600 hover:text-aqua-500">
                                                Terms & Conditions
                                            </a>
                                            ,{' '}
                                            <a href="/refund-policy" target="_blank" className="text-aqua-600 hover:text-aqua-500">
                                                Refund Policy
                                            </a>
                                            {' '}and{' '}
                                            <a href="/privacy-policy" target="_blank" className="text-aqua-600 hover:text-aqua-500">
                                                Privacy Policy
                                            </a>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-aqua-600 hover:bg-aqua-700 disabled:opacity-50"
                                >
                                    {loading ? 'Creating Account...' : 'Complete Sign Up'}
                                </button>
                            </form>
                        )}

                        <div className="mt-4 text-center border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => { setView('login'); setError(''); }}
                                className="text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                                Already have an account? Login
                            </button>
                        </div>
                    </div>
                )}

                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}
