import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';

function mapCategoryToDb(cat: string): string {
    const valid = ['aerators', 'spares', 'motors', 'gearboxes', 'long-arm'];
    if (valid.includes(cat)) return cat;
    if (cat === 'aerator-set') return 'aerators';
    if (cat === 'motor') return 'motors';
    if (['worm-gearbox', 'bevel-gearbox'].includes(cat)) return 'gearboxes';
    if (['long-arm-gearbox', 'long-arm-spare'].includes(cat)) return 'long-arm';
    return 'spares';
}

export async function POST(request: Request) {
    try {
        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
        }

        const body = await request.json();
        const { mode, productId, productData } = body;

        if (!productData || !productData.name || !productData.slug || !productData.price) {
            return NextResponse.json({ success: false, error: 'Missing required product fields (name, slug, price).' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // Ensure category matches check constraint
        const cleanCategory = mapCategoryToDb(productData.category);

        const cleanData = {
            name: productData.name.trim(),
            slug: productData.slug.trim(),
            category: cleanCategory,
            price: parseFloat(productData.price),
            mrp: productData.mrp ? parseFloat(productData.mrp) : null,
            stock: parseInt(productData.stock) || 0,
            description: productData.description ? productData.description.trim() : null,
            images: Array.isArray(productData.images) ? productData.images.filter(Boolean) : [],
            specifications: productData.specifications || {},
            is_active: productData.is_active ?? true,
            is_best_selling: productData.is_best_selling ?? false,
            brand: productData.brand || null,
        };

        if (mode === 'create') {
            const { data, error } = await supabaseAdmin
                .from('products')
                .insert([cleanData])
                .select()
                .single();

            if (error) {
                console.error('Error inserting product via admin API:', error);
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, product: data });
        } else {
            if (!productId) {
                return NextResponse.json({ success: false, error: 'Missing productId for edit mode.' }, { status: 400 });
            }

            const { data, error } = await supabaseAdmin
                .from('products')
                .update(cleanData)
                .eq('id', productId)
                .select()
                .single();

            if (error) {
                console.error('Error updating product via admin API:', error);
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, product: data });
        }
    } catch (err: any) {
        console.error('API /admin/products/save error:', err);
        return NextResponse.json({
            success: false,
            error: err?.message || 'Server error saving product.'
        }, { status: 500 });
    }
}

