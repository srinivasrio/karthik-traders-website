import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

export async function getLiveProductsAction(staticProducts: Product[]): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, slug, mrp, price, stock, is_active');

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
                        mrp: liveData.mrp || staticProduct.mrp,
                        salePrice: liveData.price || staticProduct.salePrice,
                        stock: liveData.stock,
                        inStock: liveData.stock > 0,
                        stockStatus: (liveData.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                        isActive: liveData.is_active
                    };
                }
                return staticProduct;
            });
            // Filter inactive
            return updatedProducts.filter(p => p.isActive !== false);
        }
        return staticProducts;

    } catch (err) {
        console.error('Server Fetch Exception:', err);
        return staticProducts;
    }
}
