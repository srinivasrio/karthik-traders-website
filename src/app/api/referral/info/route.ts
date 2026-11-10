import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';
import { ReferralDashboardData, ReferralItem } from '@/types/referral';

function maskMobile(mobile?: string): string {
    if (!mobile) return 'Farmer';
    const clean = mobile.replace(/\s+/g, '');
    if (clean.length < 8) return clean;
    const start = clean.slice(0, 4);
    const end = clean.slice(-3);
    return `${start}****${end}`;
}

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = authResult.user.id;
        const supabase = getSupabaseAdmin();

        // 1. Fetch user's profile to get referral code
        let { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('id, full_name, mobile, referral_code, referral_count')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
        }

        // If user doesn't have a referral code yet, generate one
        if (!profile.referral_code) {
            const cleanName = (profile.full_name || 'FARMER')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6) || 'FARMER';
            const digits = (profile.mobile || '').replace(/\D/g, '').slice(-4) || '1000';
            const generatedCode = `KT-${cleanName}-${digits}`;

            await supabase
                .from('profiles')
                .update({ referral_code: generatedCode })
                .eq('id', userId);

            profile.referral_code = generatedCode;
        }

        // 2. Fetch loyalty settings for referral configuration
        const { data: settings } = await supabase
            .from('loyalty_settings')
            .select('referral_enabled, referral_discount_rupees, referral_bonus_points, referral_min_order_rupees, paise_per_point')
            .limit(1)
            .maybeSingle();

        const isEnabled = settings?.referral_enabled ?? true;
        const discountRupees = settings?.referral_discount_rupees ?? 500;
        const bonusPoints = settings?.referral_bonus_points ?? 1000;
        const minOrderRupees = settings?.referral_min_order_rupees ?? 5000;
        const paisePerPoint = settings?.paise_per_point ?? 25;

        // 3. Fetch referrals where this user is the referrer
        const { data: rawReferrals } = await supabase
            .from('referrals')
            .select(`
                id,
                status,
                points_awarded,
                discount_given,
                created_at,
                awarded_at,
                order_id,
                orders (order_number, customer_name, customer_mobile),
                profiles:referred_id (full_name, mobile)
            `)
            .eq('referrer_id', userId)
            .order('created_at', { ascending: false });

        const referrals: ReferralItem[] = (rawReferrals || []).map((r: any) => {
            const referredName = r.orders?.customer_name || r.profiles?.full_name || 'Aqua Farmer';
            const rawPhone = r.orders?.customer_mobile || r.profiles?.mobile || '';
            const orderNum = r.orders?.order_number;

            return {
                id: r.id,
                referred_name: referredName,
                referred_mobile_masked: maskMobile(rawPhone),
                order_id: r.order_id,
                order_number: orderNum,
                status: r.status as 'pending' | 'completed' | 'cancelled',
                points_awarded: r.points_awarded || 0,
                discount_given: r.discount_given || 0,
                created_at: r.created_at,
                awarded_at: r.awarded_at,
            };
        });

        // 4. Calculate stats
        const completed = referrals.filter(r => r.status === 'completed');
        const pending = referrals.filter(r => r.status === 'pending');
        const totalPointsEarned = completed.reduce((sum, r) => sum + r.points_awarded, 0);
        const totalRupeeValue = Math.round((totalPointsEarned * paisePerPoint) / 100);

        const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://karthiktraders.in';
        const referralLink = `${host}/?ref=${encodeURIComponent(profile.referral_code)}`;

        const responseData: ReferralDashboardData = {
            referral_code: profile.referral_code,
            referral_link: referralLink,
            total_referrals: referrals.length,
            completed_referrals: completed.length,
            pending_referrals: pending.length,
            total_points_earned: totalPointsEarned,
            total_rupee_value: totalRupeeValue,
            discount_rupees: discountRupees,
            bonus_points: bonusPoints,
            min_order_rupees: minOrderRupees,
            is_enabled: isEnabled,
            referrals,
        };

        return NextResponse.json({ success: true, data: responseData });
    } catch (err: any) {
        console.error('API /referral/info error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}

