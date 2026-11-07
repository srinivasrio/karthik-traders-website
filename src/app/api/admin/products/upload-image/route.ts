import { NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/storage-upload';
import { getAuthenticatedUser } from '@/lib/loyalty';

export async function POST(request: Request) {
    try {
        // Authenticate admin caller
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const category = formData.get('category') as string | null || '';

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file was provided.' }, { status: 400 });
        }

        const result = await uploadImageToStorage(file, category);

        if (!result.success) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('API /admin/products/upload-image error:', err);
        return NextResponse.json({
            success: false,
            error: err?.message || 'Server error uploading image.'
        }, { status: 500 });
    }
}
