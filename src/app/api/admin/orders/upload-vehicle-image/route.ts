import { NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/storage-upload';
import { getAuthenticatedUser } from '@/lib/loyalty';

export async function POST(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No vehicle image file provided.' }, { status: 400 });
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
