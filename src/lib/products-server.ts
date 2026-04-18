import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

export async function getLiveProductsAction(staticProducts: Product[]): Promise<Product[]> {
    try {
        // Run fetch and minimum delay in parallel to ensure loading screen shows for at least 1s
        const [response] = await Promise.all([
            supabase
                .from('products')
                .select('*'),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);

        const { data, error } = response;

        if (error) {
            console.error('Server Fetch Error:', error);
            return staticProducts;
        }

        if (data) {
            const updatedProducts = staticProducts.map(staticProduct => {
                const liveData = data.find(p => p.slug === staticProduct.slug);
                if (liveData) {
                    return {
                        ...staticProduct,
                        id: liveData.id,
                        name: liveData.name || staticProduct.name,
                        mrp: liveData.mrp || staticProduct.mrp,
                        salePrice: liveData.price || staticProduct.salePrice,
                        stock: liveData.stock,
                        inStock: liveData.stock > 0,
                        stockStatus: (liveData.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                        images: (liveData.images && liveData.images.length > 0) ? liveData.images : staticProduct.images,
                        specifications: liveData.specifications || staticProduct.specifications,
                        description: liveData.description || staticProduct.description,
                        isActive: liveData.is_active
                    };
                }
                return staticProduct;
            });

            // Add new products from DB that are not in staticProducts
            const newDbProducts = data
                .filter(liveData => !staticProducts.some(p => p.slug === liveData.slug))
                .map(liveData => ({
                    id: liveData.id,
                    slug: liveData.slug,
                    name: liveData.name,
                    brand: 'generic',
                    category: liveData.category,
                    mrp: liveData.mrp || liveData.price,
                    salePrice: liveData.price,
                    features: [],
                    specifications: liveData.specifications || {},
                    description: liveData.description,
                    inStock: liveData.stock > 0,
                    stock: liveData.stock,
                    stockStatus: (liveData.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                    images: liveData.images || [],
                    isActive: liveData.is_active
                } as Product));

            const combined = [...updatedProducts, ...newDbProducts];

            // Filter inactive
            return combined.filter(p => p.isActive !== false);
        }
        return staticProducts;

    } catch (err) {
        console.error('Server Fetch Exception:', err);
        return staticProducts;
    }
}
