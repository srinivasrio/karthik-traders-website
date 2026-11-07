import { NextResponse } from 'next/server';
import { getAuthenticatedUser, adminAdjustPoints } from '@/lib/loyalty';

export async function POST(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, points, reason } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Customer User ID is required' }, { status: 400 });
        }

        const pointAmount = parseInt(points, 10);
        if (isNaN(pointAmount) || pointAmount === 0) {
            return NextResponse.json({ error: 'Points must be a non-zero integer' }, { status: 400 });
        }

        if (!reason || !reason.trim()) {
            return NextResponse.json({ error: 'Mandatory reason is required for manual point adjustment' }, { status: 400 });
        }

        const result = await adminAdjustPoints(
            authResult.user.id,
            userId,
            pointAmount,
            reason.trim()
        );

        return NextResponse.json(result || { success: true });
    } catch (error: any) {
        console.error('Points adjustment error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to adjust points' },
            { status: 500 }
        );
    }
}

