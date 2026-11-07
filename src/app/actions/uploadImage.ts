'use server';

import { uploadImageToStorage, UploadImageResult } from '@/lib/storage-upload';

export type { UploadImageResult };

/**
 * Server Action to upload product images to Supabase storage.
 * Uses administrative service-role client to bypass client RLS policies.
 */
export async function uploadProductImageAction(formData: FormData): Promise<UploadImageResult> {
    try {
        const file = formData.get('file') as File | null;
        const category = formData.get('category') as string | null || '';

        if (!file) {
            return { success: false, error: 'No file was provided for upload' };
        }

        return await uploadImageToStorage(file, category);
    } catch (err: any) {
        console.error('Server Action upload exception:', err);
        return {
            success: false,
            error: err?.message || 'An unexpected server error occurred during image upload.'
        };
    }
}
