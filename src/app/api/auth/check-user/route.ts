
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client (Service Role) to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { mobile } = await request.json();

        if (!mobile) {
            return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
        }

        // Normalize mobile number: extract the last 10 digits
        const normalized = mobile.replace(/\D/g, '').slice(-10);
        console.log(`[CheckUser API] Incoming mobile: "${mobile}", Normalized to: "${normalized}"`);

        // Check profiles table (allowing both +91 prefixed and raw 10-digit stored format)
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('id, role, mobile')
            .or(`mobile.eq.+91${normalized},mobile.eq.${normalized}`)
            .maybeSingle();

        if (error) {
            console.error('[CheckUser API] Error querying profile:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!profile) {
            console.log(`[CheckUser API] No profile found for normalized number: "${normalized}"`);
            return NextResponse.json({ exists: false });
        }

        console.log(`[CheckUser API] Profile found: ID="${profile.id}", Role="${profile.role}", StoredMobile="${profile.mobile}"`);

        // Retrieve actual registered email from Supabase auth.users using service role client
        try {
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
            if (authError) {
                console.error(`[CheckUser API] Error fetching auth user for ID ${profile.id}:`, authError);
                // Fallback to true with role but no email
                return NextResponse.json({ exists: true, role: profile.role });
            }

            console.log(`[CheckUser API] Found auth user email: "${authUser.user?.email}"`);
            return NextResponse.json({
                exists: true,
                email: authUser.user?.email,
                role: profile.role
            });
        } catch (authFetchErr) {
            console.error('[CheckUser API] Exception fetching auth user:', authFetchErr);
            return NextResponse.json({ exists: true, role: profile.role });
        }

    } catch (err: any) {
        console.error('[CheckUser API] Exception in check-user route:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
