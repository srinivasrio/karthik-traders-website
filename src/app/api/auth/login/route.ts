
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDerivedEmail, generateDerivedPassword } from '@/lib/server-auth';

// Initialize Supabase Admin Client
// We need Service Role Key to bypass email confirmation for new users
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ message: 'Missing ID Token' }, { status: 400 });
        }

        // 1. Verify Firebase ID Token via Google Identity Toolkit
        // We use the API Key from environment variables
        const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        if (!firebaseApiKey) {
            throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");
        }

        const verificationUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
        const verificationResponse = await fetch(verificationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        const verificationData = await verificationResponse.json();

        if (!verificationResponse.ok || !verificationData.users || verificationData.users.length === 0) {
            console.error('Firebase verification failed:', verificationData);
            return NextResponse.json({ message: 'Invalid ID Token' }, { status: 401 });
        }

        const firebaseUser = verificationData.users[0];
        const phone = firebaseUser.phoneNumber;

        if (!phone) {
            return NextResponse.json({ message: 'Phone number not found in token' }, { status: 400 });
        }

        // 2. Derive Credentials
        const email = generateDerivedEmail(phone);
        const password = generateDerivedPassword(phone);

        // 3. Initialize Supabase Client
        // Use Service Role if available for admin tasks, otherwise Anon (might fail for signup if confirm required)
        const supabaseAdmin = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })
            : null;

        // Client for signing in (Anon key is fine for signIn)
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

        // 4. Attempt Sign In
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (signInData.session) {
            return NextResponse.json({ session: signInData.session });
        }

        // 5. If Sign In failed, attempt Sign Up or Update Password

        // Attempt to handle via Admin Client
        if (supabaseAdmin) {
            // Check if user exists by looking up their profile using mobile number
            // Since we link mobile in profiles, this is a reliable way to find the auth user id
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('mobile', phone)
                .single();

            if (profile && profile.id) {
                // User exists, so password must be wrong (e.g. secret rotated). Update it.
                await supabaseAdmin.auth.admin.updateUserById(profile.id, { password });
            } else {
                // User likely doesn't exist (or profile missing), try creating new user
                const { error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { mobile: phone, firebase_uid: firebaseUser.localId }
                });

                // If createUser fails with existing email but no profile found, we might need to handle edge case
                // But relying on profile lookup is generally correct for this system
                if (createError) {
                    // Fallback: If create error says "email already registered", try listUsers to find ID?
                    // For now, throw to see error
                    throw createError;
                }
            }
        } else {
            // Fallback to Anon Key SignUp (Will send confirmation email if enabled)
            // This is not ideal for Phone Auth bridge.
            const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { mobile: phone, firebase_uid: firebaseUser.localId }
                }
            });

            if (signUpError) throw signUpError;
            // If session is null, it means email confirmation is active
            if (!signUpData.session) {
                return NextResponse.json({
                    message: 'Account created. Please verify your email if required, or contact support.',
                    details: 'Missing Service Role Key'
                }, { status: 403 });
            }
        }

        // 6. Final Sign In to get session
        const { data: finalSession, error: finalError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (finalError) throw finalError;

        return NextResponse.json({ session: finalSession.session });

    } catch (error: any) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
