import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

export function useLiveProducts(initialProducts: Product[]) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLiveData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, slug, mrp, price, stock, is_active');

                if (error) {
                    console.error('Error fetching live product data:', error);
                    return;
                }

                if (data) {
                    const updatedProducts = initialProducts.map(staticProduct => {
                        const liveData = data.find(p => p.slug === staticProduct.slug); // Match by slug
                        if (liveData) {
                            return {
                                ...staticProduct,
                                id: liveData.id, // Ensure ID matches DB
                                mrp: liveData.mrp || staticProduct.mrp,
                                salePrice: liveData.price || staticProduct.salePrice,
                                stock: liveData.stock,
                                inStock: liveData.stock > 0,
                                stockStatus: (liveData.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                                isActive: liveData.is_active // Add active status
                            };
                        }
                        return staticProduct;
                    });

                    // Filter out inactive products
                    const activeProducts = updatedProducts.filter(p => p.isActive !== false);
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

export function useLiveProduct(staticProduct: Product | null | undefined) {
    const [product, setProduct] = useState<Product | null | undefined>(staticProduct);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!staticProduct) {
            setLoading(false);
            return;
        }

        const fetchLiveData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('id, slug, mrp, price, stock, is_active')
                    .eq('slug', staticProduct.slug)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore not found error
                    console.error('Error fetching live product data:', error);
                }

                if (data) {
                    setProduct({
                        ...staticProduct,
                        id: data.id,
                        mrp: data.mrp || staticProduct.mrp,
                        salePrice: data.price || staticProduct.salePrice,
                        stock: data.stock,
                        inStock: data.stock > 0,
                        stockStatus: (data.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                        // @ts-ignore - Adding dynamic property that might not exist on type yet
                        isActive: data.is_active
                    });
                } else {
                    setProduct(staticProduct);
                }

                // If active status is explicitly false, we might want to return null/undefined to hide it
                // But for detail pages, maybe we show "Product Unavailable"?
                // For now, let's respect the data.

            } catch (err) {
                console.error(err);
                setProduct(staticProduct);
            } finally {
                setLoading(false);
            }
        };

        fetchLiveData();
    }, [staticProduct]);

    return { product, loading };
}
