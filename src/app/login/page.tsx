'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import LegalModal from '@/components/ui/LegalModal';
import { LegalContent } from '@/data/legalContent';

interface ConfirmationResult {
  confirm: (verificationCode: string) => Promise<any>;
  verificationId?: string;
}

type ViewState = 'login' | 'signup';
type SignupStep = 'phone' | 'otp' | 'details';

const AUTH_DOMAIN = 'karthiktraders.com';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { signInWithOTP } = useAuth();

  // View & Step State
  const [view, setView] = useState<ViewState>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('phone');

  // Handle URL params for tab switching
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setView('signup');
    }
  }, [searchParams]);

  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Legal & Modals State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<'terms' | 'privacy' | 'refund' | null>(null);
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false);

  // Process State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Timer State for OTP
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'signup' && signupStep === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [view, signupStep, timer]);

  // Helpers
  const formatPhone = (phone: string) => {
    const normalized = phone.replace(/\D/g, '').slice(-10);
    return `+91${normalized}`;
  };

  const getUserFriendlyError = (err: any): string => {
    const message = err?.message || '';
    if (message.includes('reCAPTCHA') || message.includes('app-not-authorized')) {
      return 'Verification service temporarily unavailable. Please try again.';
    }
    if (message.includes('too-many-requests') || message.includes('TOO_MANY_ATTEMPTS')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (message.includes('invalid-phone-number') || message.includes('INVALID_PHONE_NUMBER')) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    if (message.includes('network-request-failed')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('quota-exceeded')) {
      return 'SMS service quota exceeded. Please contact support or try again later.';
    }
    if (message.includes('invalid-verification-code') || message.includes('code-expired')) {
      return 'Invalid or expired OTP. Please check and try again.';
    }
    if (message.includes('Invalid login credentials')) {
      return 'Invalid mobile number or password.';
    }
    if (message.includes('Firebase') || message.includes('auth/') || message.length > 120) {
      return 'Authentication service error. Please try again.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  // --- LOGIN FLOW ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalized = phoneNumber.replace(/\D/g, '').slice(-10);
    if (!normalized || normalized.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }

    try {
      let emailToUse = '';
      let expectedRole = '';

      try {
        const checkRes = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: normalized }),
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists && checkData.email) {
            emailToUse = checkData.email;
            expectedRole = checkData.role;
          } else if (checkData.exists) {
            expectedRole = checkData.role;
          }
        }
      } catch (checkErr) {
        console.error('Check user error:', checkErr);
      }

      let loginSuccess = false;
      let finalAuthData: any = null;
      let finalError: any = null;

      if (emailToUse) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });
        if (!error) {
          loginSuccess = true;
          finalAuthData = data;
        } else {
          finalError = error;
        }
      }

      if (!loginSuccess) {
        const primaryEmail = `91${normalized}@${AUTH_DOMAIN}`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: primaryEmail,
          password,
        });
        if (!error) {
          loginSuccess = true;
          finalAuthData = data;
        } else {
          const legacyEmail = `${normalized}@${AUTH_DOMAIN}`;
          const { data: legacyData, error: legacyError } = await supabase.auth.signInWithPassword({
            email: legacyEmail,
            password,
          });
          if (!legacyError) {
            loginSuccess = true;
            finalAuthData = legacyData;
          } else {
            finalError = legacyError;
          }
        }
      }

      if (!loginSuccess || !finalAuthData) {
        const errMsg = finalError?.message === 'Invalid login credentials'
          ? 'Invalid mobile number or password.'
          : (finalError?.message || 'Invalid credentials. Please try again.');
        setError(errMsg);
        setLoading(false);
        return;
      }

      // Check role
      let userRole = expectedRole;
      if (!userRole) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', finalAuthData.user?.id)
          .maybeSingle();
        if (profile?.role) userRole = profile.role;
      }

      if (userRole === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP FLOW STEP 1: SEND OTP ---
  const handleSignupSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-10);
      if (cleanDigits.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      const formattedPhone = `+91${cleanDigits}`;

      // Check if user already exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: formattedPhone }),
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setLoading(false);
        setShowAlreadyRegistered(true);
        return;
      }

      // User does NOT exist -> send OTP via Firebase Phone Auth
      const result = await signInWithOTP(formattedPhone);
      setConfirmationResult(result);
      setSignupStep('otp');
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

  // --- SIGNUP FLOW STEP 2: VERIFY OTP ---
  const handleSignupVerifyOTP = async (e: React.FormEvent) => {
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
      // OTP verified successfully! Proceed to Details step
      setSignupStep('details');
    } catch (err: any) {
      setError(getUserFriendlyError(err) || 'Invalid OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP FLOW STEP 3: CREATE ACCOUNT ---
  const handleSignupCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!fullName.trim()) {
        throw new Error('Full name is required.');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      if (!termsAccepted) {
        throw new Error('You must accept the Terms & Conditions.');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Phone verification expired. Please verify OTP again.');
      }

      const idToken = await currentUser.getIdToken();

      // Call backend API to create Supabase user safely
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          password,
          fullName: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account.');
      }

      // Sync session to Supabase client
      if (data.session) {
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        if (sessionError) throw sessionError;
      }

      router.push(redirectUrl);
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Already Registered Modal
  if (showAlreadyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFB] px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border border-[#E3E8F0] text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 text-[#0B1A33] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#0B1A33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0B1A33] font-poppins mb-2">
            Already Registered
          </h2>
          <p className="text-sm text-[#5B6880] mb-6">
            The mobile number <span className="font-mono font-bold text-[#0B1A33]">+91 {phoneNumber}</span> is already registered. Please sign in with your password.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                setShowAlreadyRegistered(false);
                setView('login');
                setError('');
              }}
              className="w-full h-12 rounded-full bg-[#0B1A33] text-white font-extrabold text-sm hover:bg-[#1E293B] transition-colors shadow-xs cursor-pointer"
            >
              Sign In Now
            </button>
            <button
              onClick={() => setShowAlreadyRegistered(false)}
              className="w-full h-12 rounded-full border border-[#D5DCE8] text-[#5B6880] font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Change Mobile Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      <main className="max-w-[500px] sm:max-w-[520px] mx-auto px-4 sm:px-6 pt-10 md:pt-16">
        <div className="rounded-[32px] bg-white border border-[#E3E8F0] p-6 sm:p-10 shadow-sm flex flex-col gap-6">
          {/* Tablist Switcher */}
          <div className="relative grid grid-cols-2 p-1 rounded-full bg-[#EEF2F8] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setView('login');
                setError('');
              }}
              className={`relative h-11 rounded-full font-extrabold text-sm transition-all cursor-pointer ${
                view === 'login'
                  ? 'bg-white text-[#0B1A33] shadow-xs'
                  : 'text-[#5B6880] hover:text-[#0B1A33]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setView('signup');
                setSignupStep('phone');
                setError('');
              }}
              className={`relative h-11 rounded-full font-extrabold text-sm transition-all cursor-pointer ${
                view === 'signup'
                  ? 'bg-white text-[#0B1A33] shadow-xs'
                  : 'text-[#5B6880] hover:text-[#0B1A33]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins">
              {view === 'login'
                ? 'Welcome Back'
                : signupStep === 'phone'
                ? 'Create Account'
                : signupStep === 'otp'
                ? 'Verify Mobile Number'
                : 'Setup Profile & Password'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6880] mt-1 font-medium">
              {view === 'login'
                ? 'Enter your mobile number and password to access your orders.'
                : signupStep === 'phone'
                ? 'Enter your mobile number to receive a one-time verification code.'
                : signupStep === 'otp'
                ? `We sent a 6-digit OTP code to +91 ${phoneNumber}`
                : 'Create your credentials to finish setting up your account.'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F4] border border-[#F5C2CF] text-[#B4123A] text-xs font-bold leading-relaxed">
              {error}
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Mobile Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-mobile" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#0B1A33] focus-within:bg-white transition-colors">
                  <span className="font-mono text-sm font-bold text-[#5B6880] pr-2.5 border-r border-[#D5DCE8]">
                    +91
                  </span>
                  <input
                    id="auth-mobile"
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    placeholder="10-digit mobile number"
                    className="flex-1 min-w-0 pl-3 border-0 outline-none bg-transparent font-mono text-base font-bold text-[#0B1A33] tracking-wide"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-pw" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-sky-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#0B1A33] focus-within:bg-white transition-colors">
                  <input
                    id="auth-pw"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm font-medium text-[#0B1A33]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-extrabold text-[#5B6880] hover:text-[#0B1A33] cursor-pointer ml-2"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-13 rounded-full bg-[#0B1A33] hover:bg-[#1E293B] text-white font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In to Dashboard'}
              </button>
            </form>
          )}

          {/* ================= SIGNUP FLOW ================= */}
          {view === 'signup' && (
            <div>
              {/* STEP 1: Enter Phone Number */}
              {signupStep === 'phone' && (
                <form onSubmit={handleSignupSendOTP} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-phone" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#0B1A33] focus-within:bg-white transition-colors">
                      <span className="font-mono text-sm font-bold text-[#5B6880] pr-2.5 border-r border-[#D5DCE8]">
                        +91
                      </span>
                      <input
                        id="signup-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder="10-digit mobile number"
                        className="flex-1 min-w-0 pl-3 border-0 outline-none bg-transparent font-mono text-base font-bold text-[#0B1A33] tracking-wide"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-13 rounded-full bg-[#0B1A33] hover:bg-[#1E293B] text-white font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>
                </form>
              )}

              {/* STEP 2: Enter OTP */}
              {signupStep === 'otp' && (
                <form onSubmit={handleSignupVerifyOTP} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="signup-otp" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                        6-Digit OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSignupStep('phone');
                          setError('');
                        }}
                        className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      id="signup-otp"
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="h-14 px-4 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] text-center font-mono text-2xl font-bold tracking-[0.5em] text-[#0B1A33] outline-none focus:border-[#0B1A33] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#5B6880] px-1 font-medium">
                    <span>Didn&apos;t receive OTP?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="font-bold text-sky-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <span className="font-mono text-[#5B6880]">
                        Resend in <strong className="text-[#0B1A33]">{timer}s</strong>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="mt-2 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Verifying OTP...' : 'Verify & Continue'}
                  </button>
                </form>
              )}

              {/* STEP 3: Enter Details & Password */}
              {signupStep === 'details' && (
                <form onSubmit={handleSignupCreateAccount} className="flex flex-col gap-4">
                  {/* Verified Phone indicator */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Verified: <strong>+91 {phoneNumber}</strong></span>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-700">Verified</span>
                  </div>

                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-name" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Reddy"
                      className="h-12 px-4 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none focus:border-[#0B1A33] focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Set Password */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-pw" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                      Set Password
                    </label>
                    <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#0B1A33] focus-within:bg-white transition-colors">
                      <input
                        id="signup-pw"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="flex-1 min-w-0 border-0 outline-none bg-transparent text-sm font-medium text-[#0B1A33]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-xs font-extrabold text-[#5B6880] hover:text-[#0B1A33] cursor-pointer ml-2"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="signup-cpw" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#0B1A33] focus-within:bg-white transition-colors">
                      <input
                        id="signup-cpw"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
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

                  {/* Terms & Policies Checkbox */}
                  <label className="flex items-start gap-2.5 text-xs text-[#3D4A63] font-medium leading-relaxed mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0B1A33] accent-[#0B1A33] mt-0.5 cursor-pointer"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setActiveLegalDoc('terms')}
                        className="text-sky-700 font-bold underline cursor-pointer"
                      >
                        Terms & Conditions
                      </button>
                      ,{' '}
                      <button
                        type="button"
                        onClick={() => setActiveLegalDoc('refund')}
                        className="text-sky-700 font-bold underline cursor-pointer"
                      >
                        Refund Policy
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => setActiveLegalDoc('privacy')}
                        className="text-sky-700 font-bold underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>.
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-13 rounded-full bg-[#0B1A33] hover:bg-[#1E293B] text-white font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* reCAPTCHA Container required for Firebase Phone Auth */}
          <div id="recaptcha-container"></div>

          <div className="pt-2 border-t border-[#EEF2F8] text-center text-xs text-[#5B6880] font-medium">
            Need assistance? Call Karthik directly on{' '}
            <a href="tel:+918688566023" className="text-sky-700 font-bold">
              +91 86885 66023
            </a>
          </div>
        </div>
      </main>

      {/* Legal Modals */}
      <LegalModal
        isOpen={!!activeLegalDoc}
        onClose={() => setActiveLegalDoc(null)}
        title={
          activeLegalDoc === 'terms'
            ? 'Terms & Conditions'
            : activeLegalDoc === 'privacy'
            ? 'Privacy Policy'
            : activeLegalDoc === 'refund'
            ? 'Refund Policy'
            : ''
        }
        content={activeLegalDoc ? LegalContent[activeLegalDoc] : null}
      />
    </div>
  );
}
