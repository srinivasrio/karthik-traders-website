import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const url = new URL(request.url);
        const search = url.searchParams.get('q') || '';
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const offset = (page - 1) * limit;

        const supabase = getSupabaseAdmin();

        // Query profiles and their loyalty wallets
        let query = supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                mobile,
                role,
                created_at,
                loyalty_wallets(
                    id,
                    points_balance,
                    lifetime_earned_points,
                    lifetime_redeemed_points,
                    is_active,
                    updated_at
                )
            `, { count: 'exact' });

        if (search.trim()) {
            const cleanSearch = search.trim();
            query = query.or(`full_name.ilike.%${cleanSearch}%,mobile.ilike.%${cleanSearch}%`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, count, error } = await query;

        if (error) {
            // If loyalty_wallets table is not migrated yet, gracefully return profiles with 0 points
            if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('loyalty_wallets')) {
                const { data: profs, count: profCount } = await supabase
                    .from('profiles')
                    .select('id, full_name, mobile, role, created_at', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                const wallets = (profs || []).map((customer: any) => ({
                    userId: customer.id,
                    fullName: customer.full_name || 'Anonymous Customer',
                    mobile: customer.mobile || '—',
                    role: customer.role || 'customer',
                    walletId: null,
                    pointsBalance: 0,
                    lifetimeEarned: 0,
                    lifetimeRedeemed: 0,
                    isActive: true,
                    updatedAt: customer.created_at,
                }));

                return NextResponse.json({
                    success: true,
                    wallets,
                    totalCount: profCount || 0,
                    page,
                    limit,
                });
            }

            console.error('Error fetching customer wallets:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const wallets = (data || []).map((customer: any) => {
            const wallet = Array.isArray(customer.loyalty_wallets)
                ? customer.loyalty_wallets[0]
                : customer.loyalty_wallets;

            return {
                userId: customer.id,
                fullName: customer.full_name || 'Anonymous Customer',
                mobile: customer.mobile || '—',
                role: customer.role,
                walletId: wallet?.id || null,
                pointsBalance: wallet?.points_balance || 0,
                lifetimeEarned: wallet?.lifetime_earned_points || 0,
                lifetimeRedeemed: wallet?.lifetime_redeemed_points || 0,
                isActive: wallet?.is_active ?? true,
                walletUpdatedAt: wallet?.updated_at || customer.created_at,
            };
        });

        return NextResponse.json({
            success: true,
            wallets,
            totalCount: count || 0,
            page,
            limit,
        });
    } catch (error: any) {
        console.error('Customer wallets API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

