import { NextResponse } from 'next/server';
import { getAuthenticatedUser, processExpiredPoints } from '@/lib/loyalty';

export async function POST(request: Request) {
    try {
        // Can be authenticated via admin session OR via cron authorization header
        const authHeader = request.headers.get('Authorization') || '';
        const cronSecret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

        let authorized = false;

        if (cronSecret && authHeader.includes(cronSecret)) {
            authorized = true;
        } else {
            const authResult = await getAuthenticatedUser(request);
            if (authResult?.isAdmin) {
                authorized = true;
            }
        }

        if (!authorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const result = await processExpiredPoints();
        return NextResponse.json(result || { success: true });
    } catch (error: any) {
        console.error('Points expiration job error:', error);
        return NextResponse.json({ error: error.message || 'Failed to expire points' }, { status: 500 });
    }
}

