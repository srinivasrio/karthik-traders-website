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
import ReferralDashboardView from '@/components/referral/ReferralDashboardView';
import DownloadInvoiceBtn from '@/components/invoice/DownloadInvoiceBtn';
import CustomerOrderDeliveryCard from '@/components/delivery/CustomerOrderDeliveryCard';

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
  delivery_state?: string;
  delivery_type?: string;
  delivery_estimated_days?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  driver_name?: string;
  driver_mobile?: string;
  vehicle_photo_url?: string;
  transport_name?: string;
  lr_number?: string;
  dispatched_at?: string;
  estimated_delivery_date?: string;
  order_items?: OrderItem[];
}

export default function DashboardPage() {
  const { user, profile, session, logout, loading } = useAuth();
  const { wallet, points: loyaltyPoints, rupeeValue: loyaltyRupeeValue, refreshLoyalty } = useLoyalty();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'loyalty' | 'referral'>('all');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Customer Referral Code in Profile
  const [customerReferralCode, setCustomerReferralCode] = useState<string>('');
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);

  useEffect(() => {
    if (profile?.referral_code) {
      setCustomerReferralCode(profile.referral_code.replace(/[^A-Z0-9]/g, ''));
    } else if (user?.id) {
      fetch('/api/referral/info')
        .then(res => res.json())
        .then(data => {
          if (data?.referral_code) {
            setCustomerReferralCode(data.referral_code.replace(/[^A-Z0-9]/g, ''));
          }
        })
        .catch(() => {});
    }
  }, [profile, user]);

  const copyReferral = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!customerReferralCode) return;
    navigator.clipboard.writeText(customerReferralCode);
    setCopiedReferralCode(true);
    setTimeout(() => setCopiedReferralCode(false), 2000);
  };

  const referralSignupLink = customerReferralCode
    ? `https://karthiktraders.in/login?tab=signup&ref=${customerReferralCode}`
    : 'https://karthiktraders.in';

  const profileWhatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `నమస్తే! నేను కార్తీక్ ట్రేడర్స్ (నెల్లూరు) నుండి రొయ్యల & చేపల చెరువుల మోటార్లు, ఏరియేటర్లు తీసుకుంటున్నాను. నా రిఫరల్ కోడ్ లేదా ఈ లింక్ ద్వారా సైన్ అప్ చేసి మీ మొదటి కొనుగోలుపై ఫ్లాట్ ₹500 డిస్కౌంట్ పొందండి:\n\n👉 రిఫరల్ కోడ్: ${customerReferralCode}\n👉 సైన్ అప్ లింక్: ${referralSignupLink}\n\nNamaste! I buy aqua pond aerators & motors from Karthik Traders. Sign up using my referral link ${referralSignupLink} (Code: ${customerReferralCode}) to get flat ₹500 OFF on your first purchase!`
  )}`;

  const copyReferralLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!referralSignupLink) return;
    navigator.clipboard.writeText(referralSignupLink);
    setCopiedReferralLink(true);
    setTimeout(() => setCopiedReferralLink(false), 2000);
  };

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
          delivery_state,
          delivery_type,
          delivery_estimated_days,
          vehicle_number,
          vehicle_type,
          driver_name,
          driver_mobile,
          vehicle_photo_url,
          transport_name,
          lr_number,
          dispatched_at,
          estimated_delivery_date,
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

              {/* Customer Referral Code Row in Profile Card */}
              {customerReferralCode && (
                <div className="p-4 rounded-2xl bg-white/80 border border-white/90 flex flex-col gap-3 shadow-2xs">
                  {/* Referral Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#3D4A63] flex items-center gap-1.5">
                      <span className="text-sm">🎁</span>
                      <span>Your Referral Code</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('referral')}
                      className="text-[11px] font-extrabold text-[#1450C8] hover:underline cursor-pointer"
                    >
                      Rewards Hub →
                    </button>
                  </div>

                  {/* Referral Code Bar with Copy Code */}
                  <div className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-[#D5DCE8]">
                    <span className="font-mono text-base font-black tracking-wider text-[#0B1A33]">
                      {customerReferralCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyReferral}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1A33] text-xs font-bold transition-all cursor-pointer active:scale-95 border border-slate-300/80"
                      title="Copy Referral Code"
                    >
                      {copiedReferralCode ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-emerald-700 font-extrabold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-[#5B6880]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Equal-Sized Action Buttons: Share on WhatsApp and Copy Link */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <a
                      href={profileWhatsappShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] w-full"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.176.582 4.218 1.599 5.979l-1.607 5.849 6.006-1.575c1.701.928 3.651 1.455 5.727 1.455 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <span className="truncate">Share WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={copyReferralLink}
                      className="h-11 px-3 rounded-xl bg-[#0B1A33] hover:bg-[#152848] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer w-full"
                      title="Copy Referral Signup Link"
                    >
                      {copiedReferralLink ? (
                        <>
                          <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-emerald-300 font-extrabold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 shrink-0 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="truncate">Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reward Footnote */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-[#5B6880]">
                    <span>Friend gets: <strong className="text-emerald-700 font-bold">₹500 OFF</strong></span>
                    <span>You earn: <strong className="text-[#0B1A33] font-bold">1,000 Pts (₹250)</strong></span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="w-full h-11 rounded-2xl bg-linear-to-r from-purple-700 via-indigo-600 to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 hover:from-purple-800 hover:to-indigo-800 transition-all cursor-pointer"
                  >
                    <span>Admin Panel</span>
                    <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded-full">
                      Admin Access
                    </span>
                  </Link>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/complete-profile"
                    className="h-10 rounded-full bg-[#E8F9FF] text-[#0B1A33] font-bold text-xs flex items-center justify-center hover:bg-white transition-colors border border-sky-200/60"
                  >
                    Edit profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="h-10 rounded-full border border-rose-200 bg-white text-[#B4123A] font-bold text-xs flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer"
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

            {/* Refer & Earn Banner Card */}
            <div className="rounded-[24px] bg-linear-to-br from-indigo-600 via-blue-600 to-sky-600 text-white p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-100 flex items-center gap-1.5 font-poppins">
                  <span>🎁</span>
                  <span>Refer & Earn 1% Credit</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Farmer Referral
                </span>
              </div>
              <p className="text-xs text-sky-100 leading-relaxed">
                Give fellow farmers ₹500 off their first order. You earn 1% of their delivered order value in Loyalty Points credit!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('referral')}
                className="w-full h-8 rounded-xl bg-white text-blue-900 font-extrabold text-xs flex items-center justify-center hover:bg-sky-50 transition-colors shadow-2xs cursor-pointer"
              >
                Share on WhatsApp →
              </button>
            </div>

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
                  { id: 'referral', label: 'Refer & Earn 🎁' },
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

            {/* Referral / Loyalty View or Orders Feed */}
            {activeTab === 'referral' ? (
              <ReferralDashboardView onTabSwitch={(tab) => setActiveTab(tab as any)} />
            ) : activeTab === 'loyalty' ? (
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

                          {/* State Delivery Policy & Dispatched Vehicle Transparency Card */}
                          <CustomerOrderDeliveryCard order={order} />

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
          className="fixed inset-0 z-50 bg-[#0B1A33]/60 backdrop-blur-xs grid place-items-center p-2 sm:p-4 overflow-y-auto"
          onClick={() => setInvoiceOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl max-h-[94vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-7 flex flex-col gap-4 sm:gap-6 animate-[ktUp_0.3s_both] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Header Bar with Close Button */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-[#0B1A33] truncate">
                  Proforma Invoice Preview
                </span>
                <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-[#0A1F5C] shrink-0">
                  #KT-{invoiceOrder.order_number || invoiceOrder.id.slice(0, 6)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0B1A33] flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition-colors"
                aria-label="Close Preview"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions (Download PDF & Print) */}
            <div className="flex items-center gap-2 pb-1">
              <div className="flex-1 sm:flex-initial">
                <DownloadInvoiceBtn order={invoiceOrder} variant="customer" />
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 px-4 rounded-full bg-[#E8F9FF] hover:bg-[#D4F1FF] text-[#0B5C86] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <span>🖨️ Print</span>
              </button>
            </div>

            {/* Invoice Document Card */}
            <div className="flex flex-col gap-4 sm:gap-5 text-xs sm:text-sm border border-slate-200 rounded-2xl p-4 sm:p-5 bg-white shadow-2xs">
              {/* Header: Logo on Top Left + Structured Info + Invoice Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                {/* Top Left: Logo + Company Name & Tagline */}
                <div className="flex items-start gap-3">
                  <img
                    src="/images/logo-small.png"
                    alt="Karthik Traders Logo"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-xl border border-slate-200 p-1 bg-slate-50 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#0A1F5C] tracking-tight font-poppins leading-tight">
                      KARTHIK TRADERS
                    </h3>
                    <p className="text-[10.5px] font-bold text-[#1D64EC] uppercase tracking-wide mt-0.5">
                      Aquaculture aerators and spare parts
                    </p>
                    <p className="text-[11px] text-[#5B6880] leading-relaxed mt-1.5">
                      Shop No. 13, Opp. Madhura Sweets Line, Near MRF Tyres Line,<br />
                      Subedar Pet, Nellore - 524001, Andhra Pradesh
                    </p>
                    {/* Customer Support details arranged up and below it */}
                    <div className="mt-2 flex flex-col gap-0.5 text-[11px]">
                      <span className="font-bold text-[#0B1A33]">
                        Customer Support: +91 86885 66023, +91 91776 57576
                      </span>
                      <span className="font-bold text-[#0B1A33]">
                        Email: karthiktrader111@gmail.com
                      </span>
                      <span className="font-extrabold text-[#0A1F5C] mt-0.5">
                        GSTIN: 37AFGPY0727H1Z6
                      </span>
                    </div>
                  </div>
                </div>

                {/* Invoice Metadata Box */}
                <div className="flex flex-row sm:flex-col justify-between sm:items-end items-center bg-[#F8FAFC] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 shrink-0">
                  <div className="sm:text-right">
                    <span className="inline-block px-3 py-1 bg-[#0A1F5C] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                      PROFORMA INVOICE
                    </span>
                    <span className="text-[9.5px] text-slate-500 uppercase tracking-wide block mt-0.5">
                      Tax invoice will be given during delivery
                    </span>
                  </div>
                  <div className="text-right sm:mt-2">
                    <span className="text-xs font-mono font-extrabold text-[#0A1F5C] block">
                      KT-INV-{String(invoiceOrder.order_number || invoiceOrder.id.slice(0, 6)).padStart(5, '0')}
                    </span>
                    <span className="text-[11px] text-[#5B6880] block">
                      Date:{' '}
                      {new Date(invoiceOrder.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`inline-block mt-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        (invoiceOrder.payment_status || '').toLowerCase() === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Payment: {(invoiceOrder.payment_status || 'PENDING').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To & Shipping Address Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                    Billed To / Customer Details
                  </span>
                  <strong className="block text-sm text-[#0B1A33]">{invoiceOrder.customer_name || userName}</strong>
                  <span className="text-slate-600 font-mono block mt-0.5">
                    Mobile: {invoiceOrder.customer_mobile || userPhone || 'Not specified'}
                  </span>
                  <span className="text-slate-500 block">State: Andhra Pradesh (37)</span>
                </div>
                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                    Shipping / Delivery Address
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {[
                      invoiceOrder.shipping_address?.addressLine1 || invoiceOrder.shipping_address?.address || '',
                      invoiceOrder.shipping_address?.city || '',
                      invoiceOrder.shipping_address?.state || '',
                      invoiceOrder.shipping_address?.pincode || '',
                    ].filter(Boolean).join(', ') || 'Standard Farm Delivery'}
                  </p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Dispatch: Nellore Central Warehouse (AP)
                  </span>
                </div>
              </div>

              {/* Items Section: Structured Mobile Cards (sm:hidden) */}
              <div className="sm:hidden flex flex-col gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Order Items ({invoiceOrder.order_items?.length || 0})
                </span>
                {(invoiceOrder.order_items || []).map((l, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs text-[#0B1A33] leading-snug">
                        <span className="text-slate-400 font-mono mr-1.5">#{idx + 1}</span>
                        {l.product?.name || 'Aerator Product'}
                      </span>
                      <span className="font-extrabold text-sm text-[#0A1F5C] font-mono shrink-0">
                        {formatPrice(l.quantity * l.price_at_purchase)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono">
                      <span>Qty: <strong className="text-slate-800">{l.quantity}</strong></span>
                      <span>Rate: {formatPrice(l.price_at_purchase)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Items Section: Desktop Table (hidden sm:block) */}
              <div className="hidden sm:block rounded-xl border border-slate-200 overflow-hidden text-xs">
                <div className="grid grid-cols-12 p-3 font-extrabold bg-[#0A1F5C] text-white">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-5">Description of Goods</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {(invoiceOrder.order_items || []).map((l, idx) => (
                    <div key={idx} className={`grid grid-cols-12 p-3 items-center ${idx % 2 === 1 ? 'bg-[#F8FAFC]' : ''}`}>
                      <span className="col-span-1 text-center text-slate-500">{idx + 1}</span>
                      <span className="col-span-5 font-bold text-[#0B1A33]">
                        {l.product?.name || 'Aerator Product'}
                      </span>
                      <span className="col-span-2 text-center font-mono">{l.quantity}</span>
                      <span className="col-span-2 text-right font-mono text-slate-600">
                        {formatPrice(l.price_at_purchase)}
                      </span>
                      <span className="col-span-2 text-right font-mono font-bold text-[#0A1F5C]">
                        {formatPrice(l.quantity * l.price_at_purchase)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary & Official Seal */}
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 pt-2">
                {/* Official Seal and Computer Generated Note */}
                <div className="order-2 sm:order-1 flex items-center gap-3 text-left w-full sm:w-auto">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-[#0A1F5C]/60 text-[#0A1F5C] flex flex-col items-center justify-center text-[8.5px] sm:text-[9px] font-extrabold text-center rotate-[-6deg] uppercase tracking-wider p-2 bg-[#F8FAFC] shrink-0">
                    <span>Karthik Traders</span>
                    <span className="text-[7px] sm:text-[7.5px] font-semibold text-slate-500">Nellore, AP</span>
                    <span className="text-[6.5px] sm:text-[7px] text-emerald-700 font-extrabold mt-0.5">Official Seal</span>
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-[220px] leading-relaxed">
                    This is a computer-generated proforma invoice. Official GST Tax Invoice will be given during delivery.
                  </div>
                </div>

                {/* Financial Totals Breakdown */}
                {(() => {
                  const couponDisc = Number(invoiceOrder.discount_amount || 0);
                  const loyaltyDisc = Number(invoiceOrder.loyalty_discount_amount || 0);
                  const loyaltyPts = Number(invoiceOrder.loyalty_points_redeemed || 0);
                  const total = Number(invoiceOrder.total_amount || 0);
                  const subtotal = total + couponDisc + loyaltyDisc;

                  return (
                    <div className="order-1 sm:order-2 w-full sm:w-auto sm:min-w-[280px] p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal (MRP/Gross):</span>
                        <span className="font-mono font-bold text-slate-900">{formatPrice(subtotal)}</span>
                      </div>
                      {couponDisc > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Coupon ({invoiceOrder.coupon_code || 'APPLIED'}):</span>
                          <span className="font-mono">− {formatPrice(couponDisc)}</span>
                        </div>
                      )}
                      {loyaltyDisc > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Loyalty Rewards ({loyaltyPts.toLocaleString()} pts):</span>
                          <span className="font-mono">− {formatPrice(loyaltyDisc)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>GST (Taxes Included):</span>
                        <span>Included in Price</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-[#0A1F5C] text-white font-extrabold mt-1">
                        <span className="text-xs uppercase tracking-wide">Net Amount Payable:</span>
                        <span className="text-base font-poppins">{formatPrice(total)}</span>
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
