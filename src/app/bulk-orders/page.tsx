'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/data/products';
import { COUPONS_STORE } from '@/data/kt-ui';
import LoyaltyRedemptionControl from '@/components/checkout/LoyaltyRedemptionControl';

export default function CheckoutPage() {
  const { cartItems, clearCart, totalPrice, finalPrice, discountAmount, coupon, applyCoupon } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: '',
    mobile: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);

  // Check Supabase session
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSession(data.session);
        const user = data.session.user;
        const meta = user.user_metadata || {};
        const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Aquaculture Farmer';
        const phone = user.phone || meta.mobile || '';
        setUserName(name);
        setUserPhone(phone);

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || name,
          mobile: prev.mobile || phone.replace('+91', '').trim(),
        }));
      }
    };
    checkAuth();
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.salePrice ?? item.price ?? 0) * item.quantity,
    0
  );
  const mrpTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.mrp ?? item.salePrice ?? item.price ?? 0) * item.quantity,
    0
  );
  const totalSavings = mrpTotal - subtotal;
  const deliveryFee = subtotal >= 50000 || subtotal === 0 ? 0 : 1500;
  const baseDiscountedSubtotal = finalPrice > 0 ? finalPrice : Math.max(0, subtotal - discountAmount);
  const currentTotal = Math.max(0, baseDiscountedSubtotal - loyaltyDiscount) + deliveryFee;

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.fullName.trim()) err.fullName = 'Full name is required';
    if (!formData.addressLine1.trim()) err.addressLine1 = 'Delivery address is required';
    if (!formData.city.trim()) err.city = 'City / Town is required';
    if (!formData.state.trim()) err.state = 'State is required';
    if (!/^\d{6}$/.test(formData.pincode)) err.pincode = 'Enter a valid 6-digit pincode';
    if (!/^\d{10}$/.test(formData.mobile)) err.mobile = 'Enter a valid 10-digit mobile number';
    return err;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          items: cartItems,
          totalAmount: currentTotal,
          shippingAddress: formData,
          couponCode: coupon?.code,
          discountAmount: discountAmount,
          pointsToRedeem: loyaltyPoints,
          loyaltyDiscount: loyaltyDiscount,
          deliveryFee,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      clearCart();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loyalty:refresh'));
      }
      setPlacedOrderId(data.orderId || `KT-${Date.now().toString().slice(-6)}`);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      alert('Error placing order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const terms = [
    {
      k: 'PAYMENT',
      v: 'No online gateway payment taken on this site. Our sales manager calls to verify transport and share billing accounts.',
    },
    {
      k: 'SHIPPING',
      v: deliveryFee === 0 ? 'Free direct delivery from Nellore on orders over ₹50,000.' : 'Direct transport from Nellore warehouse. Flat ₹1,500 freight.',
    },
    {
      k: 'TAXES & GST',
      v: 'All listed prices include GST. Official GST tax invoice issued with every dispatch for farm input credit.',
    },
    {
      k: 'DISPATCH',
      v: 'Same-day or next-morning dispatch across Andhra Pradesh, Telangana, Tamil Nadu, and Odisha.',
    },
  ];

  if (cartItems.length === 0 && !isSuccessModalOpen) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] pt-24 text-center px-4">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-white border border-[#E3E8F0] shadow-xs">
          <h2 className="text-2xl font-extrabold text-[#0B1A33] mb-3 font-poppins">
            Your cart is empty
          </h2>
          <p className="text-sm text-[#5B6880] mb-6">
            Add aerators or spare parts to proceed with checkout.
          </p>
          <Link
            href="/aerator-sets"
            className="inline-flex h-11 px-6 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-sm hover:bg-[#24365A] hover:text-white transition-colors"
          >
            Browse Aerator Sets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#5B6880] mb-4"
        >
          <Link href="/cart" className="hover:text-[#0B1A33]">Cart</Link>
          <span>/</span>
          <span className="text-[#0B1A33] font-bold">Checkout</span>
        </nav>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-poppins text-[#0B1A33] mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Steps */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {/* Step 1: Account */}
            <section className="rounded-[28px] bg-white border border-[#E3E8F0] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-[#C4D9FF] text-[#0B1A33] flex items-center justify-center font-extrabold text-xs">
                  1
                </span>
                <h2 className="text-lg font-extrabold font-poppins text-[#0B1A33]">
                  Account
                </h2>
              </div>

              {session ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#E3F7EE] text-[#0B1A33]">
                  <span className="w-10 h-10 rounded-full bg-[#C5BAFF] text-[#0B1A33] font-extrabold text-sm flex items-center justify-center shrink-0">
                    {userName.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm sm:text-base">
                      Signed in as {userName}
                    </span>
                    <span className="text-xs font-mono text-[#3D4A63]">
                      {userPhone || (session.user.email && !session.user.email.endsWith('@karthiktraders.com') ? session.user.email : '')}
                    </span>
                  </div>
                  <span className="ml-auto text-xs font-extrabold text-[#0B7A4B] bg-white px-2.5 py-1 rounded-full shadow-2xs">
                    ✓ Verified
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#E8F9FF] text-[#0B1A33]">
                  <span className="text-xs sm:text-sm font-medium leading-relaxed max-w-md">
                    Sign in to link this order with your customer dashboard, GST invoices, and dispatch alerts.
                  </span>
                  <Link
                    href="/login?redirect=/bulk-orders"
                    className="h-10 px-5 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-xs inline-flex items-center transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </section>

            {/* Step 2: Delivery Address Form */}
            <section className="rounded-[28px] bg-white border border-[#E3E8F0] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full bg-[#C4D9FF] text-[#0B1A33] flex items-center justify-center font-extrabold text-xs">
                  2
                </span>
                <h2 className="text-lg font-extrabold font-poppins text-[#0B1A33]">
                  Delivery Address & Farm Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="co-name" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Full Name (As on Tax Invoice)
                  </label>
                  <input
                    id="co-name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Reddy"
                    className={`h-12 px-4 rounded-xl border bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none transition-colors ${
                      errors.fullName ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.fullName && <span className="text-xs font-bold text-[#E5355F]">{errors.fullName}</span>}
                </div>

                {/* Address Line 1 */}
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="co-addr" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Address (Farm Location / Shed / Street / Landmark)
                  </label>
                  <input
                    id="co-addr"
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="e.g. Plot No 12, Near Shrimp Hatchery, Allur Road"
                    className={`h-12 px-4 rounded-xl border bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none transition-colors ${
                      errors.addressLine1 ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.addressLine1 && <span className="text-xs font-bold text-[#E5355F]">{errors.addressLine1}</span>}
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="co-city" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    City / Town
                  </label>
                  <input
                    id="co-city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Kavali / Nellore"
                    className={`h-12 px-4 rounded-xl border bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none transition-colors ${
                      errors.city ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.city && <span className="text-xs font-bold text-[#E5355F]">{errors.city}</span>}
                </div>

                {/* State */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="co-state" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    State
                  </label>
                  <input
                    id="co-state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Andhra Pradesh"
                    className="h-12 px-4 rounded-xl border border-[#D5DCE8] bg-[#FBFBFB] text-sm font-medium text-[#0B1A33] outline-none focus:border-[#4338CA]"
                  />
                  {errors.state && <span className="text-xs font-bold text-[#E5355F]">{errors.state}</span>}
                </div>

                {/* Pincode */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="co-pin" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Pincode
                  </label>
                  <input
                    id="co-pin"
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                    placeholder="524001"
                    className={`h-12 px-4 rounded-xl border bg-[#FBFBFB] font-mono text-sm font-medium text-[#0B1A33] outline-none transition-colors ${
                      errors.pincode ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus:border-[#4338CA]'
                    }`}
                  />
                  {errors.pincode && <span className="text-xs font-bold text-[#E5355F]">{errors.pincode}</span>}
                </div>

                {/* Mobile */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="co-mobile" className="text-xs font-extrabold text-[#3D4A63] uppercase tracking-wider">
                    Mobile Number (For Dispatch Updates)
                  </label>
                  <div
                    className={`flex items-center h-12 px-3 rounded-xl border bg-[#FBFBFB] transition-colors ${
                      errors.mobile ? 'border-[#E5355F] ring-1 ring-[#E5355F]' : 'border-[#D5DCE8] focus-within:border-[#4338CA]'
                    }`}
                  >
                    <span className="font-mono text-sm font-bold text-[#5B6880] pr-2 select-none">
                      +91
                    </span>
                    <input
                      id="co-mobile"
                      type="tel"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })
                      }
                      placeholder="98765 43210"
                      className="flex-1 min-w-0 border-0 outline-none bg-transparent font-medium text-sm text-[#0B1A33]"
                    />
                  </div>
                  {errors.mobile && <span className="text-xs font-bold text-[#E5355F]">{errors.mobile}</span>}
                </div>
              </div>
            </section>

            {/* Step 3: Terms & Payment Info */}
            <section className="rounded-[28px] bg-white border border-[#E3E8F0] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-[#C4D9FF] text-[#0B1A33] flex items-center justify-center font-extrabold text-xs">
                  3
                </span>
                <h2 className="text-lg font-extrabold font-poppins text-[#0B1A33]">
                  Payment & Delivery Terms
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {terms.map((t) => (
                  <div
                    key={t.k}
                    className="p-4 rounded-2xl bg-[#FBFBFB] border border-[#EEF2F8] flex flex-col gap-1"
                  >
                    <span className="text-xs font-extrabold tracking-wider text-[#5B6880]">
                      {t.k}
                    </span>
                    <span className="text-xs sm:text-sm text-[#0B1A33] font-medium leading-relaxed">
                      {t.v}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 rounded-[28px] bg-white border border-[#E3E8F0] p-6 sm:p-7 shadow-sm flex flex-col gap-4">
            <h2 className="text-xl font-extrabold font-poppins text-[#0B1A33]">
              Order Summary
            </h2>

            {/* Items Mini List */}
            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto no-scrollbar">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-xs sm:text-sm">
                  <span className="w-8 h-7 rounded-md bg-[#E8F9FF] text-[#0B5C86] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    ×{item.quantity}
                  </span>
                  <span className="flex-1 min-w-0 font-bold truncate text-[#0B1A33]">
                    {item.name}
                  </span>
                  <span className="font-mono font-bold text-[#0B1A33]">
                    {formatPrice(Number(item.salePrice ?? item.price ?? 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Loyalty Redemption Control */}
            <LoyaltyRedemptionControl
              items={cartItems}
              session={session}
              appliedPoints={loyaltyPoints}
              appliedDiscount={loyaltyDiscount}
              onApplyPoints={(pts, discount) => {
                setLoyaltyPoints(pts);
                setLoyaltyDiscount(discount);
              }}
            />

            <div className="h-px bg-[#EEF2F8]" />

            <div className="flex flex-col gap-2 text-xs sm:text-sm font-medium">
              <div className="flex justify-between">
                <span className="text-[#5B6880]">Subtotal</span>
                <span className="font-extrabold text-[#0B1A33]">{formatPrice(subtotal)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5B6880]">Factory Discount</span>
                  <span className="font-extrabold text-[#0B7A4B]">− {formatPrice(totalSavings)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5B6880]">Coupon Discount</span>
                  <span className="font-extrabold text-[#4338CA]">− {formatPrice(discountAmount)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#5B6880]">Loyalty Rewards ({loyaltyPoints} pts)</span>
                  <span className="font-extrabold text-[#0B7A4B]">− {formatPrice(loyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#5B6880]">Transport Delivery</span>
                <span className="font-extrabold text-[#0B1A33]">
                  {deliveryFee === 0 ? 'Free Delivery' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B6880]">GST Taxes</span>
                <span className="font-extrabold text-[#0B7A4B]">Included</span>
              </div>
            </div>

            <div className="h-px bg-[#EEF2F8]" />

            <div className="flex justify-between items-baseline">
              <span className="font-extrabold text-base text-[#0B1A33]">Final Payable</span>
              <span className="text-3xl font-extrabold font-poppins text-[#0B1A33] tracking-tight">
                {formatPrice(currentTotal)}
              </span>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handlePlaceOrder}
              className="h-14 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-base flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Placing Order...</span>
              ) : (
                <>
                  <span>Confirm Order</span>
                  <span>→</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-[#5B6880] text-center leading-relaxed">
              By confirming, you agree to our{' '}
              <Link href="/terms-conditions" className="text-[#4338CA] underline">Terms</Link>{' '}
              and{' '}
              <Link href="/refund-policy" className="text-[#4338CA] underline">Refund Policy</Link>.
            </span>
          </aside>
        </div>
      </main>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1A33]/50 backdrop-blur-sm grid place-items-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-[#FBFBFB] rounded-[32px] p-8 text-center flex flex-col items-center gap-4 shadow-2xl border border-white animate-[ktPop_0.45s_cubic-bezier(.2,.9,.2,1.1)_both]"
          >
            {/* Animated Ring / Checkmark */}
            <div className="relative w-20 h-20 mb-1">
              <div className="w-20 h-20 rounded-full bg-[#E3F7EE] text-[#10B26C] border-4 border-[#10B26C] flex items-center justify-center text-4xl shadow-md">
                ✓
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-[#0B1A33] font-poppins">
              Order Placed!
            </h2>

            <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-[#E8F9FF] text-[#0B5C86] border border-[#C4D9FF]">
              Ref #{placedOrderId}
            </span>

            <p className="text-sm text-[#3D4A63] leading-relaxed">
              Our sales manager will call <strong className="text-[#0B1A33] font-mono">+91 {formData.mobile}</strong> to confirm dispatch timing, freight carrier, and billing details.
            </p>

            <div className="flex flex-col gap-2.5 w-full mt-2">
              <Link
                href="/dashboard"
                onClick={() => setIsSuccessModalOpen(false)}
                className="h-12 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-sm flex items-center justify-center transition-colors shadow-xs"
              >
                View in Dashboard
              </Link>
              <Link
                href="/"
                onClick={() => setIsSuccessModalOpen(false)}
                className="h-11 rounded-full border border-[#D5DCE8] bg-white text-[#0B1A33] font-bold text-sm flex items-center justify-center hover:bg-[#E8F9FF] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
