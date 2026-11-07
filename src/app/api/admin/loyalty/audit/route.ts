import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '30', 10);
        const offset = (page - 1) * limit;

        const supabase = getSupabaseAdmin();

        const { data, count, error } = await supabase
            .from('loyalty_admin_audit')
            .select(`
                *,
                admin:profiles!loyalty_admin_audit_admin_user_id_fkey(full_name, mobile)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            // Check if table missing
            if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
                return NextResponse.json({
                    success: true,
                    auditLogs: [],
                    totalCount: 0,
                    page,
                    limit,
                });
            }

            // Fallback without join
            const { data: fallbackData, count: fallbackCount, error: fallbackError } = await supabase
                .from('loyalty_admin_audit')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (fallbackError) {
                if (fallbackError.code === 'PGRST205' || fallbackError.message?.includes('schema cache')) {
                    return NextResponse.json({
                        success: true,
                        auditLogs: [],
                        totalCount: 0,
                        page,
                        limit,
                    });
                }
                throw fallbackError;
            }

            return NextResponse.json({
                success: true,
                auditLogs: fallbackData || [],
                totalCount: fallbackCount || 0,
                page,
                limit,
            });
        }

        return NextResponse.json({
            success: true,
            auditLogs: data || [],
            totalCount: count || 0,
            page,
            limit,
        });
    } catch (error: any) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            return NextResponse.json({
                success: true,
                auditLogs: [],
                totalCount: 0,
                page: 1,
                limit: 30,
            });
        }
        console.error('Audit GET error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch audit log' }, { status: 500 });
    }
}

