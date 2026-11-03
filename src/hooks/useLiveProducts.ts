import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/data/products';

function formatSupabaseError(error: any): string {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    if (error.details) return error.details;
    if (error.hint) return error.hint;
    if (error.code) return `Postgrest code: ${error.code}`;
    try {
        const str = JSON.stringify(error);
        if (str && str !== '{}') return str;
    } catch {}
    return String(error);
}

export function useLiveProducts(initialProducts: Product[], options?: { skipLoading?: boolean }) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [loading, setLoading] = useState(!options?.skipLoading);

    useEffect(() => {
        let isMounted = true;

        const fetchLiveData = async () => {
            try {
                // Timeout after 8 seconds so UI never hangs if network is slow
                const fetchPromise = supabase.from('products').select('*');
                const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
                    setTimeout(() => resolve({ data: null, error: { message: 'Live data request timed out' } }), 8000)
                );

                const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

                if (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('Live product sync unavailable, using cached catalog:', formatSupabaseError(error));
                    }
                    return;
                }

                if (data && Array.isArray(data) && data.length > 0 && isMounted) {
                    // Database is the absolute source of truth
                    const combined = data.map(dbProduct => {
                        // Find matching static product for fallback badges, features, etc.
                        const staticMatch = initialProducts.find(p => 
                            p.slug === dbProduct.slug || 
                            p.name === dbProduct.name || 
                            (p.model && (dbProduct.specifications?.['Model number'] === p.model || dbProduct.specifications?.model === p.model))
                        );

                        const dbSpecs = dbProduct.specifications || {};
                        const dbFeatures = Array.isArray(dbSpecs.features) && dbSpecs.features.length > 0
                            ? dbSpecs.features
                            : (Array.isArray(dbProduct.features) && dbProduct.features.length > 0 ? dbProduct.features : null);

                        return {
                            id: dbProduct.id,
                            slug: dbProduct.slug,
                            name: dbProduct.name,
                            model: dbSpecs.model || dbSpecs['Model number'] || dbSpecs.Model || staticMatch?.model,
                            brand: dbProduct.brand || dbSpecs.brand || dbSpecs.Brand || staticMatch?.brand || 'generic',
                            category: dbSpecs.category || staticMatch?.category || dbProduct.category,
                            mrp: dbProduct.mrp || dbProduct.price,
                            salePrice: dbProduct.price,
                            features: dbFeatures !== null ? dbFeatures : (staticMatch?.features || []),
                            components: Array.isArray(dbSpecs.components) ? dbSpecs.components : (staticMatch?.components || []),
                            specifications: dbSpecs,
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

                    // Filter out inactive products
                    const activeProducts = combined.filter(p => p.isActive !== false);
                    setProducts(activeProducts);
                }
            } catch (err: any) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Failed to fetch live products:', err?.message || err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchLiveData();

        return () => {
            isMounted = false;
        };
    }, []);

    return { products, loading };
}

export function useLiveProduct(staticProduct: Product | null | undefined, slugFallback?: string) {
    const [product, setProduct] = useState<Product | null | undefined>(staticProduct);
    // If staticProduct is already available, do not block the UI with a full-screen loading spinner
    const [loading, setLoading] = useState(!staticProduct);

    useEffect(() => {
        let isMounted = true;
        const targetSlug = staticProduct?.slug || slugFallback;
        if (!targetSlug) {
            setLoading(false);
            return;
        }

        const fetchLiveData = async () => {
            try {
                const fetchPromise = supabase
                    .from('products')
                    .select('*')
                    .eq('slug', targetSlug)
                    .single();

                const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
                    setTimeout(() => resolve({ data: null, error: { message: 'Live data request timed out' } }), 8000)
                );

                const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

                if (error && (error as any).code !== 'PGRST116') { // Ignore not found error
                    if (process.env.NODE_ENV === 'development') {
                        console.warn(`Live product sync unavailable for "${targetSlug}":`, formatSupabaseError(error));
                    }
                }

                if (data && isMounted) {
                    const dbSpecs = data.specifications || {};
                    const dbFeatures = Array.isArray(dbSpecs.features) && dbSpecs.features.length > 0
                        ? dbSpecs.features
                        : (Array.isArray(data.features) && data.features.length > 0 ? data.features : null);

                    setProduct({
                        id: data.id,
                        slug: data.slug,
                        name: data.name || staticProduct?.name,
                        model: dbSpecs.model || dbSpecs['Model number'] || dbSpecs.Model || staticProduct?.model,
                        brand: data.brand || dbSpecs.brand || dbSpecs.Brand || staticProduct?.brand || 'generic',
                        category: dbSpecs.category || staticProduct?.category || data.category,
                        mrp: data.mrp || staticProduct?.mrp || data.price,
                        salePrice: data.price || staticProduct?.salePrice,
                        features: dbFeatures !== null ? dbFeatures : (staticProduct?.features || []),
                        components: Array.isArray(dbSpecs.components) ? dbSpecs.components : (staticProduct?.components || []),
                        specifications: dbSpecs,
                        description: data.description || staticProduct?.description,
                        warranty: dbSpecs.warranty || dbSpecs['Warranty'] || data.warranty || staticProduct?.warranty,
                        stock: data.stock,
                        inStock: data.stock > 0,
                        stockStatus: (data.stock > 0 ? 'in-stock' : 'out-of-stock') as any,
                        images: (data.images && data.images.length > 0) ? data.images : (staticProduct?.images || []),
                        isActive: data.is_active,
                        is_best_selling: data.is_best_selling ?? staticProduct?.is_best_selling ?? false
                    } as Product);
                } else if (!data && !staticProduct && isMounted) {
                    // Not in DB and not in static
                    setProduct(null);
                } else if (isMounted && staticProduct) {
                    setProduct(staticProduct);
                }
            } catch (err: any) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`Error during live product sync for "${targetSlug}":`, err?.message || err);
                }
                if (isMounted) {
                    setProduct(staticProduct);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchLiveData();

        return () => {
            isMounted = false;
        };
    }, [staticProduct, slugFallback]);

    return { product, loading };
}
