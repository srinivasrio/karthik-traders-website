import { NextResponse } from 'next/server';
import {
    getAuthenticatedUser,
    getLoyaltySettings,
    updateLoyaltySettings,
} from '@/lib/loyalty';

export async function GET(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const settings = await getLoyaltySettings();
        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        console.error('Error fetching loyalty settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const body = await request.json();
        const { settings } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json(
                { error: 'Valid settings object is required.' },
                { status: 400 }
            );
        }

        const updated = await updateLoyaltySettings(authResult.user.id, settings);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Error updating loyalty settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}

