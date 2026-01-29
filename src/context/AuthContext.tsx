
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    User as FirebaseUser,
    ConfirmationResult,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: SupabaseUser | null;
    profile: any | null;
    firebaseUser: FirebaseUser | null;
    session: Session | null;
    loading: boolean;
    signInWithOTP: (phone: string) => Promise<ConfirmationResult>;
    verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchProfile = async (userId: string) => {
        try {
            // Add timeout to prevent hanging (15 seconds)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('timeout')), 15000);
            });

            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                // Silent fail
                console.warn('Error fetching profile:', error.message);
                setProfile(null);
            } else {
                setProfile(data); // data will be null if no row found, which is what we want
            }
        } catch (err) {
            // Silent fail on timeout
            setProfile(null);
        }
    };

    useEffect(() => {
        // Check active Supabase session
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (err) {
                console.error('Session init error:', err);
                setSession(null);
                setUser(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        initSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Listen to Firebase auth state (mainly to sync or debug)
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setFirebaseUser(u);
        });
        return () => unsubscribe();
    }, []);

    const signInWithOTP = async (phone: string): Promise<ConfirmationResult> => {
        // Ensure recaptcha is set up
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
            });
        }
        const appVerifier = window.recaptchaVerifier;
        return await signInWithPhoneNumber(auth, phone, appVerifier);
    };

    const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
        setLoading(true);
        try {
            const result = await confirmationResult.confirm(otp);
            const firebaseUser = result.user;
            const idToken = await firebaseUser.getIdToken();

            // Exchange Firebase Token for Supabase Session via Server Action/API
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to authenticate with backend');
            }

            const { session } = await response.json();

            // Set Supabase session
            const { error } = await supabase.auth.setSession(session);
            if (error) throw error;

            // Fetch profile immediately after login
            if (session?.user) {
                console.log('Session user ID:', session.user.id);

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                console.log('Profile data:', profileData);
                console.log('Profile role:', profileData?.role);

                setProfile(profileData);

                if (profileData && !profileData.full_name) {
                    router.push('/complete-profile');
                } else if (profileData?.role === 'admin') {
                    console.log('Redirecting to /admin');
                    router.push('/admin');
                } else {
                    console.log('Redirecting to /dashboard');
                    router.push('/dashboard');
                }
            } else {
                router.push('/dashboard');
            }

        } catch (error) {
            console.error("Login verification failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        // Immediately clear all state and redirect (no waiting)
        setProfile(null);
        setSession(null);
        setUser(null);
        setFirebaseUser(null);
        setLoading(false);
        router.push('/');

        // Do async cleanup in background (don't await)
        firebaseSignOut(auth).catch(e => console.error("Firebase sign out error:", e));
        supabase.auth.signOut().catch(e => console.error("Supabase sign out error:", e));
    };

    return (
        <AuthContext.Provider value={{ user, profile, firebaseUser, session, loading, signInWithOTP, verifyOTP, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

// Add type definition for window
declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
