import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Init Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const { idToken, newPassword } = await request.json();

        if (!idToken || !newPassword) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { message: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // 1. Verify Firebase Token
        // We need to verify the token to ensure the request comes from the owner of the phone number.
        // Similar to signup/login, we use the identity toolkit or just decode if we trust the simplified flow.
        // For robustness, we should verify it against Firebase Admin or Identity Toolkit endpoint.

        // Using Identity Toolkit REST API to verify token
        const firebaseVerifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;

        const firebaseResponse = await fetch(firebaseVerifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });

        const firebaseData = await firebaseResponse.json();

        if (!firebaseResponse.ok || !firebaseData.users || firebaseData.users.length === 0) {
            console.error('Firebase verification failed:', firebaseData);
            return NextResponse.json(
                { message: 'Invalid or expired session' },
                { status: 401 }
            );
        }

        const firebaseUser = firebaseData.users[0];
        const phoneNumber = firebaseUser.phoneNumber;

        if (!phoneNumber) {
            return NextResponse.json(
                { message: 'Phone number not found in token' },
                { status: 400 }
            );
        }

        // 2. Update Password in Supabase
        // We need to find the Supabase user with this phone number.
        // However, Supabase Auth doesn't expose "search by phone" easily in public API without admin.
        // We are using Admin client.

        // Wait, standard Supabase Auth updateUser requires User ID.
        // We need to find the user ID first.
        // We can look up in our 'users' or 'profiles' table if we store phone there.
        // Or cleaner: listUsers (admin) and filter? That's slow.

        // BETTER APPROACH:
        // We assume the Supabase user has the SAME phone number.
        // Is there a way to "get user by phone"? 
        // Admin API: listUsers({ phone: phoneNumber })? No, it's listUsers().

        // Alternative:
        // We have the `profiles` table which links `id` to `mobile`.
        // We can query `profiles` to get the user ID for this phone number.

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('mobile', phoneNumber)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { message: 'User not found in database' },
                { status: 404 }
            );
        }

        const userId = profile.id;

        // Now update the user's password using Admin Auth API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            console.error('Supabase password update error:', updateError);
            return NextResponse.json(
                { message: 'Failed to update password' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
