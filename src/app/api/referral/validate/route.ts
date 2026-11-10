import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code')?.trim().toUpperCase();

        if (!code) {
            return NextResponse.json({ valid: false, message: 'Referral code is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // 1. Fetch referral settings
        const { data: settings } = await supabase
            .from('loyalty_settings')
            .select('referral_enabled, referral_discount_rupees, referral_bonus_points, referral_min_order_rupees')
            .limit(1)
            .maybeSingle();

        if (settings && !settings.referral_enabled) {
            return NextResponse.json({ valid: false, message: 'Referral program is currently not active.' }, { status: 400 });
        }

        const discountRupees = settings?.referral_discount_rupees ?? 500;
        const minOrderRupees = settings?.referral_min_order_rupees ?? 5000;

        // 2. Find referrer by referral_code
        const { data: referrer, error: refErr } = await supabase
            .from('profiles')
            .select('id, full_name, mobile, referral_code')
            .eq('referral_code', code)
            .maybeSingle();

        if (refErr || !referrer) {
            return NextResponse.json({ valid: false, message: 'Invalid referral code. Please check and try again.' }, { status: 404 });
        }

        // 3. Check caller identity if authenticated
        const authResult = await getAuthenticatedUser(request);
        if (authResult?.user) {
            const currentUserId = authResult.user.id;

            // Self-referral prevention
            if (currentUserId === referrer.id) {
                return NextResponse.json({
                    valid: false,
                    message: 'You cannot use your own referral code.'
                }, { status: 400 });
            }

            // First-time order prevention: check if user already has delivered or confirmed orders
            const { count: priorOrdersCount } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUserId)
                .in('status', ['confirmed', 'delivered', 'completed', 'shipped']);

            if (priorOrdersCount && priorOrdersCount > 0) {
                return NextResponse.json({
                    valid: false,
                    message: 'Referral discount is only available on your first equipment purchase.'
                }, { status: 400 });
            }
        }

        // Return valid response
        const referrerFirstName = (referrer.full_name || 'Aqua Farmer').split(' ')[0];

        return NextResponse.json({
            valid: true,
            code: referrer.referral_code,
            referrer_id: referrer.id,
            referrer_name: referrerFirstName,
            discount_rupees: discountRupees,
            min_order_rupees: minOrderRupees,
            message: `Referral code applied! You get flat ₹${discountRupees.toLocaleString()} OFF on your order of ₹${minOrderRupees.toLocaleString()}+ courtesy of ${referrerFirstName}.`
        });
    } catch (err: any) {
        console.error('API /referral/validate error:', err);
        return NextResponse.json({ valid: false, message: 'Error validating referral code' }, { status: 500 });
    }
}

