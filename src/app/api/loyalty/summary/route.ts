import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getWalletSummary } from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const summary = await getWalletSummary(authResult.user.id);
        return NextResponse.json({ success: true, ...summary });
    } catch (error: any) {
        console.error('Loyalty summary error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch loyalty wallet' },
            { status: 500 }
        );
    }
}

