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
                    const updatedProducts = initialProducts.map(staticProduct => {
                        const liveData = data.find(p => p.slug === staticProduct.slug); // Match by slug
                        if (liveData) {
                            return {
                                ...staticProduct,
                                id: liveData.id, // Ensure ID matches DB
                                name: liveData.name || staticProduct.name,
                                mrp: liveData.mrp || staticProduct.mrp,
                                salePrice: liveData.price || staticProduct.salePrice,
                                stock: liveData.stock,
                                inStock: liveData.stock > 0,
                                stockStatus: (liveData.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                                images: (liveData.images && liveData.images.length > 0) ? liveData.images : staticProduct.images,
                                specifications: liveData.specifications || staticProduct.specifications,
                                description: liveData.description || staticProduct.description,
                                isActive: liveData.is_active // Add active status
                            };
                        }
                        return staticProduct;
                    });

                    // Add new products from DB that are not in initialProducts
                    const newDbProducts = data
                        .filter(liveData => !initialProducts.some(p => p.slug === liveData.slug))
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
                        brand: staticProduct?.brand || 'generic',
                        category: data.category || staticProduct?.category,
                        mrp: data.mrp || staticProduct?.mrp || data.price,
                        salePrice: data.price || staticProduct?.salePrice,
                        features: staticProduct?.features || [],
                        specifications: data.specifications || staticProduct?.specifications || {},
                        description: data.description || staticProduct?.description,
                        stock: data.stock,
                        inStock: data.stock > 0,
                        stockStatus: (data.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                        images: (data.images && data.images.length > 0) ? data.images : (staticProduct?.images || []),
                        isActive: data.is_active
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
