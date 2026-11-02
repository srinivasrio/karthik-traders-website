import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

        // 1. Verify Caller is Admin via Bearer token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !callerUser) {
            return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
        }

        // Verify caller admin role
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role, mobile')
            .eq('id', callerUser.id)
            .single();

        const isCallerAdmin =
            callerProfile?.role === 'admin' ||
            ADMIN_PHONES.some(p => callerProfile?.mobile?.includes(p.replace(/\D/g, '').slice(-10)));

        if (!isCallerAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
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

        // 4. Detach customer_id from any orders before profile deletion (orders keep historical invoice info)
        await supabaseAdmin
            .from('orders')
            .update({ user_id: null })
            .eq('user_id', customerId);

        // 5. Delete from public.profiles
        const { error: deleteProfileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', customerId);

        if (deleteProfileError) {
            console.error('[Delete Customer API] Profiles delete failed:', deleteProfileError);
            return NextResponse.json({ error: deleteProfileError.message }, { status: 500 });
        }

        // 6. Delete from auth.users via Supabase Auth Admin API
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(customerId);
        if (deleteAuthError) {
            console.warn('[Delete Customer API] auth.users delete warning (may have cascaded already):', deleteAuthError.message);
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
