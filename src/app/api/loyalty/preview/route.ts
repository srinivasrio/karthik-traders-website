import { NextResponse } from 'next/server';
import {
    getAuthenticatedUser,
    calculateEligibleSubtotalPaise,
    previewRedemption,
} from '@/lib/loyalty';

export async function POST(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items, pointsRequested } = body;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Valid items array is required' },
                { status: 400 }
            );
        }

        // Server-side calculation of eligible subtotal (never trust client total)
        const eligibleSubtotalPaise = calculateEligibleSubtotalPaise(items);

        const preview = await previewRedemption(
            authResult.user.id,
            eligibleSubtotalPaise,
            pointsRequested
        );

        return NextResponse.json({
            success: true,
            eligibleSubtotalPaise,
            eligibleSubtotalRupees: eligibleSubtotalPaise / 100,
            ...preview,
        });
    } catch (error: any) {
        console.error('Loyalty preview error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to preview redemption' },
            { status: 500 }
        );
    }
}

