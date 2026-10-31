'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ViewState = 'login' | 'signup';

const AUTH_DOMAIN = 'karthiktraders.com';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { signInWithOTP } = useAuth();

  const [view, setView] = useState<ViewState>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setView('signup');
    }
  }, [searchParams]);

  const formatPhone = (phone: string) => {
    const normalized = phone.replace(/\D/g, '').slice(-10);
    return `+91${normalized}`;
  };

  const getEmail = (phone: string) => {
    return `${formatPhone(phone).replace('+', '')}@${AUTH_DOMAIN}`;
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
          }
        }
      } catch (checkErr) {
        console.error('Check user error:', checkErr);
      }

      let loginSuccess = false;
      let finalError: any = null;

      if (emailToUse) {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });
        if (!error) loginSuccess = true;
        else finalError = error;
      }

      if (!loginSuccess) {
        const fallbackEmail = getEmail(normalized);
        const { error } = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password,
        });
        if (!error) loginSuccess = true;
        else finalError = error;
      }

      if (loginSuccess) {
        router.push(redirectUrl);
      } else {
        throw finalError || new Error('Invalid mobile number or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP FLOW ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalized = phoneNumber.replace(/\D/g, '').slice(-10);
    if (normalized.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }
    if (!fullName.trim()) {
      setError('Full name is required.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions.');
      setLoading(false);
      return;
    }

    try {
      const email = getEmail(normalized);
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            mobile: `+91${normalized}`,
          },
        },
      });

      if (signupError) throw signupError;

      // Automatically sign in if account created
      if (data?.session) {
        router.push(redirectUrl);
      } else {
        // Fallback login
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInErr) {
          router.push(redirectUrl);
        } else {
          setView('login');
          setError('Account created! Please log in with your mobile & password.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                {view === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              {view === 'signup' && (
                <p className="text-xs sm:text-sm text-[#5B6880] mt-1 font-medium">
                  Join to track dispatches, manage pond setups, and view wholesale rates.
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-[#FFF1F4] border border-[#F5C2CF] text-[#B4123A] text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-4">
              {view === 'signup' && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-name" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Reddy"
                    className="h-12 px-4 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none focus:border-[#4338CA] focus:bg-white transition-colors"
                  />
                </div>
              )}

              {/* Mobile Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-mobile" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#4338CA] focus-within:bg-white transition-colors">
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
                  {view === 'login' && (
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-[#4338CA] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] focus-within:border-[#4338CA] focus-within:bg-white transition-colors">
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

              {/* Terms Checkbox for Signup */}
              {view === 'signup' && (
                <label className="flex items-start gap-2.5 text-xs text-[#3D4A63] font-medium leading-relaxed mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B1A33] accent-[#0B1A33] mt-0.5 cursor-pointer"
                  />
                  <span>
                    I agree to Karthik Traders{' '}
                    <Link href="/terms-conditions" className="text-[#4338CA] font-bold underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy-policy" className="text-[#4338CA] font-bold underline">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-13 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? 'Please wait...'
                  : view === 'login'
                  ? 'Sign In to Dashboard'
                  : 'Create Account'}
              </button>
            </form>

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
