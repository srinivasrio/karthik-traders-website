'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type CartItem = {
    id: string;
    slug?: string;
    model: string;
    price: number | string;
    salePrice?: number | string;
    quantity: number;
    image?: string;
    images?: string[];
    mrp?: number | string;
    stock?: number;
    inStock?: boolean;
    brand?: string;
    category?: string;
    [key: string]: any;
};

export type Coupon = {
    id?: string;
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: number;
    applicable_products: string[]; // Product IDs
};

type CartContextType = {
    cartItems: CartItem[];
    cartCount: number;
    totalPrice: number;
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;

    // Coupon Logic
    coupon: Coupon | null;
    applyCoupon: (coupon: Coupon | null) => void;
    discountAmount: number;
    finalPrice: number;

    // Live Price Sync
    priceUpdateNotice: string | null;
    dismissPriceNotice: () => void;
    syncCartPrices: () => Promise<void>;
};

/**
 * Compares and updates cart items against fresh database product records
 */
export function updateCartWithLiveProducts(
    prevItems: CartItem[],
    dbProducts: any[]
): { updatedItems: CartItem[]; hasPriceChanges: boolean; changedNames: string[] } {
    let hasPriceChanges = false;
    const changedNames: string[] = [];

    const updatedItems = prevItems.map((item) => {
        const cId = String(item.id || '').toLowerCase().trim();
        const cSlug = String(item.slug || '').toLowerCase().trim();
        const cName = String(item.name || '').toLowerCase().trim();

        const match = dbProducts.find((p) => {
            const dbId = String(p.id || '').toLowerCase().trim();
            const dbSlug = String(p.slug || '').toLowerCase().trim();
            const dbName = String(p.name || '').toLowerCase().trim();
            return (
                (cId && dbId && cId === dbId) ||
                (cSlug && dbSlug && cSlug === dbSlug) ||
                (cId && dbSlug && cId === dbSlug) ||
                (cSlug && dbId && cSlug === dbId) ||
                (cName && dbName && cName === dbName)
            );
        });

        if (!match) return item;

        const livePrice = Number(match.price);
        const liveMrp = Number(match.mrp || match.price);
        const currentPrice = Number(item.salePrice ?? item.price ?? 0);
        const currentMrp = Number(item.mrp ?? 0);
        const liveStock = typeof match.stock === 'number' ? match.stock : item.stock;

        const isPriceDifferent = !isNaN(livePrice) && livePrice > 0 && Math.abs(livePrice - currentPrice) > 0.01;
        const isMrpDifferent = !isNaN(liveMrp) && liveMrp > 0 && Math.abs(liveMrp - currentMrp) > 0.01;
        const isStockDifferent = match.stock !== undefined && item.stock !== match.stock;

        if (isPriceDifferent || isMrpDifferent || isStockDifferent) {
            hasPriceChanges = true;
            changedNames.push(item.name || match.name);
            return {
                ...item,
                price: livePrice,
                salePrice: livePrice,
                mrp: liveMrp,
                stock: liveStock,
                inStock: liveStock !== undefined ? liveStock > 0 : item.inStock,
            };
        }
        return item;
    });

    return { updatedItems, hasPriceChanges, changedNames };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);

    const [priceUpdateNotice, setPriceUpdateNotice] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                setCartItems(parsedCart);
            }
        } catch (error) {
            console.error('Failed to load cart from localStorage:', error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Dismiss notice helper
    const dismissPriceNotice = () => setPriceUpdateNotice(null);

    // Live price synchronizer function
    const syncCartPrices = async () => {
        try {
            const { data: dbProducts, error } = await supabase
                .from('products')
                .select('id, slug, name, price, mrp, stock, is_active');
            if (error || !dbProducts || dbProducts.length === 0) return;

            setCartItems((prev) => {
                if (prev.length === 0) return prev;
                const { updatedItems, hasPriceChanges, changedNames } = updateCartWithLiveProducts(prev, dbProducts);
                if (hasPriceChanges) {
                    console.log('[CartContext] Auto-synced live prices from DB:', changedNames);
                    setPriceUpdateNotice(`Cart prices were automatically updated for: ${changedNames.join(', ')}`);
                    return updatedItems;
                }
                return prev;
            });
        } catch (err) {
            console.warn('[CartContext] Error syncing live prices:', err);
        }
    };

    // 1. Supabase Realtime channel: listen for live UPDATE on products table (Admin updates price in DB)
    useEffect(() => {
        const channel = supabase
            .channel('cart-realtime-products-pricing')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products' },
                (payload) => {
                    const updated = payload.new;
                    if (!updated) return;
                    setCartItems((prev) => {
                        const { updatedItems, hasPriceChanges, changedNames } = updateCartWithLiveProducts(prev, [updated]);
                        if (hasPriceChanges) {
                            console.log('[CartContext Realtime] Auto-updated price from admin edit:', changedNames);
                            setPriceUpdateNotice(`Price updated by store admin for: ${changedNames.join(', ')}`);
                            return updatedItems;
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 2. Periodic sync and focus/visibility listeners
    useEffect(() => {
        if (!isInitialized) return;

        // Perform initial sync as soon as cart items are loaded from localStorage
        syncCartPrices();

        const handleFocus = () => syncCartPrices();
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') syncCartPrices();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);

        // Check every 30 seconds for background updates
        const interval = setInterval(syncCartPrices, 30000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
            clearInterval(interval);
        };
    }, [isInitialized]);

    // Update derived state and localStorage whenever cartItems changes
    useEffect(() => {
        if (!isInitialized) return;

        // Calculate count
        const count = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
        setCartCount(count);

        // Calculate total price
        const total = cartItems.reduce((acc, item) => {
            const rawPrice = item.salePrice !== undefined ? item.salePrice : item.price;
            const price = typeof rawPrice === 'string'
                ? parseFloat(rawPrice.replace(/[^\d.]/g, ''))
                : (typeof rawPrice === 'number' ? rawPrice : 0);
            return acc + (price * (item.quantity || 1));
        }, 0);
        setTotalPrice(total);

        // Calculate Discount
        let discount = 0;
        if (coupon) {
            let applicableItemsQuantity = 0;

            const applicableItemsTotal = cartItems.reduce((acc, item) => {
                const isApplicable = coupon.applicable_products.includes(item.id) ||
                    (item.slug && coupon.applicable_products.includes(item.slug));

                if (isApplicable) {
                    const rawPrice = item.salePrice !== undefined ? item.salePrice : item.price;
                    const price = typeof rawPrice === 'string'
                        ? parseFloat(rawPrice.replace(/[^\d.]/g, ''))
                        : (typeof rawPrice === 'number' ? rawPrice : 0);

                    const qty = item.quantity || 1;
                    applicableItemsQuantity += qty;
                    return acc + (price * qty);
                }
                return acc;
            }, 0);

            if (applicableItemsTotal > 0) {
                if (coupon.discount_type === 'percentage') {
                    discount = (applicableItemsTotal * coupon.discount_value) / 100;
                } else {
                    const totalFlatDiscount = coupon.discount_value * applicableItemsQuantity;
                    discount = Math.min(totalFlatDiscount, applicableItemsTotal);
                }
            } else {
                discount = 0;
            }
        }
        setDiscountAmount(discount);
        setFinalPrice(Math.max(0, total - discount));

        // Persist to localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));

        // Dispatch event for legacy listeners
        window.dispatchEvent(new Event('cartUpdated'));
    }, [cartItems, isInitialized, coupon]);

    const applyCoupon = (newCoupon: Coupon | null) => {
        setCoupon(newCoupon);
    };

    const addToCart = (newItem: CartItem) => {
        // Global out of stock prevention
        const productStock = newItem.stock !== undefined ? newItem.stock : (newItem.inStock === false ? 0 : 999);
        if (productStock <= 0) {
            alert('This product is currently out of stock');
            return;
        }

        setCartItems(prev => {
            const existingItemIndex = prev.findIndex(item => item.id === newItem.id);
            if (existingItemIndex > -1) {
                const currentQty = prev[existingItemIndex].quantity || 1;
                if (currentQty >= productStock) {
                    alert(`Only ${productStock} units available in stock`);
                    return prev;
                }
                const newCart = [...prev];
                newCart[existingItemIndex].quantity = currentQty + 1;
                return newCart;
            }
            return [...prev, { ...newItem, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(itemId);
            return;
        }

        const item = cartItems.find(i => i.id === itemId);
        if (item) {
            const productStock = item.stock !== undefined ? item.stock : (item.inStock === false ? 0 : 999);
            if (quantity > productStock) {
                alert(`Only ${productStock} units available in stock`);
                return;
            }
        }

        setCartItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            totalPrice,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            coupon,
            applyCoupon,
            discountAmount,
            finalPrice,
            priceUpdateNotice,
            dismissPriceNotice,
            syncCartPrices
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
