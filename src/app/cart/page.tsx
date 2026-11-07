'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { COUPONS_STORE } from '@/data/kt-ui';
import { validateCoupon } from '@/app/actions/validateCoupon';
import LoyaltyRedemptionControl from '@/components/checkout/LoyaltyRedemptionControl';

export default function CartPage() {
  const { session } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    coupon,
    discountAmount,
    finalPrice,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<number>(0);

  // Restore loyalty points from sessionStorage if returning to cart
  useEffect(() => {
    try {
      const savedPts = sessionStorage.getItem('kt_cart_points');
      const savedDisc = sessionStorage.getItem('kt_cart_loyalty_discount');
      if (savedPts && savedDisc) {
        setLoyaltyPoints(parseInt(savedPts, 10));
        setLoyaltyDiscount(parseFloat(savedDisc));
      }
    } catch (e) {}
  }, []);

  const handleApplyLoyalty = (pts: number, discount: number) => {
    setLoyaltyPoints(pts);
    setLoyaltyDiscount(discount);
    try {
      if (pts > 0) {
        sessionStorage.setItem('kt_cart_points', pts.toString());
        sessionStorage.setItem('kt_cart_loyalty_discount', discount.toString());
      } else {
        sessionStorage.removeItem('kt_cart_points');
        sessionStorage.removeItem('kt_cart_loyalty_discount');
      }
    } catch (e) {}
  };

  // Subtotal and MRP total
  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.salePrice ?? item.price ?? 0) * item.quantity,
    0
  );
  const mrpTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.mrp ?? item.salePrice ?? item.price ?? 0) * item.quantity,
    0
  );
  const totalSavings = mrpTotal - subtotal;
  const baseDiscounted = finalPrice > 0 ? finalPrice : Math.max(0, subtotal - discountAmount);
  const totalPayable = Math.max(0, baseDiscounted - loyaltyDiscount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      // 1. First validate against database coupons (dynamic coupons from admin panel)
      const cartIdentifiers = cartItems.map((item) => ({
        uuid: item.id,
        slug: item.slug || '',
        shortId: item.slug || item.id,
      }));

      const dbResult = await validateCoupon(code, cartIdentifiers);
      if (dbResult.isValid && dbResult.coupon) {
        applyCoupon({
          id: dbResult.coupon.id,
          code: dbResult.coupon.code,
          discount_type: dbResult.coupon.discount_type,
          discount_value: dbResult.coupon.discount_value,
          applicable_products: dbResult.coupon.applicable_products || [],
        });
        setCouponInput('');
        setCouponError('');
        setCouponLoading(false);
        return;
      }

      // 2. Fallback to hardcoded store coupons (BULK5, NELLORE1000)
      const matched = COUPONS_STORE[code];
      if (matched) {
        if (subtotal < matched.min) {
          setCouponError(`Add ${formatPrice(matched.min - subtotal)} more to use ${code}`);
          setCouponLoading(false);
          return;
        }
        applyCoupon({
          code: code,
          discount_type: matched.type === 'percent' ? 'percentage' : 'flat',
          discount_value: matched.value,
          applicable_products: [],
        });
        setCouponError('');
        setCouponInput('');
        setCouponLoading(false);
        return;
      }

      setCouponError(dbResult.error || 'This code is not active. Check spelling or call sales.');
    } catch (err: any) {
      setCouponError(err?.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    setCouponError('');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-poppins text-[#0B1A33]">
            Your Cart
          </h1>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="h-10 px-4 rounded-full border border-[#F5C2CF] bg-white text-[#B4123A] font-bold text-xs sm:text-sm hover:bg-[#FFF1F4] transition-colors cursor-pointer"
            >
              Clear cart
            </button>
          )}
        </div>

        {/* Empty State */}
        {cartItems.length === 0 ? (
          <div className="rounded-[32px] bg-[#E8F9FF] p-10 sm:p-16 flex flex-col items-center text-center gap-4 border border-[#C4D9FF]/60 shadow-xs">
            <span className="w-18 h-18 rounded-3xl bg-white flex items-center justify-center border border-[#C4D9FF] shadow-xs text-3xl">
              🛒
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1A33] font-poppins">
              Your cart is empty
            </h2>
            <p className="text-sm sm:text-base text-[#3D4A63] max-w-md leading-relaxed font-medium">
              Start with a complete aerator set, or pick genuine replacement spares for a set you already run.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Link
                href="/aerator-sets"
                className="h-12 px-6 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-sm inline-flex items-center transition-colors"
              >
                Shop Aerator Sets
              </Link>
              <Link
                href="/spares"
                className="h-12 px-6 rounded-full bg-white hover:bg-[#FBFBFB] border border-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm inline-flex items-center transition-colors"
              >
                Browse Spares
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 flex flex-col rounded-[28px] bg-white border border-[#E3E8F0] shadow-sm overflow-hidden divide-y divide-[#EEF2F8]">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 sm:p-5 animate-[ktUp_0.35s_both]"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-transparent border border-[#E3E8F0] p-2 shrink-0 flex items-center justify-center">
                    <img
                      src={item.images?.[0] || '/assets/hero-aerator-card-t.png'}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Title & Price details */}
                  <div className="flex-1 min-w-[160px] flex flex-col gap-1">
                    <Link
                      href={
                        item.category === 'aerator-set' || item.category === 'aerators'
                          ? `/aerator-sets/${item.slug}`
                          : `/products/${item.slug}`
                      }
                      className="font-extrabold text-sm sm:text-base text-[#0B1A33] hover:text-[#4338CA] leading-snug line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <div className="text-xs text-[#5B6880] font-medium flex items-center gap-2">
                      <span>{formatPrice(Number(item.salePrice ?? item.price ?? 0))} each</span>
                      {Number(item.mrp || 0) > Number(item.salePrice ?? item.price ?? 0) && (
                        <span className="line-through text-[#7C879C]">
                          {formatPrice(Number(item.mrp))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base sm:text-lg text-[#0B1A33] font-poppins">
                        {formatPrice(Number(item.salePrice ?? item.price ?? 0) * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                        className="w-8 h-8 rounded-full bg-[#FFF1F4] text-[#B4123A] flex items-center justify-center hover:bg-[#FDE2E8] transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center h-8 rounded-full border border-[#D5DCE8] bg-[#FBFBFB] px-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[#0B1A33] hover:bg-white cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-xs text-[#0B1A33]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[#0B1A33] hover:bg-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Sticky Summary Panel */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 rounded-[28px] bg-[#C4D9FF] text-[#0B1A33] p-6 sm:p-7 shadow-sm flex flex-col gap-4">
              <h2 className="text-xl font-extrabold font-poppins text-[#0B1A33]">
                Order Summary
              </h2>

              <div className="flex flex-col gap-2.5 text-sm font-medium">
                {mrpTotal > subtotal && (
                  <div className="flex justify-between">
                    <span className="text-[#3D4A63]">MRP Total</span>
                    <span className="line-through text-[#5B6880]">{formatPrice(mrpTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#3D4A63]">Subtotal</span>
                  <span className="font-extrabold text-[#0B1A33]">{formatPrice(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#3D4A63]">Discount</span>
                    <span className="font-extrabold text-[#0B7A4B]">− {formatPrice(totalSavings)}</span>
                  </div>
                )}
                {discountAmount > 0 && coupon && (
                  <div className="flex justify-between">
                    <span className="text-[#3D4A63]">Coupon ({coupon.code})</span>
                    <span className="font-extrabold text-[#4338CA]">− {formatPrice(discountAmount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#3D4A63]">Loyalty Rewards ({loyaltyPoints} pts)</span>
                    <span className="font-extrabold text-[#0B7A4B]">− {formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}
              </div>

              {/* Coupon Form */}
              {!coupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    placeholder="Coupon code (e.g. BULK5)"
                    className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-white/60 bg-white/80 text-xs font-mono font-bold uppercase text-[#0B1A33] outline-none focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="h-11 px-4 rounded-xl bg-[#0B1A33] disabled:opacity-60 text-white font-extrabold text-xs hover:bg-[#24365A] transition-colors cursor-pointer"
                  >
                    {couponLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              ) : (
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/60 border border-white text-xs">
                  <div>
                    <span className="font-mono font-extrabold text-[#0B1A33] block">
                      {coupon.code} APPLIED
                    </span>
                    <span className="text-[#0B7A4B] font-bold">
                      Saved {formatPrice(discountAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="font-bold text-[#B4123A] underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <span className="text-xs font-bold text-[#B4123A]">{couponError}</span>
              )}

              {/* Loyalty Redemption in Cart Order Summary */}
              <div className="pt-1">
                <LoyaltyRedemptionControl
                  items={cartItems}
                  session={session}
                  appliedPoints={loyaltyPoints}
                  appliedDiscount={loyaltyDiscount}
                  onApplyPoints={handleApplyLoyalty}
                />
              </div>

              <div className="h-px bg-black/10 my-1" />

              {/* Total */}
              <div className="flex justify-between items-baseline">
                <span className="font-extrabold text-base text-[#0B1A33]">
                  Payable Total
                </span>
                <span className="text-3xl font-extrabold font-poppins text-[#0B1A33] tracking-tight">
                  {formatPrice(totalPayable)}
                </span>
              </div>

              <p className="text-xs text-[#3D4A63] leading-relaxed">
                Logistics & transport are arranged directly from Nellore warehouse. No advance gateway fees are charged online.
              </p>

              <Link
                href="/bulk-orders"
                className="h-13 rounded-full bg-[#0B1A33] hover:bg-[#24365A] text-white font-extrabold text-base flex items-center justify-center gap-2 transition-colors shadow-md cursor-pointer mt-1"
              >
                <span>Proceed to Checkout</span>
                <span>→</span>
              </Link>
            </aside>
          </div>
        )}
      </main>

      {/* Clear Cart Modal Confirmation */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1A33]/40 backdrop-blur-xs grid place-items-center p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E3E8F0] animate-[ktUp_0.25s_both]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-extrabold text-[#0B1A33] font-poppins mb-2">
              Clear your cart?
            </h3>
            <p className="text-sm text-[#5B6880] mb-6 leading-relaxed">
              All {cartItems.length} items and any active coupons will be removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="h-10 px-4 rounded-full border border-[#D5DCE8] bg-white text-xs font-bold text-[#0B1A33] hover:bg-[#FBFBFB] cursor-pointer"
              >
                Keep items
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setLoyaltyPoints(0);
                  setLoyaltyDiscount(0);
                  try {
                    sessionStorage.removeItem('kt_cart_points');
                    sessionStorage.removeItem('kt_cart_loyalty_discount');
                  } catch (e) {}
                  setShowClearConfirm(false);
                }}
                className="h-10 px-5 rounded-full bg-[#D61F4A] text-white text-xs font-bold hover:bg-[#B4123A] cursor-pointer"
              >
                Clear cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
