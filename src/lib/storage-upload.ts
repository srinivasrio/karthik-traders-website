export type UploadImageResult = {
    success: boolean;
    publicUrl?: string;
    filePath?: string;
    error?: string;
};

/**
 * Uploads a product image directly to Supabase Storage via REST API.
 * Uses service role authentication to bypass client RLS.
 * Direct REST fetch avoids any @supabase/realtime-js WebSocket crashes on Node.js runtimes.
 */
export async function uploadImageToStorage(file: File, category: string = ''): Promise<UploadImageResult> {
    try {
        if (!file || typeof file.arrayBuffer !== 'function') {
            return { success: false, error: 'No valid image file was provided' };
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://karthiktraders.in';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            return {
                success: false,
                error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.'
            };
        }

        // Determine sanitized extension
        let ext = 'jpg';
        const rawExt = file.name ? file.name.split('.').pop()?.toLowerCase() : null;
        if (rawExt && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(rawExt)) {
            ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        } else if (file.type) {
            if (file.type.includes('png')) ext = 'png';
            else if (file.type.includes('webp')) ext = 'webp';
            else if (file.type.includes('jpeg') || file.type.includes('jpg')) ext = 'jpg';
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

        // Map category to bucket directories:
        let mappedFolder = 'spares';
        const cat = (category || '').toLowerCase().trim();

        if (cat === 'aerators' || cat === 'aerator-set' || cat.includes('aerator')) {
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
            mappedFolder = 'spares';
        }

        const filePath = `${mappedFolder}/${fileName}`;

        // Convert file stream to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload endpoint URLs (primary public URL and optional local fallback)
        const primaryTarget = `${supabaseUrl}/storage/v1/object/product-images/${filePath}`;
        const localTarget = `http://127.0.0.1:8000/storage/v1/object/product-images/${filePath}`;

        let uploadRes: Response | null = null;
        let lastErrText = '';

        // Try primary URL first
        try {
            uploadRes = await fetch(primaryTarget, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                    'x-upsert': 'true',
                },
                body: buffer,
            });
        } catch (fetchErr: any) {
            lastErrText = fetchErr?.message || String(fetchErr);
            console.warn(`Primary storage endpoint ${primaryTarget} failed, attempting local fallback:`, fetchErr);
        }

        // If primary failed or returned non-200, try local fallback if on VPS
        if (!uploadRes || !uploadRes.ok) {
            if (uploadRes) {
                const activeRes = uploadRes;
                lastErrText = await activeRes.text().catch(() => `HTTP ${activeRes.status}`);
            }
            try {
                const fallbackRes = await fetch(localTarget, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        'x-upsert': 'true',
                    },
                    body: buffer,
                });
                if (fallbackRes.ok) {
                    uploadRes = fallbackRes;
                } else {
                    lastErrText = await fallbackRes.text().catch(() => `HTTP ${fallbackRes.status}`);
                }
            } catch (fallbackErr: any) {
                console.warn('Local storage fallback error:', fallbackErr);
            }
        }

        if (!uploadRes || !uploadRes.ok) {
            console.error('Storage upload failed:', lastErrText);
            return {
                success: false,
                error: `Storage upload failed: ${lastErrText || 'Could not upload image'}`
            };
        }

        // Ensure public URL uses the canonical domain
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filePath}`;

        return {
            success: true,
            publicUrl,
            filePath,
        };
    } catch (err: any) {
        console.error('Unexpected error in uploadImageToStorage:', err);
        return {
            success: false,
            error: err?.message || 'Unexpected error occurred during storage upload'
        };
    }
}
