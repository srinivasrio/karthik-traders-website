import { NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/storage-upload';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const orderId = (formData.get('orderId') as string | null)?.trim();

        if (!file) {
            return NextResponse.json({ success: false, error: 'No vehicle image file provided.' }, { status: 400 });
        }

        // Verify authorization:
        // 1. Check if caller has admin role via JWT/cookie session
        const authResult = await getAuthenticatedUser(request);
        let isAuthorized = Boolean(authResult?.isAdmin);

        // 2. If not confirmed admin by session, verify if a valid order ID was provided
        if (!isAuthorized && orderId) {
            try {
                const supabaseAdmin = getSupabaseAdmin();
                const { data: order } = await supabaseAdmin
                    .from('orders')
                    .select('id')
                    .eq('id', orderId)
                    .maybeSingle();

                if (order?.id) {
                    isAuthorized = true;
                }
            } catch (dbErr) {
                console.warn('Order lookup authorization error:', dbErr);
            }
        }

        if (!isAuthorized) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
        }

        const result = await uploadImageToStorage(file, 'delivery');

        if (!result.success) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            publicUrl: result.publicUrl,
            imageUrl: result.publicUrl,
            filePath: result.filePath,
        });
    } catch (err: any) {
        console.error('API /admin/orders/upload-vehicle-image error:', err);
        return NextResponse.json({
            success: false,
            error: err?.message || 'Server error uploading vehicle image.'
        }, { status: 500 });
    }
}
