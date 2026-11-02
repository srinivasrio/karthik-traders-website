"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
interface ConfirmationResult {
  confirm: (verificationCode: string) => Promise<any>;
}
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  useEffect(() => {
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
    const normalized = phone.replace(/\D/g, '').slice(-10);
    return `+91${normalized}`;
  };

  // Helper: Convert technical errors to user-friendly messages
  const getUserFriendlyError = (err: any): string => {
    const message = err?.message || '';

    if (message.includes('reCAPTCHA')) {
      return 'Verification service temporarily unavailable. Please try again.';
    }
    if (message.includes('too-many-requests') || message.includes('TOO_MANY_ATTEMPTS')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (message.includes('invalid-phone-number')) {
      return 'Please enter a valid 10-digit mobile number.';
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
      const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
      if (cleanDigits.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      const formattedPhone = `+91${cleanDigits}`;

      // 1. Check if user exists in DB
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formattedPhone }),
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setLoading(false);
        setShowNotRegistered(true);
        return;
      }

      // 2. User exists -> Proceed with OTP
      const result = await signInWithOTP(formattedPhone);
      setConfirmationResult(result);
      setStep('otp');
      setTimer(60);
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

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.');
      setLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      setStep('reset');
    } catch (err: any) {
      setError(getUserFriendlyError(err) || 'Invalid OTP. Please check and try again.');
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
        throw new Error('Password must be at least 8 characters long');
      }
      if (newPassword !== confirmNewPassword) {
        throw new Error('Passwords do not match');
      }

      const user = auth.currentUser;

      if (!user) throw new Error('Authentication failed. Please verify OTP again.');

      const idToken = await user.getIdToken();

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      setStep('success');
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // --- SUCCESS VIEW ---
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24 pt-10 md:pt-16 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-[500px] sm:max-w-[520px] w-full rounded-[32px] bg-white border border-[#E3E8F0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center gap-6">
          <div className="relative w-20 h-20 rounded-full bg-[#E8F9FF] border border-[#C4D9FF] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[#0B1A33]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins">
              Password Reset Successful!
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6880] mt-2 font-medium">
              Your password has been updated. You can now log in to your account with your new credentials.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base transition-colors shadow-xs flex items-center justify-center cursor-pointer"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // --- NOT REGISTERED MODAL VIEW ---
  if (showNotRegistered) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24 pt-10 md:pt-16 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-[500px] sm:max-w-[520px] w-full rounded-[32px] bg-white border border-[#E3E8F0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center gap-6">
          <div className="w-18 h-18 rounded-full bg-[#FFF1F4] border border-[#F5C2CF] flex items-center justify-center">
            <svg
              className="w-9 h-9 text-[#B4123A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins">
              Number Not Registered
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6880] mt-2 font-medium">
              The mobile number <span className="font-mono font-bold text-[#0B1A33]">+91 {phoneNumber.replace(/\D/g, '').slice(-10)}</span> is not registered with Karthik Traders.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/login"
              className="w-full h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base transition-colors shadow-xs flex items-center justify-center cursor-pointer"
            >
              Create New Account
            </Link>

            <button
              type="button"
              onClick={() => setShowNotRegistered(false)}
              className="w-full h-12 rounded-full border border-[#D5DCE8] hover:border-[#0B1A33] hover:text-[#0B1A33] text-[#5B6880] font-bold text-sm transition-colors cursor-pointer"
            >
              Try Different Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      {/* Overlay Loading Screen */}
      {loading && <SimpleLoadingScreen />}

      <main className="max-w-[500px] sm:max-w-[520px] mx-auto px-4 sm:px-6 pt-10 md:pt-16">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6880] hover:text-[#0B1A33] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Login
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-[32px] bg-white border border-[#E3E8F0] p-6 sm:p-10 shadow-sm flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins">
              Forgot Password
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6880] mt-1 font-medium">
              {step === 'phone' && 'Enter your 10-digit mobile number to receive a verification OTP.'}
              {step === 'otp' && `Enter the 6-digit OTP sent to +91 ${phoneNumber.replace(/\D/g, '').slice(-10)}`}
              {step === 'reset' && 'Set a new secure password with at least 8 characters.'}
            </p>
          </div>

          {/* Firebase Recaptcha Container */}
          <div id="recaptcha-container" />

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F4] border border-[#F5C2CF] text-[#B4123A] text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {/* STEP 1: PHONE FORM */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fp-phone" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#4338CA] focus-within:bg-white transition-colors">
                  <span className="font-mono text-sm font-bold text-[#5B6880] pr-2.5 border-r border-[#D5DCE8]">
                    +91
                  </span>
                  <input
                    id="fp-phone"
                    type="tel"
                    maxLength={10}
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="flex-1 min-w-0 pl-3 border-0 outline-none bg-transparent font-mono text-base font-bold text-[#0B1A33] tracking-wide"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
                className="mt-2 h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* STEP 2: OTP FORM */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="fp-otp" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                    }}
                    className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                  >
                    Change number
                  </button>
                </div>
                <input
                  id="fp-otp"
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="h-14 text-center font-mono text-2xl font-extrabold tracking-[0.35em] rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] text-[#0B1A33] focus:border-[#4338CA] focus:bg-white transition-colors outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="mt-2 h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend || loading}
                  className={`text-xs font-bold ${
                    canResend ? 'text-[#4338CA] hover:underline cursor-pointer' : 'text-[#8A96A6] cursor-not-allowed'
                  }`}
                >
                  {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD FORM */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fp-new-pw" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                  New Password
                </label>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#4338CA] focus-within:bg-white transition-colors">
                  <input
                    id="fp-new-pw"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm font-medium text-[#0B1A33]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-xs font-extrabold text-[#5B6880] hover:text-[#0B1A33] cursor-pointer ml-2"
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fp-confirm-pw" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#4338CA] focus-within:bg-white transition-colors">
                  <input
                    id="fp-confirm-pw"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm font-medium text-[#0B1A33]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-xs font-extrabold text-[#5B6880] hover:text-[#0B1A33] cursor-pointer ml-2"
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmNewPassword}
                className="mt-2 h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Footer Assistance */}
          <div className="pt-2 border-t border-[#EEF2F8] text-center text-xs text-[#5B6880] font-medium">
            Need assistance? Call Karthik directly on{' '}
            <a href="tel:+918688566023" className="text-[#4338CA] font-bold">
              +91 86885 66023
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
