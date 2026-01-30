
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDerivedPassword } from '@/lib/server-auth';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Email domain - MUST match signup
const AUTH_DOMAIN = 'karthiktraders.com';

// Generate email in same format as signup
function generateDerivedEmail(phone: string): string {
    const cleanPhone = phone.replace('+', '');
    return `${cleanPhone}@${AUTH_DOMAIN}`;
}

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ message: 'Missing ID Token' }, { status: 400 });
        }

        // 1. Verify Firebase ID Token
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

        // 2. Derive email (using same format as signup)
        const email = generateDerivedEmail(phone);
        const derivedPassword = generateDerivedPassword(phone);

        // 3. Initialize Supabase Clients
        const supabaseAdmin = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })
            : null;

        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

        // 4. Check if user exists and get their info
        if (supabaseAdmin) {
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                // User exists - they should use their password, not OTP for login
                // OTP is for signup/password reset only
                // Return a helpful message directing them to use password
                return NextResponse.json({
                    message: 'Account exists. Please use your password to login, or use "Forgot Password" to reset it.',
                    userExists: true
                }, { status: 200 });
            } else {
                // User doesn't exist - this is OTP-based first login (pre-signup flow)
                // Create user with derived password, they'll set real password in signup step
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: derivedPassword,
                    email_confirm: true,
                    user_metadata: { mobile: phone, firebase_uid: firebaseUser.localId }
                });

                if (createError) {
                    // If user already exists (race condition), handle gracefully
                    if (createError.message?.includes('already been registered')) {
                        return NextResponse.json({
                            message: 'Account exists. Please use your password to login.',
                            userExists: true
                        }, { status: 200 });
                    }
                    throw createError;
                }

                // Create profile for the new user
                await supabaseAdmin.from('profiles').insert({
                    id: newUser.user.id,
                    mobile: phone,
                    role: 'customer'
                });

                // Sign in with derived password to get session
                const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password: derivedPassword,
                });

                if (signInError) throw signInError;

                return NextResponse.json({
                    session: signInData.session,
                    isNewUser: true
                });
            }
        } else {
            // Fallback without admin client - try sign in with derived password
            const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                email,
                password: derivedPassword,
            });

            if (signInData.session) {
                return NextResponse.json({ session: signInData.session });
            }

            // If sign in fails and no admin client, can't create user
            return NextResponse.json({
                message: 'Account not found or incorrect credentials. Please sign up first.',
            }, { status: 401 });
        }

    } catch (error: any) {
        console.error('Auth API Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
