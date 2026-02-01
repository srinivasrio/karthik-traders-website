"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';

type Step = 'phone' | 'otp' | 'reset' | 'success';

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

    // Timer State
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Not Registered Modal State
    const [showNotRegistered, setShowNotRegistered] = useState(false);

    // Timer Effect
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

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
    // --- STEP 1: SEND OTP ---
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formattedPhone = formatPhone(phoneNumber);

            // 1. Check if user exists in DB
            const checkRes = await fetch('/api/auth/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: formattedPhone })
            });
            const checkData = await checkRes.json();

            if (!checkData.exists) {
                // User not found -> Show Custom Modal
                setLoading(false);
                setShowNotRegistered(true);
                return;
            }

            // 2. User exists -> Proceed with OTP
            const result = await signInWithOTP(formattedPhone);
            setConfirmationResult(result);
            setStep('otp');
            setTimer(60); // Reset timer
            setCanResend(false);
        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;
        setError('');
        setLoading(true);

        try {
            const formattedPhone = formatPhone(phoneNumber);
            const result = await signInWithOTP(formattedPhone);
            setConfirmationResult(result);
            setTimer(60);
            setCanResend(false);
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

            // Success - show animated success modal
            setStep('success');

        } catch (err: any) {
            setError(getUserFriendlyError(err));
        } finally {
            setLoading(false);
        }
    };


    // Success Modal with animated checkmark
    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
                    {/* Animated Checkmark Circle */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        {/* Outer ring animation */}
                        <div className="absolute inset-0 rounded-full border-4 border-green-100 animate-ping opacity-30"></div>
                        {/* Main circle */}
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 animate-[scaleIn_0.5s_ease-out]">
                            {/* Checkmark SVG with draw animation */}
                            <svg
                                className="w-12 h-12 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                style={{
                                    strokeDasharray: 50,
                                    strokeDashoffset: 0,
                                    animation: 'drawCheck 0.6s ease-out 0.3s both'
                                }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        Password Reset Successful!
                    </h2>
                    <p className="text-slate-600 mb-8">
                        Your password has been updated. Please login with your new password.
                    </p>

                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/25 active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Go to Login
                    </Link>
                </div>

                {/* CSS Animation for checkmark draw */}
                <style jsx>{`
                    @keyframes drawCheck {
                        0% {
                            stroke-dashoffset: 50;
                        }
                        100% {
                            stroke-dashoffset: 0;
                        }
                    }
                    @keyframes scaleIn {
                        0% {
                            transform: scale(0);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1.1);
                        }
                        100% {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
        );
    }

    // Not Registered Modal
    if (showNotRegistered) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center animate-[scaleIn_0.3s_ease-out]">

                    {/* Animated Warning Icon */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-yellow-100 animate-pulse"></div>
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                        Number Not Registered
                    </h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        This mobile number <span className="font-bold text-slate-800">{phoneNumber}</span> is not registered with Karthik Traders.
                    </p>

                    <div className="space-y-3">
                        <Link
                            href="/login?tab=signup"
                            className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-aqua-600 to-blue-600 text-white font-bold text-sm hover:from-aqua-700 hover:to-blue-700 transition-all shadow-lg shadow-aqua-500/25 active:scale-[0.98]"
                        >
                            Create New Account
                        </Link>

                        <button
                            onClick={() => setShowNotRegistered(false)}
                            className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                        >
                            Try Different Number
                        </button>
                    </div>
                </div>
                {/* Reusing existing animation styles */}
                <style jsx>{`
                    @keyframes scaleIn {
                        0% { transform: scale(0.9); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center bg-slate-50 px-4">
            {/* Overlay Loading Screen to prevent DOM Unmounting */}
            {loading && <SimpleLoadingScreen />}
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
                            Send OTP
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
                            Verify OTP
                        </button>
                        <div className="text-center space-y-3">
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={!canResend || loading}
                                className={`text-sm font-medium ${canResend
                                    ? 'text-aqua-600 hover:text-aqua-700 cursor-pointer'
                                    : 'text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
                            </button>

                            <div>
                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    Change Number
                                </button>
                            </div>
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
                            Reset Password
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
