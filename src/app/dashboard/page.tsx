'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLoyalty } from '@/context/LoyaltyContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/data/products';
import SimpleLoadingScreen from '@/components/ui/SimpleLoadingScreen';
import LoyaltyCustomerView from '@/components/dashboard/LoyaltyCustomerView';
import DownloadInvoiceBtn from '@/components/invoice/DownloadInvoiceBtn';

interface OrderItem {
  quantity: number;
  price_at_purchase: number;
  product?: {
    name: string;
    slug: string;
  };
  product_id?: string;
}

interface Order {
  id: string;
  order_number?: number;
  created_at: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  discount_amount: number;
  coupon_code?: string;
  loyalty_points_redeemed?: number;
  loyalty_discount_amount?: number;
  customer_name: string;
  customer_mobile?: string;
  shipping_address?: any;
  created_by_admin?: boolean;
  order_items?: OrderItem[];
}

export default function DashboardPage() {
  const { user, profile, session, logout, loading } = useAuth();
  const { wallet, points: loyaltyPoints, rupeeValue: loyaltyRupeeValue, refreshLoyalty } = useLoyalty();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'loyalty'>('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (profile?.mobile || user?.id) {
      fetchOrders();
    } else if (!loading && user) {
      fetchOrders();
    }
  }, [profile, user, loading]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: productsData } = await supabase.from('products').select('id, name, slug');
      const productMap = new Map();
      if (productsData) {
        productsData.forEach((p) => {
          productMap.set(p.id, p);
          productMap.set(p.slug, p);
        });
      }

      const userId = user?.id;
      const rawMobile = profile?.mobile || user?.phone || '';
      const normalizedMobile = rawMobile.replace(/\D/g, '');
      const last10Digits = normalizedMobile.slice(-10);

      const orConditions: string[] = [];
      if (userId) orConditions.push(`user_id.eq.${userId}`);
      if (last10Digits) orConditions.push(`customer_mobile.like.*${last10Digits}`);

      let query = supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          created_at, 
          status, 
          payment_status,
          total_amount, 
          discount_amount, 
          coupon_code, 
          loyalty_points_redeemed,
          loyalty_discount_amount,
          customer_name, 
          customer_mobile, 
          shipping_address, 
          order_items(product_id, quantity, price_at_purchase)
        `)
        .order('created_at', { ascending: false });

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }

      const { data, error } = await query;
      if (!error && data) {
        const enriched = data.map((o: any) => {
          const items = (o.order_items || []).map((item: any) => ({
            ...item,
            product: productMap.get(item.product_id) || {
              name: 'Aquaculture Product',
              slug: '',
            },
          }));
          return { ...o, order_items: items };
        });
        setOrders(enriched);
        if (enriched.length > 0) {
          setExpandedOrder(enriched[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const userName = profile?.name || user?.user_metadata?.full_name || 'Valued Farmer';
  const userPhone = profile?.mobile || user?.phone || '';
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isAdmin =
    profile?.role === 'admin' ||
    user?.user_metadata?.role === 'admin' ||
    user?.email?.includes('admin') ||
    ['+918688566023', '+916301183738', '+919515816084', '8688566023', '6301183738', '9515816084'].includes(
      (profile?.mobile || user?.phone || '').replace(/\s+/g, '')
    );

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = (o.status || 'Pending').toLowerCase();
      if (activeTab === 'all') return true;
      if (activeTab === 'active')
        return ['pending', 'confirmed', 'processing', 'partially fulfilled', 'shipped'].includes(s);
      if (activeTab === 'completed') return s === 'delivered' || s === 'completed';
      if (activeTab === 'cancelled') return s === 'cancelled';
      return true;
    });
  }, [orders, activeTab]);

  const totalSaved = useMemo(() => {
    const orderSavings = orders.reduce(
      (sum, o) => sum + Number(o.discount_amount || 0) + Number(o.loyalty_discount_amount || 0),
      0
    );
    const paisePerPt = Number(wallet?.settings?.paise_per_point || 100);
    const lifetimeRedeemedPts = Number(wallet?.lifetime_redeemed_points || 0);
    const lifetimePointsRupees = Math.round((lifetimeRedeemedPts * paisePerPt) / 100);
    return Math.max(orderSavings, lifetimePointsRupees, orderSavings + (orderSavings === 0 ? lifetimePointsRupees : 0));
  }, [orders, wallet]);

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'delivered':
      case 'completed':
        return { bg: '#E3F7EE', fg: '#0B7A4B', dot: '#0B7A4B' };
      case 'confirmed':
        return { bg: '#DDE8FF', fg: '#1D4ED8', dot: '#1D4ED8' };
      case 'processing':
        return { bg: '#EFE9FF', fg: '#6D28D9', dot: '#6D28D9' };
      case 'cancelled':
        return { bg: '#FFE4EA', fg: '#B4123A', dot: '#B4123A' };
      default:
        return { bg: '#EEF0F5', fg: '#475569', dot: '#64748B' };
    }
  };

  const steps = ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered'];
  const getStepIndex = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'shipped' || s === 'dispatched') return 3;
    if (s === 'processing') return 2;
    if (s === 'confirmed') return 1;
    return 0;
  };

  if (loading) {
    return <SimpleLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#0B1A33] pb-24">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Profile Card & Shortcuts */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
            {/* User Profile Card */}
            <div className="rounded-[28px] bg-[#C4D9FF] text-[#0B1A33] p-6 sm:p-7 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="w-14 h-14 rounded-2xl bg-[#C5BAFF] text-[#0B1A33] font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
                  {userInitials}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-lg truncate font-poppins">
                    {userName}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#3D4A63] truncate">
                    {userPhone || '+91 86885 66023'}
                  </span>
                </div>
              </div>

              {/* Profile Meta Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[#5B6880] block font-bold">Region</span>
                  <span className="font-extrabold text-[#0B1A33] truncate block">
                    {profile?.city || 'Nellore, AP'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/60">
                  <span className="text-[#5B6880] block font-bold">Category</span>
                  <span className="font-extrabold text-[#0B1A33] truncate block">
                    Aquaculture Farmer
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full h-11 rounded-2xl bg-linear-to-r from-purple-700 via-indigo-600 to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 hover:from-purple-800 hover:to-indigo-800 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>Admin Panel</span>
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded-full">
                      Admin Access
                    </span>
                  </Link>
                )}
                <div className="flex gap-2">
                  <Link
                    href="/complete-profile"
                    className="flex-1 h-10 rounded-full bg-[#E8F9FF] text-[#0B1A33] font-bold text-xs flex items-center justify-center hover:bg-white transition-colors"
                  >
                    Edit profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex-1 h-10 rounded-full border border-black/15 bg-transparent text-[#B4123A] font-bold text-xs flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Loyalty Wallet Summary Card - Loads instantly from cached context */}
            {wallet && (wallet.settings?.is_enabled ?? true) && (
              <div className="rounded-[24px] bg-linear-to-br from-amber-500 via-yellow-500 to-amber-600 text-white p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100 flex items-center gap-1.5 font-poppins">
                    <span>🪙</span>
                    <span>Loyalty Points</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    Karthik Rewards
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold font-poppins tracking-tight">
                      {loyaltyPoints.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-amber-100 ml-1">pts</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-100">Worth</span>{' '}
                    <span className="text-lg font-extrabold font-poppins">
                      ₹{loyaltyRupeeValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {(wallet?.expiring_soon_points || 0) > 0 && (
                  <div className="text-[11px] bg-black/20 px-2.5 py-1 rounded-lg text-amber-100">
                    ⚠️ {wallet.expiring_soon_points} pts expiring soon!
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('loyalty')}
                  className="w-full h-8 rounded-xl bg-white text-amber-900 font-extrabold text-xs flex items-center justify-center hover:bg-amber-50 transition-colors shadow-2xs cursor-pointer mt-1"
                >
                  View Rewards Ledger →
                </button>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#E3E8F0] shadow-2xs">
                <span className="text-xs font-bold text-[#5B6880]">Total Orders</span>
                <span className="text-2xl font-extrabold font-poppins text-[#0B1A33] block mt-1">
                  {orders.length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#E3E8F0] shadow-2xs">
                <span className="text-xs font-bold text-[#5B6880]">Total Saved</span>
                <span className="text-2xl font-extrabold font-poppins text-[#0B7A4B] block mt-1">
                  {formatPrice(totalSaved)}
                </span>
              </div>
            </div>
          </aside>

          {/* Right Column: Order History List */}
          <section className="lg:col-span-8 flex flex-col gap-5 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-extrabold font-poppins text-[#0B1A33] tracking-tight">
              Order History
            </h1>

            {/* Status Filter Tabs */}
            <div className="flex gap-1.5 p-1 rounded-full bg-[#EEF2F8] shadow-2xs max-w-full overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'All Orders' },
                  { id: 'active', label: 'Active' },
                  { id: 'completed', label: 'Delivered' },
                  { id: 'cancelled', label: 'Cancelled' },
                  { id: 'loyalty', label: 'Rewards & Points 🪙' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`h-9 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-[#0B1A33] shadow-xs'
                        : 'text-[#5B6880] hover:text-[#0B1A33]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Loyalty View or Orders Feed */}
            {activeTab === 'loyalty' ? (
              <LoyaltyCustomerView
                loyaltyData={wallet}
                loading={false}
                onRefresh={refreshLoyalty}
              />
            ) : loadingOrders ? (
              <div className="p-12 text-center text-sm font-medium text-[#5B6880]">
                Loading your orders from Nellore warehouse...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-[#E3E8F0] shadow-2xs flex flex-col items-center gap-3">
                <span className="text-3xl">📦</span>
                <h3 className="text-lg font-extrabold text-[#0B1A33]">
                  No orders in this view
                </h3>
                <p className="text-xs text-[#5B6880] max-w-xs">
                  Browse aerator sets and spares to start ordering directly with wholesale terms.
                </p>
                <Link
                  href="/aerator-sets"
                  className="mt-2 h-10 px-5 rounded-full bg-[#C4D9FF] text-[#0B1A33] font-extrabold text-xs inline-flex items-center hover:bg-[#24365A] hover:text-white transition-colors"
                >
                  Shop Aerator Sets
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredOrders.map((order) => {
                  const isOpen = expandedOrder === order.id;
                  const st = getStatusColor(order.status);
                  const currentStepIdx = getStepIndex(order.status);
                  const orderRef = order.order_number
                    ? `KT-${order.order_number}`
                    : `KT-${order.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <article
                      key={order.id}
                      className="rounded-[24px] bg-white border border-[#E3E8F0] overflow-hidden shadow-xs"
                    >
                      {/* Card Header Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                        className="w-full flex flex-wrap items-center gap-3 p-4 sm:p-5 text-left hover:bg-[#FBFBFB] transition-colors cursor-pointer"
                      >
                        <span className="font-mono text-sm font-bold text-[#0B1A33]">
                          #{orderRef}
                        </span>

                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                          style={{ backgroundColor: st.bg, color: st.fg }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: st.dot }}
                          />
                          {order.status || 'Pending'}
                        </span>

                        <span className="text-xs text-[#5B6880] font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          · {order.order_items?.length || 1} item(s)
                        </span>

                        <span className="ml-auto font-extrabold text-base text-[#0B1A33] font-poppins">
                          {formatPrice(order.total_amount)}
                        </span>

                        <span
                          className={`w-7 h-7 rounded-full bg-[#EEF2F8] flex items-center justify-center text-xs transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        >
                          ⌄
                        </span>
                      </button>

                      {/* Card Expanded Details */}
                      {isOpen && (
                        <div className="p-4 sm:p-6 border-t border-[#EEF2F8] flex flex-col gap-5 animate-[ktUp_0.3s_both]">
                          {/* Step Progress Bar */}
                          {order.status?.toLowerCase() !== 'cancelled' && (
                            <div className="grid grid-cols-5 gap-2 p-3.5 rounded-2xl bg-[#FBFBFB] border border-[#EEF2F8]">
                              {steps.map((stLabel, idx) => {
                                const passed = idx <= currentStepIdx;
                                return (
                                  <div key={stLabel} className="flex flex-col gap-1.5">
                                    <div
                                      className={`h-1.5 rounded-full transition-colors ${
                                        passed ? 'bg-[#10B26C]' : 'bg-[#E2E8F0]'
                                      }`}
                                    />
                                    <span
                                      className={`text-[10px] sm:text-xs font-bold leading-tight ${
                                        passed ? 'text-[#0B7A4B]' : 'text-[#94A3B8]'
                                      }`}
                                    >
                                      {stLabel}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Line Items Table */}
                          <div className="rounded-xl border border-[#EEF2F8] overflow-hidden divide-y divide-[#EEF2F8] text-xs sm:text-sm">
                            {(order.order_items || []).map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className="flex items-center justify-between p-3"
                              >
                                <div>
                                  <span className="font-bold text-[#0B1A33] block">
                                    {line.product?.name || 'Aerator Set or Part'}
                                  </span>
                                  <span className="font-mono text-xs text-[#5B6880]">
                                    {line.quantity} × {formatPrice(line.price_at_purchase)}
                                  </span>
                                </div>
                                <span className="font-extrabold text-[#0B1A33] font-poppins">
                                  {formatPrice(line.quantity * line.price_at_purchase)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Delivery Address & Financial Summary */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                            <div className="p-3.5 rounded-xl bg-[#E8F9FF] flex flex-col gap-1">
                              <span className="text-[11px] font-extrabold text-[#5B6880] tracking-wider uppercase">
                                DELIVERY ADDRESS
                              </span>
                              <span className="text-xs leading-relaxed text-[#0B1A33] font-medium">
                                {typeof order.shipping_address === 'object'
                                  ? `${order.shipping_address?.addressLine1 || ''}, ${
                                      order.shipping_address?.city || ''
                                    }, ${order.shipping_address?.state || ''} ${
                                      order.shipping_address?.pincode || ''
                                    }`
                                  : String(order.shipping_address || 'Nellore, AP')}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#FBFBFB] border border-[#EEF2F8] flex flex-col gap-1.5">
                              {order.discount_amount > 0 && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#5B6880]">Discount ({order.coupon_code || 'COUPON'})</span>
                                  <span className="font-bold text-[#0B7A4B]">
                                    − {formatPrice(order.discount_amount)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-extrabold pt-1 border-t border-[#EEF2F8]">
                                <span>Total Paid / Payable</span>
                                <span className="text-sm font-poppins text-[#0B1A33]">
                                  {formatPrice(order.total_amount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setInvoiceOrder(order)}
                              className="h-10 px-4 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-extrabold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>📄 Invoice Preview</span>
                            </button>
                            <DownloadInvoiceBtn order={order} variant="customer" />
                            <a
                              href={`https://wa.me/918688566023?text=${encodeURIComponent(
                                `Hi Karthik Traders, inquiring regarding Order #${orderRef}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-10 px-4 rounded-full border border-[#D5DCE8] hover:bg-[#E8F9FF] text-[#0B1A33] font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                            >
                              <span>💬 Ask on WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* GST Invoice Preview Modal */}
      {invoiceOrder && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1A33]/50 backdrop-blur-xs grid place-items-center p-4"
          onClick={() => setInvoiceOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-white p-6 sm:p-8 flex flex-col gap-6 animate-[ktUp_0.3s_both]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Bar */}
            <div className="flex justify-between items-center pb-4 border-b border-[#E3E8F0]">
              <span className="font-extrabold text-base text-[#0B1A33]">
                Tax Invoice Preview · #KT-{invoiceOrder.order_number || invoiceOrder.id.slice(0, 6)}
              </span>
              <div className="flex items-center gap-2">
                <DownloadInvoiceBtn order={invoiceOrder} variant="customer" />
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 rounded-full bg-[#C4D9FF] hover:bg-[#24365A] hover:text-white text-[#0B1A33] font-bold text-xs cursor-pointer"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="w-8 h-8 rounded-full bg-[#EEF2F8] text-[#0B1A33] flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Invoice Document Content */}
            <div className="flex flex-col gap-5 text-xs sm:text-sm">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0B1A33] tracking-tight font-poppins">
                    KARTHIK TRADERS
                  </h3>
                  <p className="text-xs text-[#5B6880] leading-relaxed max-w-xs mt-1">
                    Shop no 13, Opp. Madhura Sweets Line, Near MRF Tyres Line,<br />
                    Subedar Pet, Nellore - 524001, Andhra Pradesh<br />
                    GSTIN: 37AFGPY0727H1Z6 · Ph: +91 86885 66023
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-[#0B1A33] block">
                    TAX INVOICE
                  </span>
                  <span className="font-mono text-xs text-[#5B6880] block">
                    Date:{' '}
                    {new Date(invoiceOrder.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-[11px] font-bold text-[#1450C8] uppercase block mt-1">
                    Status: {invoiceOrder.payment_status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Billed To */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#EEF2F8]">
                <strong className="block text-[#0B1A33] mb-1">Billed to:</strong>
                <span>{invoiceOrder.customer_name || userName}</span> ·{' '}
                <span className="font-mono">{invoiceOrder.customer_mobile || userPhone}</span>
                {invoiceOrder.shipping_address && (
                  <div className="text-xs text-[#5B6880] mt-1">
                    {[
                      invoiceOrder.shipping_address.addressLine1 || invoiceOrder.shipping_address.address || '',
                      invoiceOrder.shipping_address.city || '',
                      invoiceOrder.shipping_address.state || '',
                      invoiceOrder.shipping_address.pincode || '',
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-[#EEF2F8] overflow-hidden text-xs">
                <div className="grid grid-cols-12 p-3 font-extrabold bg-[#E8F9FF] text-[#0B5C86]">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>
                <div className="divide-y divide-[#EEF2F8]">
                  {(invoiceOrder.order_items || []).map((l, idx) => (
                    <div key={idx} className="grid grid-cols-12 p-3 items-center">
                      <span className="col-span-1 text-center text-[#5B6880]">{idx + 1}</span>
                      <span className="col-span-5 font-bold text-[#0B1A33]">
                        {l.product?.name || 'Aerator Product'}
                      </span>
                      <span className="col-span-2 text-center font-mono">{l.quantity}</span>
                      <span className="col-span-2 text-right font-mono">
                        {formatPrice(l.price_at_purchase)}
                      </span>
                      <span className="col-span-2 text-right font-mono font-bold">
                        {formatPrice(l.quantity * l.price_at_purchase)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stamp and Total Breakdown */}
              <div className="flex flex-wrap justify-between items-end gap-4 pt-2">
                <div className="w-28 h-28 rounded-full border-2 border-dashed border-[#4338CA] text-[#4338CA] flex items-center justify-center text-[10px] font-extrabold text-center rotate-[-8deg] uppercase tracking-wider p-2">
                  Karthik Traders<br />Nellore<br />Official Seal
                </div>

                {(() => {
                  const couponDisc = Number(invoiceOrder.discount_amount || 0);
                  const loyaltyDisc = Number(invoiceOrder.loyalty_discount_amount || 0);
                  const loyaltyPts = Number(invoiceOrder.loyalty_points_redeemed || 0);
                  const total = Number(invoiceOrder.total_amount || 0);
                  const subtotal = total + couponDisc + loyaltyDisc;

                  return (
                    <div className="min-w-[240px] flex flex-col gap-1.5 text-right text-xs">
                      <div className="flex justify-between text-[#5B6880]">
                        <span>Subtotal (MRP/Gross)</span>
                        <span className="font-mono font-bold text-[#0B1A33]">{formatPrice(subtotal)}</span>
                      </div>
                      {couponDisc > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Coupon ({invoiceOrder.coupon_code || 'APPLIED'})</span>
                          <span className="font-mono">− {formatPrice(couponDisc)}</span>
                        </div>
                      )}
                      {loyaltyDisc > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Loyalty Points ({loyaltyPts} pts)</span>
                          <span className="font-mono">− {formatPrice(loyaltyDisc)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#5B6880] text-[11px]">
                        <span>GST Taxes</span>
                        <span>Included</span>
                      </div>
                      <div className="flex justify-between font-extrabold text-base text-[#0B1A33] pt-1.5 border-t border-[#EEF2F8]">
                        <span>Total Payable</span>
                        <span className="font-poppins">{formatPrice(total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal Confirmation */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1A33]/40 backdrop-blur-xs grid place-items-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E3E8F0] animate-[ktUp_0.25s_both]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-extrabold text-[#0B1A33] font-poppins mb-2">
              Log out?
            </h3>
            <p className="text-sm text-[#5B6880] mb-6">
              You can log back in with your mobile number at any time to view your orders.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="h-10 px-4 rounded-full border border-[#D5DCE8] bg-white text-xs font-bold text-[#0B1A33] hover:bg-[#FBFBFB] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setShowLogoutConfirm(false);
                  router.push('/login');
                }}
                className="h-10 px-5 rounded-full bg-[#D61F4A] text-white text-xs font-bold hover:bg-[#B4123A] cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
