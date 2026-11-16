import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const supabase = getSupabaseAdmin();

        const { data: referrals, error } = await supabase
            .from('referrals')
            .select(`
                id,
                referral_code,
                status,
                points_awarded,
                discount_given,
                created_at,
                awarded_at,
                order_id,
                referrer:profiles!referrals_referrer_id_fkey (id, full_name, mobile),
                referred:profiles!referrals_referred_id_fkey (id, full_name, mobile),
                order:orders!referrals_order_id_fkey (id, order_number, total_amount, status, referral_reward_status)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching admin referrals:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, referrals: referrals || [] });
    } catch (error: any) {
        console.error('API /admin/loyalty/referrals error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch referrals' },
            { status: 500 }
        );
    }
}
