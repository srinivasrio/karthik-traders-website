import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

export function useLiveProducts(initialProducts: Product[], options?: { skipLoading?: boolean }) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(!options?.skipLoading);

    useEffect(() => {
        const fetchLiveData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*');

                if (error) {
                    console.error('Error fetching live product data:', error);
                    return;
                }

                if (data) {
                    // Database is the absolute source of truth
                    const combined = data.map(dbProduct => {
                        // Find matching static product for fallback badges, features, etc.
                        const staticMatch = initialProducts.find(p => 
                            p.slug === dbProduct.slug || 
                            p.name === dbProduct.name || 
                            (p.model && (dbProduct.specifications?.['Model number'] === p.model || dbProduct.specifications?.model === p.model))
                        );

                        return {
                            ...(staticMatch || {}), // Fallback properties like badge
                            id: dbProduct.id,
                            slug: dbProduct.slug,
                            name: dbProduct.name,
                            model: dbProduct.specifications?.model || dbProduct.specifications?.['Model number'] || staticMatch?.model,
                            brand: staticMatch?.brand || dbProduct.specifications?.brand || 'generic',
                            category: dbProduct.specifications?.category || staticMatch?.category || dbProduct.category,
                            mrp: dbProduct.mrp || dbProduct.price,
                            salePrice: dbProduct.price,
                            features: staticMatch?.features || dbProduct.specifications?.features || [],
                            components: dbProduct.specifications?.components || staticMatch?.components || [],
                            specifications: dbProduct.specifications || staticMatch?.specifications || {},
                            description: dbProduct.description || staticMatch?.description,
                            warranty: dbProduct.specifications?.warranty || dbProduct.specifications?.['Warranty'] || staticMatch?.warranty,
                            inStock: dbProduct.stock > 0,
                            stock: dbProduct.stock,
                            stockStatus: (dbProduct.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                            images: (dbProduct.images && dbProduct.images.length > 0) ? dbProduct.images : (staticMatch?.images || []),
                            isActive: dbProduct.is_active,
                            is_best_selling: dbProduct.is_best_selling ?? staticMatch?.is_best_selling ?? false
                        } as Product;
                    });

                    // Filter out inactive products
                    const activeProducts = combined.filter(p => p.isActive !== false);
                    setProducts(activeProducts);
                }
            } catch (err) {
                console.error('Failed to fetch live products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveData();
    }, []); // Run once on mount. 
    // Dependency on initialProducts? usually static, but if it changes we might want to re-run.
    // Given usage, it's fine empty or with [initialProducts] if memoized. 

    return { products, loading };
}

export function useLiveProduct(staticProduct: Product | null | undefined, slugFallback?: string) {
    const [product, setProduct] = useState<Product | null | undefined>(staticProduct);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const targetSlug = staticProduct?.slug || slugFallback;
        if (!targetSlug) {
            setLoading(false);
            return;
        }

        const fetchLiveData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('slug', targetSlug)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore not found error
                    console.error('Error fetching live product data:', error);
                }

                if (data) {
                    setProduct({
                        ...(staticProduct || {}), // Fallback
                        id: data.id,
                        slug: data.slug,
                        name: data.name || staticProduct?.name,
                        model: data.specifications?.model || data.specifications?.['Model number'] || staticProduct?.model,
                        brand: staticProduct?.brand || data.specifications?.brand || 'generic',
                        category: data.specifications?.category || staticProduct?.category || data.category,
                        mrp: data.mrp || staticProduct?.mrp || data.price,
                        salePrice: data.price || staticProduct?.salePrice,
                        features: staticProduct?.features || data.specifications?.features || [],
                        components: data.specifications?.components || staticProduct?.components || [],
                        specifications: data.specifications || staticProduct?.specifications || {},
                        description: data.description || staticProduct?.description,
                        warranty: data.specifications?.warranty || data.specifications?.['Warranty'] || staticProduct?.warranty,
                        stock: data.stock,
                        inStock: data.stock > 0,
                        stockStatus: (data.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                        images: (data.images && data.images.length > 0) ? data.images : (staticProduct?.images || []),
                        isActive: data.is_active,
                        is_best_selling: data.is_best_selling ?? staticProduct?.is_best_selling ?? false
                    } as Product);
                } else if (!data && !staticProduct) {
                    // Not in DB and not in static
                    setProduct(null);
                } else {
                    setProduct(staticProduct);
                }
            } catch (err) {
                console.error(err);
                setProduct(staticProduct);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveData();
    }, [staticProduct, slugFallback]);

    return { product, loading };
}
