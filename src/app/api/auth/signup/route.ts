
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

// Email domain for phone-based auth
const AUTH_DOMAIN = 'karthiktraders.com';

export async function POST(request: Request) {
    console.log('[Signup API] Request Received');
    try {
        const body = await request.json();
        const { idToken, password, fullName, referralCode } = body;
        console.log('[Signup API] Payload parsed. Has Token:', !!idToken, 'Has Password:', !!password, 'ReferralCode:', referralCode || 'none');

        if (!idToken || !password || !fullName) {
            console.error('[Signup API] Missing required fields');
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (!supabaseServiceKey) {
            console.error('[Signup API] Missing SUPABASE_SERVICE_ROLE_KEY');
            return NextResponse.json({ message: 'Server Configuration Error (Missing Service Key)' }, { status: 500 });
        }

        // 1. Verify Firebase ID Token
        console.log('[Signup API] Verifying Firebase Token...');
        const verificationUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
        const verificationResponse = await fetch(verificationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        const verificationData = await verificationResponse.json();

        if (!verificationResponse.ok || !verificationData.users || verificationData.users.length === 0) {
            console.error('[Signup API] Firebase Verification Failed:', verificationData);
            return NextResponse.json({ message: 'Invalid ID Token' }, { status: 401 });
        }

        const firebaseUser = verificationData.users[0];
        const phone = firebaseUser.phoneNumber;
        console.log('[Signup API] Verified Phone:', phone);

        if (!phone) {
            return NextResponse.json({ message: 'Phone number not found in token' }, { status: 400 });
        }

        // 2. Initialize Supabase Admin
        console.log('[Signup API] Initializing Supabase Admin...');
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 3. Create User in Supabase
        const email = `${phone.replace('+', '')}@${AUTH_DOMAIN}`; // e.g. 919876543210@karthiktraders.com

        // Check if user already exists
        console.log('[Signup API] Checking if user exists in profiles...');
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('mobile', phone)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = JSON object requested but no result found
            console.error('[Signup API] Error checking profile:', checkError);
        }

        console.log('[Signup API] Existing User Check Result:', existingUser);

        let userId = existingUser?.id;

        if (userId) {
            console.log('[Signup API] User already exists.');
            return NextResponse.json({ message: 'User already exists. Please login.' }, { status: 409 });
        } else {
            console.log('[Signup API] Creating new user...');
            // Create new user
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // Auto-confirm since phone is verified via Firebase
                user_metadata: {
                    mobile: phone,
                    full_name: fullName,
                    firebase_uid: firebaseUser.localId
                }
            });

            if (createError) {
                console.error('[Signup API] Create User Failed:', createError);
                throw createError;
            }
            console.log('[Signup API] User Created:', newUser.user.id);
            userId = newUser.user.id;

            // Check if a referral code was provided
            let referrer: { id: string; full_name: string; mobile: string; referral_code: string } | null = null;
            const cleanRefCode = referralCode ? String(referralCode).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

            if (cleanRefCode) {
                try {
                    const { data: refData } = await supabaseAdmin
                        .from('profiles')
                        .select('id, full_name, mobile, referral_code')
                        .or(`referral_code.eq.${cleanRefCode},referral_code.ilike.${cleanRefCode}`)
                        .maybeSingle();

                    // Check that referrer is found and not the same mobile number
                    if (refData && refData.mobile !== phone) {
                        referrer = refData;
                        console.log('[Signup API] Referrer identified:', referrer.id, referrer.referral_code);
                    }
                } catch (refErr) {
                    console.warn('[Signup API] Referrer check error:', refErr);
                }
            }

            // Generate neat personal referral code: KT + cleanName + 4Digits (no hyphens, no special characters, no spaces)
            const cleanName = (fullName || 'FARMER')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6) || 'FARMER';
            const phoneDigits = phone.replace(/\D/g, '').slice(-4) || '1000';
            let newReferralCode = `KT${cleanName}${phoneDigits}`;

            try {
                const { data: codeConflict } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('referral_code', newReferralCode)
                    .maybeSingle();

                if (codeConflict) {
                    newReferralCode = `KT${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
                }
            } catch (confErr) {
                console.warn('[Signup API] Referral code collision check warning:', confErr);
            }

            // Ensure profile exists for the new user with neat referral code and referrer linkage
            try {
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    mobile: phone,
                    full_name: fullName,
                    role: 'customer',
                    referral_code: newReferralCode,
                    referred_by: referrer ? referrer.id : null,
                    referral_count: 0
                }, { onConflict: 'id' });
                console.log('[Signup API] Profile created with referral code:', newReferralCode);
            } catch (err) {
                console.error('[Signup API] Profile upsert error:', err);
            }

            // Record referral ledger entry if referred by someone
            if (referrer) {
                try {
                    await supabaseAdmin.from('referrals').insert({
                        referrer_id: referrer.id,
                        referred_id: userId,
                        referral_code: referrer.referral_code,
                        status: 'pending',
                        points_awarded: 0,
                        discount_given: 0
                    });
                    console.log('[Signup API] Recorded pending referral in referrals ledger for referrer:', referrer.id);
                } catch (refInsertErr) {
                    console.warn('[Signup API] Referral ledger insert error:', refInsertErr);
                }
            }

            // Automatically initialize loyalty wallet and award signup bonus points
            try {
                await supabaseAdmin.rpc('loyalty_init_wallet', { p_user_id: userId });
                console.log('[Signup API] Loyalty wallet initialized for user:', userId);
            } catch (loyaltyError) {
                console.warn('[Signup API] Loyalty wallet init warning (ignored if migration pending):', loyaltyError);
            }
        }

        // 4. Create/Return Session
        console.log('[Signup API] Signing in to get session...');
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password
        });

        if (sessionError) {
            console.error('[Signup API] Final SignIn Failed:', sessionError);
            throw sessionError;
        }

        console.log('[Signup API] Success! Returning session.');
        return NextResponse.json({ session: sessionData.session });

    } catch (error: any) {
        console.error('[Signup API] Internal Server Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
