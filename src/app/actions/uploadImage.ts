'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export type UploadImageResult = {
    success: boolean;
    publicUrl?: string;
    filePath?: string;
    error?: string;
};

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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return {
                success: false,
                error: 'Server configuration error: Supabase URL or Service Role Key is missing.'
            };
        }

        // Initialize admin client to bypass client-side RLS limits
        const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey);

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        // Map category to bucket directories:
        // aerators, motors, gearboxes, spares, long-arm
        let mappedFolder = 'spares'; // fallback
        const cat = category.toLowerCase().trim();

        if (cat === 'aerators' || cat === 'aerator-set') {
            mappedFolder = 'aerators';
        } else if (cat === 'motors' || cat === 'motor') {
            mappedFolder = 'motors';
        } else if (cat === 'gearboxes' || cat.includes('gearbox')) {
            if (cat.includes('long-arm')) {
                mappedFolder = 'long-arm';
            } else {
                mappedFolder = 'gearboxes';
            }
        } else if (cat.includes('long-arm')) {
            mappedFolder = 'long-arm';
        } else if (cat === 'spares' || cat.includes('spare') || cat.includes('frame') || cat.includes('rod') || cat.includes('fan') || cat.includes('float') || cat.includes('kit-box') || cat.includes('motor-cover')) {
            mappedFolder = 'spares';
        } else {
            // Default fallback if category doesn't match standard groups
            mappedFolder = 'spares';
        }

        const filePath = `${mappedFolder}/${fileName}`;

        // Convert file stream to buffer for Node.js upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`Server Action: Uploading file ${file.name} (${file.size} bytes) to path ${filePath}...`);

        const { data, error } = await supabaseAdmin.storage
            .from('product-images')
            .upload(filePath, buffer, {
                contentType: file.type || 'image/jpeg',
                cacheControl: '31536000',
                upsert: false
            });

        if (error) {
            console.error('Server Action storage upload error details:', error);
            return { success: false, error: error.message || 'Supabase storage error occurred during upload.' };
        }

        // Generate public read URL
        const { data: urlData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(filePath);

        console.log(`Server Action: Upload success! Generated Public URL: ${urlData.publicUrl}`);

        return {
            success: true,
            publicUrl: urlData.publicUrl,
            filePath
        };
    } catch (err: any) {
        console.error('Server Action upload exception:', err);
        return {
            success: false,
            error: err?.message || 'An unexpected server error occurred during image upload.'
        };
    }
}
