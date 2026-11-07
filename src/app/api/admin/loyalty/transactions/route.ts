import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const url = new URL(request.url);
        const type = url.searchParams.get('type') || '';
        const userId = url.searchParams.get('userId') || '';
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '30', 10);
        const offset = (page - 1) * limit;

        const supabase = getSupabaseAdmin();

        let query = supabase
            .from('loyalty_transactions')
            .select(`
                *,
                profile:profiles(full_name, mobile)
            `, { count: 'exact' });

        if (type.trim()) {
            query = query.eq('transaction_type', type.trim());
        }

        if (userId.trim()) {
            query = query.eq('user_id', userId.trim());
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, count, error } = await query;
        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
                return NextResponse.json({
                    success: true,
                    transactions: [],
                    totalCount: 0,
                    page,
                    limit,
                });
            }
            throw error;
        }

        return NextResponse.json({
            success: true,
            transactions: data || [],
            totalCount: count || 0,
            page,
            limit,
        });
    } catch (error: any) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            return NextResponse.json({
                success: true,
                transactions: [],
                totalCount: 0,
                page: 1,
                limit: 30,
            });
        }
        console.error('Transactions GET error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch transactions' }, { status: 500 });
    }
}

