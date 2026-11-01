import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

export async function getLiveProductsAction(staticProducts: Product[]): Promise<Product[]> {
    try {
        const fetchPromise = supabase
            .from('products')
            .select('*');

        // Safe 3.5s timeout so SSR / ISR never hangs if VPS latency spikes
        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: { message: 'Server fetch timeout' } }), 3500)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);
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

                const dbSpecs = dbProduct.specifications || {};
                const dbFeatures = Array.isArray(dbSpecs.features) && dbSpecs.features.length > 0
                    ? dbSpecs.features
                    : (Array.isArray(dbProduct.features) && dbProduct.features.length > 0 ? dbProduct.features : null);

                return {
                    ...(staticMatch || {}), // Fallback properties like badge
                    id: dbProduct.id,
                    slug: dbProduct.slug,
                    name: dbProduct.name,
                    brand: dbProduct.brand || dbSpecs.brand || dbSpecs.Brand || staticMatch?.brand || 'generic',
                    category: dbSpecs.category || staticMatch?.category || dbProduct.category,
                    mrp: dbProduct.mrp || dbProduct.price,
                    salePrice: dbProduct.price,
                    model: dbSpecs.model || dbSpecs['Model number'] || dbSpecs.Model || staticMatch?.model,
                    features: dbFeatures !== null ? dbFeatures : (staticMatch?.features || []),
                    components: dbSpecs.components || staticMatch?.components || [],
                    specifications: {
                        ...(staticMatch?.specifications || {}),
                        ...dbSpecs,
                    },
                    description: dbProduct.description || staticMatch?.description,
                    warranty: dbSpecs.warranty || dbSpecs['Warranty'] || dbProduct.warranty || staticMatch?.warranty,
                    inStock: dbProduct.stock > 0,
                    stock: dbProduct.stock,
                    stockStatus: (dbProduct.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                    images: (dbProduct.images && dbProduct.images.length > 0) ? dbProduct.images : (staticMatch?.images || []),
                    isActive: dbProduct.is_active,
                    is_best_selling: dbProduct.is_best_selling ?? staticMatch?.is_best_selling ?? false
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
