import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/loyalty';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_PHONES = ['+918688566023', '+916301183738', '+919515816084', '8688566023', '6301183738', '9515816084'];

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: customerId } = await params;

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
        }

        // 1. Verify Caller is Admin via Bearer token / cookies / JWT decode fallback / Firebase bridge
        const authResult = await getAuthenticatedUser(request);
        if (!authResult) {
            return NextResponse.json({ error: 'Invalid or expired session. Please sign in again.' }, { status: 401 });
        }

        if (!authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
        }

        // 2. Fetch the target customer profile
        const { data: targetProfile, error: targetError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', customerId)
            .maybeSingle();

        if (targetError || !targetProfile) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // 3. Prevent deleting admins or owner accounts
        if (targetProfile.role === 'admin' || ADMIN_PHONES.some(p => targetProfile.mobile?.includes(p.replace(/\D/g, '').slice(-10)))) {
            return NextResponse.json({ error: 'Cannot delete an administrator account.' }, { status: 400 });
        }

        // 4. Detach customer from historical orders so invoice and accounting records remain intact
        await supabaseAdmin
            .from('orders')
            .update({ user_id: null, referred_by: null })
            .or(`user_id.eq.${customerId},referred_by.eq.${customerId}`);

        // 5. Clean up referral relationships in profiles and referrals table
        await supabaseAdmin
            .from('profiles')
            .update({ referred_by: null })
            .eq('referred_by', customerId);

        try {
            await supabaseAdmin
                .from('referrals')
                .delete()
                .or(`referrer_id.eq.${customerId},referred_id.eq.${customerId}`);
        } catch (e) {
            console.warn('[Delete Customer API] Referrals cleanup note:', e);
        }

        // 6. Clean up loyalty wallet and transactions
        try {
            await supabaseAdmin
                .from('loyalty_transactions')
                .delete()
                .eq('user_id', customerId);
            await supabaseAdmin
                .from('loyalty_wallets')
                .delete()
                .eq('user_id', customerId);
        } catch (e) {
            console.warn('[Delete Customer API] Loyalty cleanup note:', e);
        }

        // 7. Delete from public.profiles
        const { error: deleteProfileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', customerId);

        if (deleteProfileError) {
            console.error('[Delete Customer API] Profiles delete failed:', deleteProfileError);
            return NextResponse.json({ error: deleteProfileError.message }, { status: 500 });
        }

        // 8. Delete from auth.users via Supabase Auth Admin API
        try {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(customerId);
            if (deleteAuthError) {
                console.warn('[Delete Customer API] auth.users delete warning (may have cascaded already):', deleteAuthError.message);
            }
        } catch (e) {
            console.warn('[Delete Customer API] auth.users delete note:', e);
        }

        return NextResponse.json({
            success: true,
            message: `Customer ${targetProfile.full_name || targetProfile.mobile} has been permanently deleted from database and website.`
        });

    } catch (err: any) {
        console.error('[Delete Customer API] Unexpected error:', err);
        return NextResponse.json({ error: err.message || 'Failed to delete customer' }, { status: 500 });
    }
}
