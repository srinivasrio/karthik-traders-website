'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type CartItem = {
    id: string;
    model: string;
    price: number | string;
    salePrice?: number | string;
    quantity: number;
    image?: string;
    images?: string[];
    // Add other properties as needed from your existing usage
    [key: string]: any;
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
};

export type Coupon = {
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: number;
    applicable_products: string[]; // Product IDs
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [finalPrice, setFinalPrice] = useState(0);

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

        setTotalPrice(total);

        // Calculate Discount
        let discount = 0;
        if (coupon) {
            // Check applicability
            // "Coupon applies only to selected aerators" implies discount calculates ONLY on those items.
            // Loop through cart, check if item is in coupon.applicable_products

            const applicableItemsTotal = cartItems.reduce((acc, item) => {
                if (coupon.applicable_products.includes(item.id)) {
                    const rawPrice = item.salePrice !== undefined ? item.salePrice : item.price;
                    const price = typeof rawPrice === 'string'
                        ? parseFloat(rawPrice.replace(/[^\d.]/g, ''))
                        : (typeof rawPrice === 'number' ? rawPrice : 0);
                    return acc + (price * (item.quantity || 1));
                }
                return acc;
            }, 0);

            if (applicableItemsTotal > 0) {
                if (coupon.discount_type === 'percentage') {
                    discount = (applicableItemsTotal * coupon.discount_value) / 100;
                } else {
                    discount = Math.min(coupon.discount_value, applicableItemsTotal);
                }
            } else {
                // Cart changed and no applicable items? Should we remove coupon? 
                // For now, keep it but 0 discount.
                discount = 0;
            }
        }
        setDiscountAmount(discount);
        setFinalPrice(Math.max(0, total - discount));

        // Persist to localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));

        // Dispatch event for legacy listeners (optional, but good for transition)
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
            finalPrice
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
