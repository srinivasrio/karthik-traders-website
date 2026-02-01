
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

        // Format phone number (ensure +91 prefix for consistency if stored that way)
        // Assuming database stores as '+919999999999' or similar. 
        // We will search exactly as provided by the client, so client handles formatting.

        // Check profiles table (assuming it's the source of truth for app users)
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('mobile', mobile)
            .maybeSingle();

        if (error) {
            console.error('Error checking user:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ exists: !!data });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
