import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

export async function getLiveProductsAction(staticProducts: Product[]): Promise<Product[]> {
    try {
        // Run fetch and minimum delay in parallel to ensure loading screen shows for at least 1s
        const response = await supabase
            .from('products')
            .select('*');

        const { data, error } = response;

        if (error) {
            console.error('Server Fetch Error:', error);
            return staticProducts;
        }

        if (data) {
            // Database is the absolute source of truth
            const combined = data.map(dbProduct => {
                // Find matching static product for fallback badges, features, etc.
                const staticMatch = staticProducts.find(p => 
                    p.slug === dbProduct.slug || 
                    p.name === dbProduct.name || 
                    (p.model && (dbProduct.specifications?.['Model number'] === p.model || dbProduct.specifications?.model === p.model))
                );

                return {
                    ...(staticMatch || {}), // Fallback properties like badge
                    id: dbProduct.id,
                    slug: dbProduct.slug,
                    name: dbProduct.name,
                    brand: staticMatch?.brand || dbProduct.specifications?.brand || dbProduct.specifications?.Brand || 'generic',
                    category: dbProduct.specifications?.category || staticMatch?.category || dbProduct.category,
                    mrp: dbProduct.mrp || dbProduct.price,
                    salePrice: dbProduct.price,
                    model: dbProduct.specifications?.model || dbProduct.specifications?.['Model number'] || staticMatch?.model,
                    features: staticMatch?.features || dbProduct.specifications?.features || [],
                    components: dbProduct.specifications?.components || staticMatch?.components || [],
                    specifications: dbProduct.specifications || staticMatch?.specifications || {},
                    description: dbProduct.description || staticMatch?.description,
                    warranty: dbProduct.specifications?.warranty || dbProduct.specifications?.['Warranty'] || staticMatch?.warranty,
                    inStock: dbProduct.stock > 0,
                    stock: dbProduct.stock,
                    stockStatus: (dbProduct.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                    images: (dbProduct.images && dbProduct.images.length > 0) ? dbProduct.images : (staticMatch?.images || []),
                    isActive: dbProduct.is_active
                } as Product;
            });

            // Filter inactive
            return combined.filter(p => p.isActive !== false);
        }
        return staticProducts;

    } catch (err) {
        console.error('Server Fetch Exception:', err);
        return staticProducts;
    }
}
