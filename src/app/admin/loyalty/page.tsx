'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { auth as firebaseAuth } from '@/lib/firebase';
import { formatPrice } from '@/data/products';
import {
    SparklesIcon,
    Cog6ToothIcon,
    UsersIcon,
    TicketIcon,
    ClockIcon,
    ClipboardDocumentListIcon,
    ShieldCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    PlusIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    GiftIcon,
} from '@heroicons/react/24/outline';

export default function AdminLoyaltyPage() {
    const { session } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'referrals' | 'wallets' | 'promotions' | 'transactions' | 'audit'>('overview');
    const [loading, setLoading] = useState(true);

    // Settings state
    const [settings, setSettings] = useState<any>({
        is_enabled: true,
        signup_bonus_points: 50,
        earning_percentage: 1.0,
        rupees_spent_per_point: 100,
        paise_per_point: 25,
        min_cart_subtotal_paise: 500000,
        min_points_to_redeem: 50,
        max_redemption_percentage: 20,
        max_points_per_order: 2000,
        expiry_days: 365,
        referral_enabled: true,
        referral_earning_percentage: 1.0,
        referral_discount_rupees: 500,
        referral_bonus_points: 1000,
        referral_min_order_rupees: 5000,
    });
    const [confirmSaveModal, setConfirmSaveModal] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    // Referrals state
    const [referrals, setReferrals] = useState<any[]>([]);
    const [referralsSearch, setReferralsSearch] = useState('');
    const [referralStatusFilter, setReferralStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');

    // Wallets state
    const [wallets, setWallets] = useState<any[]>([]);
    const [walletsSearch, setWalletsSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjustPoints, setAdjustPoints] = useState<string>('');
    const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjusting, setAdjusting] = useState(false);

    // Promotions state
    const [promotions, setPromotions] = useState<any[]>([]);
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [newPromo, setNewPromo] = useState({
        name: '',
        code: '',
        description: '',
        promotion_type: 'multiplier',
        bonus_value: 2.0,
        min_cart_subtotal_rupees: 5000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_active: true,
    });

    // Transactions state
    const [transactions, setTransactions] = useState<any[]>([]);
    const [txFilterType, setTxFilterType] = useState('');

    // Audit logs state
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // Expiry trigger state
    const [expiring, setExpiring] = useState(false);
    const [expiryResult, setExpiryResult] = useState<any>(null);

    // Notification toast
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        let token = session?.access_token;
        if (!token) {
            try {
                const { data } = await supabase.auth.getSession();
                token = data?.session?.access_token;
            } catch (e) {
                // Ignore
            }
        }
        if (!token) {
            try {
                const fbUser = firebaseAuth.currentUser;
                if (fbUser) {
                    token = await fbUser.getIdToken();
                }
            } catch (e) {
                // Ignore
            }
        }
        return {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    // Load initial data
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const headers = await getAuthHeaders();

            // 1. Fetch settings
            const settingsRes = await fetch('/api/admin/loyalty/settings', { headers });
            if (settingsRes.ok) {
                const sData = await settingsRes.json();
                if (sData.settings) setSettings(sData.settings);
            }

            // 2. Fetch referrals
            const refRes = await fetch('/api/admin/loyalty/referrals', { headers });
            if (refRes.ok) {
                const rData = await refRes.json();
                setReferrals(rData.referrals || []);
            }

            // 3. Fetch wallets
            const walletsRes = await fetch('/api/admin/loyalty/wallets?limit=50', { headers });
            if (walletsRes.ok) {
                const wData = await walletsRes.json();
                setWallets(wData.wallets || []);
            }

            // 4. Fetch promotions
            const promoRes = await fetch('/api/admin/loyalty/promotions', { headers });
            if (promoRes.ok) {
                const pData = await promoRes.json();
                setPromotions(pData.promotions || []);
            }

            // 5. Fetch transactions
            const txRes = await fetch('/api/admin/loyalty/transactions?limit=50', { headers });
            if (txRes.ok) {
                const tData = await txRes.json();
                setTransactions(tData.transactions || []);
            }

            // 6. Fetch audit logs
            const auditRes = await fetch('/api/admin/loyalty/audit?limit=50', { headers });
            if (auditRes.ok) {
                const aData = await auditRes.json();
                setAuditLogs(aData.auditLogs || []);
            }
        } catch (err: any) {
            console.error('Error fetching admin loyalty data:', err);
            showNotice('Failed to load some loyalty data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [session?.access_token]);

    // Handle Settings Update
    const handleSaveSettings = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setSavingSettings(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/admin/loyalty/settings', {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    settings,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showNotice('Loyalty settings updated successfully!');
                setConfirmSaveModal(false);
                fetchAllData();
            } else {
                showNotice(data.error || 'Failed to update settings', 'error');
            }
        } catch (err: any) {
            showNotice(err.message || 'Error updating settings', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    // Handle Manual Adjustment
    const handleAdjustSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        const pts = parseInt(adjustPoints, 10);
        if (isNaN(pts) || pts <= 0) {
            showNotice('Enter a valid positive number of points', 'error');
            return;
        }
        if (!adjustReason.trim()) {
            showNotice('Mandatory adjustment reason is required', 'error');
            return;
        }

        const signedPoints = adjustType === 'credit' ? pts : -pts;
        setAdjusting(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/admin/loyalty/adjust', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: selectedCustomer.userId,
                    points: signedPoints,
                    reason: adjustReason.trim(),
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showNotice(`Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ${pts} points`);
                setAdjustModalOpen(false);
                setAdjustPoints('');
                setAdjustReason('');
                setSelectedCustomer(null);
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('loyalty:refresh'));
                }
                fetchAllData();
            } else {
                showNotice(data.error || 'Adjustment failed', 'error');
            }
        } catch (err: any) {
            showNotice(err.message || 'Adjustment error', 'error');
        } finally {
            setAdjusting(false);
        }
    };

    // Handle Create Promotion
    const handleCreatePromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/admin/loyalty/promotions', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...newPromo,
                    min_cart_subtotal_paise: Math.round(Number(newPromo.min_cart_subtotal_rupees) * 100),
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showNotice('Promotional campaign created!');
                setPromoModalOpen(false);
                setNewPromo({
                    name: '',
                    code: '',
                    description: '',
                    promotion_type: 'multiplier',
                    bonus_value: 2.0,
                    min_cart_subtotal_rupees: 5000,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: '',
                    is_active: true,
                });
                fetchAllData();
            } else {
                showNotice(data.error || 'Failed to create promotion', 'error');
            }
        } catch (err: any) {
            showNotice(err.message, 'error');
        }
    };

    // Handle Delete Promotion
    const handleDeletePromotion = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promotional campaign?')) return;
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/admin/loyalty/promotions?id=${id}`, {
                method: 'DELETE',
                headers,
            });
            if (res.ok) {
                showNotice('Campaign deleted');
                fetchAllData();
            } else {
                const data = await res.json();
                showNotice(data.error || 'Failed to delete', 'error');
            }
        } catch (err: any) {
            showNotice(err.message, 'error');
        }
    };

    // Handle Manual Expiry Processing
    const handleRunExpiry = async () => {
        if (!confirm('Run the point expiration process now? All points older than the configured validity duration will be expired.')) return;
        setExpiring(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/admin/loyalty/expire', {
                method: 'POST',
                headers,
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setExpiryResult(data);
                showNotice(`Processed expiry: ${data.total_expired_points || 0} points expired across ${data.wallets_affected || 0} wallets`);
                fetchAllData();
            } else {
                showNotice(data.error || 'Failed to run expiry', 'error');
            }
        } catch (err: any) {
            showNotice(err.message, 'error');
        } finally {
            setExpiring(false);
        }
    };

    // Filter wallets
    const filteredWallets = wallets.filter(w => {
        if (!walletsSearch.trim()) return true;
        const q = walletsSearch.toLowerCase();
        return (
            w.fullName?.toLowerCase().includes(q) ||
            w.mobile?.toLowerCase().includes(q)
        );
    });

    // Filter transactions
    const filteredTransactions = transactions.filter(t => {
        if (!txFilterType) return true;
        return t.transaction_type === txFilterType;
    });

    // Filter referrals
    const completedReferrals = referrals.filter(r => r.status === 'completed');
    const pendingReferrals = referrals.filter(r => r.status === 'pending');
    const totalReferralPointsAwarded = completedReferrals.reduce((sum, r) => sum + (r.points_awarded || 0), 0);
    const totalReferralRupeesValue = Math.round((totalReferralPointsAwarded * (settings.paise_per_point || 25)) / 100);

    const filteredReferrals = referrals.filter(r => {
        if (referralStatusFilter !== 'all' && r.status !== referralStatusFilter) return false;
        if (!referralsSearch.trim()) return true;
        const q = referralsSearch.toLowerCase();
        const referrerName = (r.referrer?.full_name || '').toLowerCase();
        const referrerPhone = (r.referrer?.mobile || '').toLowerCase();
        const referredName = (r.referred?.full_name || '').toLowerCase();
        const referredPhone = (r.referred?.mobile || '').toLowerCase();
        const code = (r.referral_code || '').toLowerCase();
        const orderNum = (r.order?.order_number || '').toString();
        return (
            referrerName.includes(q) ||
            referrerPhone.includes(q) ||
            referredName.includes(q) ||
            referredPhone.includes(q) ||
            code.includes(q) ||
            orderNum.includes(q)
        );
    });

    // Aggregate stats
    const totalCirculatingPoints = wallets.reduce((sum, w) => sum + (w.pointsBalance || 0), 0);
    const totalRedeemedPoints = wallets.reduce((sum, w) => sum + (w.lifetimeRedeemed || 0), 0);
    const totalLifetimeEarned = wallets.reduce((sum, w) => sum + (w.lifetimeEarned || 0), 0);
    const circulatingValueRupees = (totalCirculatingPoints * (settings.paise_per_point || 25)) / 100;
    const redeemedValueRupees = (totalRedeemedPoints * (settings.paise_per_point || 25)) / 100;

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Notification Toast */}
            {notification && (
                <div
                    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg border text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
                        notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                    ) : (
                        <XCircleIcon className="w-5 h-5 text-rose-600" />
                    )}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-poppins">
                            Loyalty Points & Rewards
                        </h1>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                                settings.is_enabled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {settings.is_enabled ? 'Active' : 'Disabled'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Configure reward rates, redemption limits, customer wallets, and promotional bonuses.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={fetchAllData}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleRunExpiry}
                        disabled={expiring}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
                    >
                        <ClockIcon className="w-4 h-4" />
                        <span>{expiring ? 'Expiring...' : 'Run Expiry Job'}</span>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
                {[
                    { id: 'overview', label: 'Overview', icon: SparklesIcon },
                    { id: 'settings', label: 'Configuration', icon: Cog6ToothIcon },
                    { id: 'referrals', label: `Referral Program (${referrals.length})`, icon: GiftIcon },
                    { id: 'wallets', label: `Customer Wallets (${wallets.length})`, icon: UsersIcon },
                    { id: 'promotions', label: `Promotions (${promotions.length})`, icon: TicketIcon },
                    { id: 'transactions', label: 'Ledger', icon: ClipboardDocumentListIcon },
                    { id: 'audit', label: 'Audit Trail', icon: ShieldCheckIcon },
                ].map((tab) => {
                    const active = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                                active
                                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="flex flex-col gap-6">
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div 
                            onClick={() => setActiveTab('wallets')}
                            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Active Customer Wallets</span>
                                <span className="text-xs font-extrabold text-indigo-600 group-hover:underline">View All →</span>
                            </div>
                            <span className="text-3xl font-extrabold text-slate-900 font-poppins">
                                {wallets.length}
                            </span>
                            <span className="text-[11px] text-slate-400">Total registered profiles with wallet</span>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-amber-600">Points In Circulation</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-amber-600 font-poppins">
                                    {totalCirculatingPoints.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">pts</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                                Liability: <strong>{formatPrice(circulatingValueRupees)}</strong>
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-emerald-600">Total Points Redeemed</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-emerald-600 font-poppins">
                                    {totalRedeemedPoints.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">pts</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                                Customer Savings: <strong>{formatPrice(redeemedValueRupees)}</strong>
                            </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-indigo-600">Lifetime Points Earned</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-indigo-600 font-poppins">
                                    {totalLifetimeEarned.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-slate-500">pts</span>
                            </div>
                            <span className="text-[11px] text-slate-500">Across signup bonus & purchases</span>
                        </div>
                    </div>

                    {/* Active Rules Summary */}
                    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 font-poppins">
                                Current Loyalty Program Parameters
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveTab('settings')}
                                className="text-xs font-extrabold text-indigo-600 hover:underline cursor-pointer"
                            >
                                Edit Rules →
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                <span className="text-slate-500 font-medium">Signup Bonus</span>
                                <span className="text-base font-extrabold text-slate-900 font-poppins">
                                    {settings.signup_bonus_points || 0} pts
                                </span>
                                <span className="text-[10px] text-slate-400">On verified signup</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                <span className="text-slate-500 font-medium">Purchase Reward</span>
                                <span className="text-base font-extrabold text-slate-900 font-poppins">
                                    {settings.earning_percentage ?? 1.0}%
                                </span>
                                <span className="text-[10px] text-slate-400">On product subtotal</span>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col gap-1">
                                <span className="text-amber-800 font-bold">Referral Comm.</span>
                                <span className="text-base font-extrabold text-amber-900 font-poppins">
                                    {settings.referral_earning_percentage ?? 1.0}%
                                </span>
                                <span className="text-[10px] text-amber-700">On delivered orders</span>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col gap-1">
                                <span className="text-amber-800 font-bold">Friend Discount</span>
                                <span className="text-base font-extrabold text-amber-900 font-poppins">
                                    ₹{settings.referral_discount_rupees || 500} OFF
                                </span>
                                <span className="text-[10px] text-amber-700">Min order ₹{settings.referral_min_order_rupees || 5000}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                <span className="text-slate-500 font-medium">Conversion Value</span>
                                <span className="text-base font-extrabold text-slate-900 font-poppins">
                                    1 pt = ₹{((settings.paise_per_point || 25) / 100).toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400">{settings.paise_per_point} paise/point</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                                <span className="text-slate-500 font-medium">Min Cart Redeem</span>
                                <span className="text-base font-extrabold text-slate-900 font-poppins">
                                    {formatPrice((settings.min_cart_subtotal_paise || 500000) / 100)}
                                </span>
                                <span className="text-[10px] text-slate-400">Excludes freight</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Wallets Preview on Overview Tab */}
                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 font-poppins">
                                    Customer Wallets & Rewards Balance
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Live customer loyalty points balances and quick manual point adjustment.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('wallets')}
                                className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                            >
                                View All ({wallets.length}) →
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">Mobile</th>
                                        <th className="py-3 px-4 text-right">Available Points</th>
                                        <th className="py-3 px-4 text-right">Rupee Value</th>
                                        <th className="py-3 px-4 text-right">Lifetime Earned</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {wallets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">
                                                {loading ? 'Loading customer wallets...' : 'No customer wallets registered yet.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        wallets.slice(0, 10).map((customer) => (
                                            <tr key={customer.userId} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-extrabold text-slate-900 block font-poppins">
                                                        {customer.fullName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        ID: {customer.userId.slice(0, 8)}...
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-medium text-slate-700">
                                                    {customer.mobile}
                                                </td>
                                                <td className="py-3 px-4 text-right font-extrabold font-mono text-sm text-amber-600">
                                                    {customer.pointsBalance.toLocaleString()} pts
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold font-mono text-slate-800">
                                                    {formatPrice((customer.pointsBalance * (settings.paise_per_point || 25)) / 100)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                                    +{customer.lifetimeEarned.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setAdjustModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] transition-colors cursor-pointer"
                                                    >
                                                        Adjust Points
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: CONFIGURATION SETTINGS */}
            {activeTab === 'settings' && (
                <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xs flex flex-col gap-6 max-w-4xl">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900 font-poppins">
                            Loyalty Program Configuration
                        </h2>
                        <p className="text-xs text-slate-500">
                            Configure points earning percentage, signup bonuses, redemption conversion rates, and cart thresholds.
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setConfirmSaveModal(true);
                        }}
                        className="flex flex-col gap-6 text-xs sm:text-sm font-medium"
                    >
                        {/* Program Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <span className="font-extrabold text-slate-900 block">
                                    Loyalty Program Active
                                </span>
                                <span className="text-xs text-slate-500">
                                    When disabled, customers cannot earn or redeem points. Existing points balances remain intact.
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.is_enabled}
                                    onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Signup Bonus */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Signup Bonus Points
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={settings.signup_bonus_points}
                                    onChange={(e) => setSettings({ ...settings, signup_bonus_points: parseInt(e.target.value || '0', 10) })}
                                    className="h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm outline-none focus:border-indigo-600"
                                />
                                <span className="text-[11px] text-slate-400">Awarded automatically after first verified phone login.</span>
                            </div>

                            {/* Purchase Earning Rate (%) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Purchase Earning Rate (% of Order Subtotal)
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        max={100}
                                        value={settings.earning_percentage !== undefined ? settings.earning_percentage : 1.0}
                                        onChange={(e) => {
                                            const pct = parseFloat(e.target.value || '0');
                                            const paise = settings.paise_per_point || 100;
                                            const equivRupees = pct > 0 ? Math.round((paise / 100) / (pct / 100)) : 100;
                                            setSettings({
                                                ...settings,
                                                earning_percentage: pct,
                                                rupees_spent_per_point: equivRupees > 0 ? equivRupees : 100,
                                            });
                                        }}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                    <span className="text-slate-600 font-bold text-sm whitespace-nowrap ml-2">%</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-bold">
                                    Preview: A ₹10,000 order gives ₹{((10000 * (settings.earning_percentage ?? 1)) / 100).toFixed(0)} back ({Math.floor((10000 * (settings.earning_percentage ?? 1) * 100) / ((settings.paise_per_point || 25) * 100))} pts at ₹{((settings.paise_per_point || 25) / 100).toFixed(2)}/pt).
                                </span>
                            </div>

                            {/* Conversion Rate (Paise per point) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Redemption Conversion Value (Paise per Point)
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                    <input
                                        type="number"
                                        min={1}
                                        value={settings.paise_per_point}
                                        onChange={(e) => setSettings({ ...settings, paise_per_point: parseInt(e.target.value || '25', 10) })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                    <span className="text-slate-500 text-xs font-bold whitespace-nowrap ml-2">paise / pt</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-bold">
                                    Preview: 100 points = ₹{((settings.paise_per_point * 100) / 100).toFixed(2)} discount.
                                </span>
                            </div>

                            {/* Minimum Cart Subtotal */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Minimum Cart Amount Required to Redeem (₹)
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                    <span className="text-slate-500 font-bold mr-1">₹</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={(settings.min_cart_subtotal_paise || 0) / 100}
                                        onChange={(e) => setSettings({ ...settings, min_cart_subtotal_paise: Math.round(parseFloat(e.target.value || '0') * 100) })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                </div>
                                <span className="text-[11px] text-slate-400">Cart product subtotal must meet this amount before points can be redeemed.</span>
                            </div>

                            {/* Minimum Points Required */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Minimum Points Required for Redemption
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={settings.min_points_to_redeem}
                                    onChange={(e) => setSettings({ ...settings, min_points_to_redeem: parseInt(e.target.value || '50', 10) })}
                                    className="h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm outline-none focus:border-indigo-600"
                                />
                                <span className="text-[11px] text-slate-400">Customers with fewer points cannot redeem.</span>
                            </div>

                            {/* Maximum Redemption % per Order */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Max Redemption % Per Order
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={settings.max_redemption_percentage}
                                        onChange={(e) => setSettings({ ...settings, max_redemption_percentage: parseInt(e.target.value || '20', 10) })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                    <span className="text-slate-500 font-bold text-xs">% of subtotal</span>
                                </div>
                                <span className="text-[11px] text-slate-400">Caps point discount (e.g., max 20% off order).</span>
                            </div>

                            {/* Maximum Points Cap per Order */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Max Points Redeemable per Order (Cap)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={settings.max_points_per_order}
                                    onChange={(e) => setSettings({ ...settings, max_points_per_order: parseInt(e.target.value || '2000', 10) })}
                                    className="h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm outline-none focus:border-indigo-600"
                                />
                                <span className="text-[11px] text-slate-400">0 = Unlimited cap, otherwise maximum points per checkout.</span>
                            </div>

                            {/* Points Expiry Duration */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Point Expiry Duration (Days)
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                    <input
                                        type="number"
                                        min={30}
                                        value={settings.expiry_days}
                                        onChange={(e) => setSettings({ ...settings, expiry_days: parseInt(e.target.value || '365', 10) })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                    <span className="text-slate-500 font-bold text-xs whitespace-nowrap">days</span>
                                </div>
                                <span className="text-[11px] text-slate-400">Default: 365 days from transaction date.</span>
                            </div>
                        </div>

                        {/* Customer Referral Commission & Rewards Settings */}
                        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                                        <GiftIcon className="w-5 h-5" />
                                    </span>
                                    <div>
                                        <h3 className="font-extrabold text-slate-900 text-sm">Customer Referral Commission & Rewards Settings</h3>
                                        <p className="text-xs text-slate-500">Reward referrers when their invited farmers' orders are delivered.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.referral_enabled ?? true}
                                        onChange={(e) => setSettings({ ...settings, referral_enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                {/* Commission Percentage */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Referrer Reward (% of Delivered Order)
                                    </label>
                                    <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            max={100}
                                            value={settings.referral_earning_percentage !== undefined ? settings.referral_earning_percentage : 1.0}
                                            onChange={(e) => setSettings({ ...settings, referral_earning_percentage: parseFloat(e.target.value || '1.0') })}
                                            className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                        />
                                        <span className="text-slate-600 font-bold text-sm ml-2">%</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                        Credited in points when friend's order is Delivered.
                                    </span>
                                </div>

                                {/* Friend Discount (₹) */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Friend First Order Discount (₹)
                                    </label>
                                    <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                        <span className="text-slate-500 font-bold mr-1">₹</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={settings.referral_discount_rupees !== undefined ? settings.referral_discount_rupees : 500}
                                            onChange={(e) => setSettings({ ...settings, referral_discount_rupees: parseInt(e.target.value || '500', 10) })}
                                            className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                        />
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                        Instant discount applied at checkout.
                                    </span>
                                </div>

                                {/* Minimum Order Value (₹) */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Minimum Order Required (₹)
                                    </label>
                                    <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white">
                                        <span className="text-slate-500 font-bold mr-1">₹</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={settings.referral_min_order_rupees !== undefined ? settings.referral_min_order_rupees : 5000}
                                            onChange={(e) => setSettings({ ...settings, referral_min_order_rupees: parseInt(e.target.value || '5000', 10) })}
                                            className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                        />
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-semibold">
                                        Cart subtotal required to qualify.
                                    </span>
                                </div>
                            </div>

                            {/* Dynamic Calculation Live Preview */}
                            <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 flex flex-col gap-1">
                                <span className="font-extrabold text-amber-900 flex items-center gap-1">
                                    💡 Referral Reward Preview ({settings.referral_earning_percentage ?? 1.0}% on Delivered Order):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1 font-mono text-[11px]">
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                        ₹10,000 order → <strong>₹{((10000 * (settings.referral_earning_percentage ?? 1)) / 100).toFixed(0)} credit</strong> ({Math.floor((10000 * (settings.referral_earning_percentage ?? 1) * 100) / (settings.paise_per_point || 25)).toLocaleString()} pts)
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                        ₹30,000 order → <strong>₹{((30000 * (settings.referral_earning_percentage ?? 1)) / 100).toFixed(0)} credit</strong> ({Math.floor((30000 * (settings.referral_earning_percentage ?? 1) * 100) / (settings.paise_per_point || 25)).toLocaleString()} pts)
                                    </div>
                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                                        ₹50,000 order → <strong>₹{((50000 * (settings.referral_earning_percentage ?? 1)) / 100).toFixed(0)} credit</strong> ({Math.floor((50000 * (settings.referral_earning_percentage ?? 1) * 100) / (settings.paise_per_point || 25)).toLocaleString()} pts)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex justify-end">
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                                Save Configuration Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB: REFERRAL PROGRAM & COMMISSIONS */}
            {activeTab === 'referrals' && (
                <div className="flex flex-col gap-6">
                    {/* Direct Referral Settings Bar */}
                    <div className="rounded-2xl bg-white border border-amber-200/80 p-6 shadow-xs flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                    <GiftIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-base font-extrabold text-slate-900 font-poppins">
                                        Referral Program Commission & Rules
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Customize the referral percentage awarded to referring farmers upon product delivery.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-700">Program Status:</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.referral_enabled ?? true}
                                        onChange={(e) => setSettings({ ...settings, referral_enabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {/* Referrer Reward % */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>Referrer Reward Percentage</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">Delivered Order %</span>
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white focus-within:border-amber-600 transition-colors">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min={0}
                                        max={100}
                                        value={settings.referral_earning_percentage !== undefined ? settings.referral_earning_percentage : 1.0}
                                        onChange={(e) => setSettings({ ...settings, referral_earning_percentage: parseFloat(e.target.value || '1.0') })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                    <span className="text-slate-600 font-bold text-sm ml-2">%</span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    Credited as loyalty points when order is marked <strong>Delivered/Completed</strong>.
                                </span>
                            </div>

                            {/* Friend Discount (₹) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Referred Friend Discount (₹)
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white focus-within:border-amber-600 transition-colors">
                                    <span className="text-slate-500 font-bold mr-1">₹</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={settings.referral_discount_rupees !== undefined ? settings.referral_discount_rupees : 500}
                                        onChange={(e) => setSettings({ ...settings, referral_discount_rupees: parseInt(e.target.value || '500', 10) })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    First order discount applied at checkout.
                                </span>
                            </div>

                            {/* Min Order Required (₹) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                    Min Order Requirement (₹)
                                </label>
                                <div className="flex items-center h-11 px-3.5 rounded-xl border border-slate-300 bg-white focus-within:border-amber-600 transition-colors">
                                    <span className="text-slate-500 font-bold mr-1">₹</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={settings.referral_min_order_rupees !== undefined ? settings.referral_min_order_rupees : 5000}
                                        onChange={(e) => setSettings({ ...settings, referral_min_order_rupees: parseInt(e.target.value || '5000', 10) })}
                                        className="w-full text-slate-900 font-mono text-sm outline-none border-0"
                                    />
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    Minimum product subtotal required for discount.
                                </span>
                            </div>
                        </div>

                        {/* Live Calculation Preview */}
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                                    <SparklesIcon className="w-4 h-4 text-amber-600" />
                                    <span>Dynamic Credit Preview ({settings.referral_earning_percentage ?? 1.0}% on Delivered Order):</span>
                                </span>
                                <span className="text-[11px] text-amber-800 font-mono">1 pt = ₹{((settings.paise_per_point || 25) / 100).toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                                <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800">
                                    <span className="text-slate-500 text-[10px] block font-sans">₹10,000 Delivered Order:</span>
                                    <strong className="text-emerald-700 text-sm">₹{((10000 * (settings.referral_earning_percentage ?? 1)) / 100).toFixed(0)} credit</strong>
                                    <span className="text-[11px] text-slate-500 block">({Math.floor((10000 * (settings.referral_earning_percentage ?? 1) * 100) / (settings.paise_per_point || 25)).toLocaleString()} pts)</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800">
                                    <span className="text-slate-500 text-[10px] block font-sans">₹30,000 Delivered Order:</span>
                                    <strong className="text-emerald-700 text-sm">₹{((30000 * (settings.referral_earning_percentage ?? 1)) / 100).toFixed(0)} credit</strong>
                                    <span className="text-[11px] text-slate-500 block">({Math.floor((30000 * (settings.referral_earning_percentage ?? 1) * 100) / (settings.paise_per_point || 25)).toLocaleString()} pts)</span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800">
                                    <span className="text-slate-500 text-[10px] block font-sans">₹50,000 Delivered Order:</span>
                                    <strong className="text-emerald-700 text-sm">₹{((50000 * (settings.referral_earning_percentage ?? 1)) / 100).toFixed(0)} credit</strong>
                                    <span className="text-[11px] text-slate-500 block">({Math.floor((50000 * (settings.referral_earning_percentage ?? 1) * 100) / (settings.paise_per_point || 25)).toLocaleString()} pts)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => handleSaveSettings()}
                                disabled={savingSettings}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                                {savingSettings ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                                <span>{savingSettings ? 'Saving...' : 'Save Referral Configuration'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-slate-500">Total Referrals</span>
                            <span className="text-3xl font-extrabold text-slate-900 font-poppins">{referrals.length}</span>
                            <span className="text-[11px] text-slate-400">Total invited customer records</span>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-emerald-600">Completed & Rewarded</span>
                            <span className="text-3xl font-extrabold text-emerald-600 font-poppins">{completedReferrals.length}</span>
                            <span className="text-[11px] text-slate-400">Orders delivered with reward paid</span>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-blue-600">Pending Delivery</span>
                            <span className="text-3xl font-extrabold text-blue-600 font-poppins">{pendingReferrals.length}</span>
                            <span className="text-[11px] text-slate-400">Awaiting order delivery</span>
                        </div>
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2">
                            <span className="text-xs font-bold text-amber-600">Total Referral Points Paid</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-amber-600 font-poppins">{totalReferralPointsAwarded.toLocaleString()}</span>
                                <span className="text-xs font-bold text-slate-500">pts</span>
                            </div>
                            <span className="text-[11px] text-slate-500">Value: <strong>{formatPrice(totalReferralRupeesValue)}</strong></span>
                        </div>
                    </div>

                    {/* Table Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                value={referralsSearch}
                                onChange={(e) => setReferralsSearch(e.target.value)}
                                placeholder="Search referrer, friend, code, order..."
                                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 outline-none focus:border-amber-600"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                            {(['all', 'completed', 'pending', 'cancelled'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setReferralStatusFilter(filter)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                                        referralStatusFilter === filter
                                            ? 'bg-amber-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Referrals Table */}
                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                        <th className="py-3 px-4">Referrer Customer</th>
                                        <th className="py-3 px-4">Referred Customer</th>
                                        <th className="py-3 px-4">Referral Code</th>
                                        <th className="py-3 px-4">Linked Order</th>
                                        <th className="py-3 px-4 text-right">Commission Points</th>
                                        <th className="py-3 px-4 text-center">Reward Status</th>
                                        <th className="py-3 px-4 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {filteredReferrals.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                                                No referral records found matching your filter
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReferrals.map((r) => {
                                            const orderVal = Number(r.order?.total_amount || 0);
                                            const pts = r.points_awarded || 0;
                                            const ptsRupees = Math.round((pts * (settings.paise_per_point || 25)) / 100);

                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-extrabold text-slate-900">
                                                                {r.referrer?.full_name || 'Aqua Farmer'}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                {r.referrer?.mobile || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">
                                                                {r.referred?.full_name || 'Customer'}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                {r.referred?.mobile || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                                                        {r.referral_code}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {r.order ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-indigo-600">
                                                                    Order #{r.order.order_number || r.order_id?.slice(0, 8)}
                                                                </span>
                                                                <span className="text-[11px] text-slate-500 font-mono">
                                                                    {formatPrice(orderVal)} • <span className="capitalize">{r.order.status}</span>
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">No order yet</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        {pts > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold font-mono text-emerald-600">
                                                                    +{pts.toLocaleString()} pts
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    (₹{ptsRupees.toLocaleString()})
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 font-mono">0 pts</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                                                r.status === 'completed'
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : r.status === 'pending'
                                                                    ? 'bg-amber-100 text-amber-800'
                                                                    : 'bg-rose-100 text-rose-800'
                                                            }`}
                                                        >
                                                            {r.status === 'completed' ? 'Delivered & Awarded' : r.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                                                        {new Date(r.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: CUSTOMER WALLETS & ADJUSTMENTS */}
            {activeTab === 'wallets' && (
                <div className="flex flex-col gap-4">
                    {/* Search & Actions Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative w-full sm:w-80">
                            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                            <input
                                type="text"
                                value={walletsSearch}
                                onChange={(e) => setWalletsSearch(e.target.value)}
                                placeholder="Search customer name or mobile..."
                                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                            />
                        </div>
                        <span className="text-xs text-slate-500">
                            Showing {filteredWallets.length} customer wallets
                        </span>
                    </div>

                    {/* Wallets Table */}
                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">Mobile</th>
                                        <th className="py-3 px-4 text-right">Available Points</th>
                                        <th className="py-3 px-4 text-right">Rupee Value</th>
                                        <th className="py-3 px-4 text-right">Lifetime Earned</th>
                                        <th className="py-3 px-4 text-right">Lifetime Redeemed</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredWallets.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No customer wallets found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredWallets.map((customer) => (
                                            <tr key={customer.userId} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-extrabold text-slate-900 block font-poppins">
                                                        {customer.fullName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        ID: {customer.userId.slice(0, 8)}...
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-medium text-slate-700">
                                                    {customer.mobile}
                                                </td>
                                                <td className="py-3 px-4 text-right font-extrabold font-mono text-sm text-amber-600">
                                                    {customer.pointsBalance.toLocaleString()} pts
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold font-mono text-slate-800">
                                                    {formatPrice((customer.pointsBalance * (settings.paise_per_point || 25)) / 100)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                                    +{customer.lifetimeEarned.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-slate-600">
                                                    -{customer.lifetimeRedeemed.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCustomer(customer);
                                                            setAdjustModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] transition-colors cursor-pointer"
                                                    >
                                                        Adjust Points
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: PROMOTIONAL CAMPAIGNS */}
            {activeTab === 'promotions' && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 font-poppins">
                                Promotional Reward Campaigns
                            </h2>
                            <p className="text-xs text-slate-500">
                                Configure special multipliers (e.g. 2x Points) or flat bonus points for promotional events.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPromoModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Create Campaign</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {promotions.length === 0 ? (
                            <div className="col-span-full p-8 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-500 text-xs">
                                No promotional campaigns created yet. Click "Create Campaign" to set up festival or seasonal bonus points.
                            </div>
                        ) : (
                            promotions.map((p) => (
                                <div
                                    key={p.id}
                                    className={`p-5 rounded-2xl bg-white border shadow-2xs flex flex-col justify-between gap-4 transition-all ${
                                        p.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                                    }`}
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                                {p.promotion_type === 'multiplier' ? `${p.bonus_value}x Multiplier` : `+${p.bonus_value} Bonus pts`}
                                            </span>
                                            <span
                                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                    p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 text-sm font-poppins">
                                            {p.name}
                                        </h3>
                                        {p.code && (
                                            <span className="text-xs font-mono font-bold text-slate-600">
                                                Code: {p.code}
                                            </span>
                                        )}
                                        {p.description && (
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {p.description}
                                            </p>
                                        )}
                                        <div className="text-[11px] text-slate-400 mt-2 flex flex-col gap-0.5">
                                            <div>Min Subtotal: <strong>{formatPrice((p.min_cart_subtotal_paise || 0) / 100)}</strong></div>
                                            <div>Start: {new Date(p.start_date).toLocaleDateString()}</div>
                                            {p.end_date && <div>End: {new Date(p.end_date).toLocaleDateString()}</div>}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePromotion(p.id)}
                                            className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 5: TRANSACTIONS LEDGER */}
            {activeTab === 'transactions' && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 font-poppins">
                                Immutable Transaction Ledger
                            </h2>
                            <p className="text-xs text-slate-500">
                                Append-only audit record of every points credit, debit, redemption, and expiration.
                            </p>
                        </div>
                        <select
                            value={txFilterType}
                            onChange={(e) => setTxFilterType(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 outline-none"
                        >
                            <option value="">All Transaction Types</option>
                            <option value="signup_bonus">Signup Bonus</option>
                            <option value="purchase_earned">Purchase Earned</option>
                            <option value="checkout_redemption">Checkout Redemption</option>
                            <option value="points_expired">Points Expired</option>
                            <option value="admin_credit">Admin Credit</option>
                            <option value="admin_debit">Admin Debit</option>
                            <option value="redemption_refund">Redemption Refund</option>
                            <option value="order_cancelled_restore">Order Cancelled Restore</option>
                        </select>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4 text-right">Points</th>
                                        <th className="py-3 px-4 text-right">Balance After</th>
                                        <th className="py-3 px-4 text-right">Rupee Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400">
                                                No transactions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((tx) => {
                                            const isPos = Number(tx.points) > 0;
                                            return (
                                                <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="font-extrabold text-slate-900 block">
                                                            {tx.profile?.full_name || 'Customer'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {tx.profile?.mobile || tx.user_id.slice(0, 8)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800">
                                                            {tx.transaction_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                                                        {tx.description}
                                                    </td>
                                                    <td className={`py-3 px-4 text-right font-extrabold font-mono text-sm whitespace-nowrap ${
                                                        isPos ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                        {isPos ? `+${tx.points}` : tx.points}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                                                        {tx.balance_after} pts
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                                                        {formatPrice((tx.rupee_value_paise || 0) / 100)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: AUDIT TRAIL */}
            {activeTab === 'audit' && (
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900 font-poppins">
                            Administrator Audit Log
                        </h2>
                        <p className="text-xs text-slate-500">
                            Complete tamper-evident trail of administrative configuration updates and customer point adjustments.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
                                        <th className="py-3 px-4">Timestamp</th>
                                        <th className="py-3 px-4">Admin</th>
                                        <th className="py-3 px-4">Action</th>
                                        <th className="py-3 px-4">Points</th>
                                        <th className="py-3 px-4">Mandatory Reason</th>
                                        <th className="py-3 px-4">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">
                                                No administrator actions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 font-extrabold text-slate-800">
                                                    {log.admin?.full_name || log.admin?.mobile || log.admin_user_id.slice(0, 8)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700">
                                                        {log.action_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold">
                                                    {log.points_changed !== null ? (
                                                        <span className={log.points_changed > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {log.points_changed > 0 ? `+${log.points_changed}` : log.points_changed}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-900 font-medium">
                                                    {log.reason}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                                                    {JSON.stringify(log.details)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CONFIRMATION POPUP FOR SETTINGS UPDATE */}
            {confirmSaveModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 font-poppins flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-indigo-600" />
                                Confirm Loyalty Settings
                            </h3>
                            <button
                                type="button"
                                onClick={() => setConfirmSaveModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-600">
                            Are you sure you want to save these loyalty configuration changes? They will take effect immediately for customer checkouts and order rewards.
                        </p>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs">
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Program Status:</span>
                                <span className={`font-extrabold ${settings.is_enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {settings.is_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Signup Bonus:</span>
                                <span className="font-extrabold text-slate-900 font-mono">{settings.signup_bonus_points} pts</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Purchase Earning Rate:</span>
                                <span className="font-extrabold text-indigo-700 font-mono">{settings.earning_percentage ?? 1}% of subtotal</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Conversion Value:</span>
                                <span className="font-extrabold text-slate-900 font-mono">{settings.paise_per_point} paise (₹{((settings.paise_per_point || 25) / 100).toFixed(2)}) / pt</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Min Cart to Redeem:</span>
                                <span className="font-extrabold text-slate-900 font-mono">₹{((settings.min_cart_subtotal_paise || 0) / 100).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Min Points to Redeem:</span>
                                <span className="font-extrabold text-slate-900 font-mono">{settings.min_points_to_redeem} pts</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                                <span className="text-slate-500 font-medium">Max Redemption %:</span>
                                <span className="font-extrabold text-slate-900 font-mono">{settings.max_redemption_percentage}% of order</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Points Expiry:</span>
                                <span className="font-extrabold text-slate-900 font-mono">{settings.expiry_days} days</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmSaveModal(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSaveSettings()}
                                disabled={savingSettings}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {savingSettings ? 'Saving...' : 'Yes, Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: MANUAL POINT ADJUSTMENT */}
            {adjustModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 font-poppins">
                                Adjust Customer Points
                            </h3>
                            <button
                                type="button"
                                onClick={() => setAdjustModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1 text-xs">
                            <span className="font-extrabold text-slate-900">{selectedCustomer.fullName}</span>
                            <span className="text-slate-500 font-mono">Mobile: {selectedCustomer.mobile}</span>
                            <span className="text-amber-600 font-bold">
                                Current Balance: {selectedCustomer.pointsBalance} pts (≈ {formatPrice((selectedCustomer.pointsBalance * (settings.paise_per_point || 25)) / 100)})
                            </span>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4 text-xs">
                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-slate-700">Action Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustType('credit')}
                                        className={`py-2 rounded-xl font-extrabold border transition-all cursor-pointer ${
                                            adjustType === 'credit'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        + Credit Points
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustType('debit')}
                                        className={`py-2 rounded-xl font-extrabold border transition-all cursor-pointer ${
                                            adjustType === 'debit'
                                                ? 'bg-rose-50 border-rose-500 text-rose-800'
                                                : 'border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        − Debit Points
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-slate-700">Points to Adjust *</label>
                                <input
                                    type="number"
                                    min={1}
                                    required
                                    value={adjustPoints}
                                    onChange={(e) => setAdjustPoints(e.target.value)}
                                    placeholder="Enter points..."
                                    className="h-10 px-3.5 rounded-xl border border-slate-300 font-mono text-sm outline-none focus:border-indigo-600"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-slate-700">Mandatory Reason *</label>
                                <textarea
                                    rows={2}
                                    required
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="E.g. Goodwill credit for transport delay, or correcting erroneous order bonus..."
                                    className="p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-indigo-600"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAdjustModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjusting || !adjustPoints || !adjustReason.trim()}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {adjusting ? 'Adjusting...' : 'Confirm Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE PROMOTION */}
            {promoModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl flex flex-col gap-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 font-poppins">
                                Create Promotional Bonus Campaign
                            </h3>
                            <button
                                type="button"
                                onClick={() => setPromoModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreatePromotion} className="flex flex-col gap-3 text-xs">
                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-slate-700">Campaign Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={newPromo.name}
                                    onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                                    placeholder="E.g. Monsoon Aerators Festival 2X Points"
                                    className="h-9 px-3 rounded-xl border border-slate-300 outline-none focus:border-indigo-600"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-slate-700">Promo Code (Optional)</label>
                                <input
                                    type="text"
                                    value={newPromo.code}
                                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                    placeholder="E.g. MONSOON2X"
                                    className="h-9 px-3 rounded-xl border border-slate-300 font-mono outline-none focus:border-indigo-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-700">Bonus Type</label>
                                    <select
                                        value={newPromo.promotion_type}
                                        onChange={(e) => setNewPromo({ ...newPromo, promotion_type: e.target.value as any })}
                                        className="h-9 px-2 rounded-xl border border-slate-300 outline-none"
                                    >
                                        <option value="multiplier">Points Multiplier (e.g. 2x)</option>
                                        <option value="fixed_bonus">Fixed Bonus (e.g. +100 pts)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-700">Bonus Value</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min={1}
                                        required
                                        value={newPromo.bonus_value}
                                        onChange={(e) => setNewPromo({ ...newPromo, bonus_value: parseFloat(e.target.value || '1') })}
                                        className="h-9 px-3 rounded-xl border border-slate-300 font-mono outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="font-bold text-slate-700">Min Cart Subtotal (₹)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={newPromo.min_cart_subtotal_rupees}
                                    onChange={(e) => setNewPromo({ ...newPromo, min_cart_subtotal_rupees: parseFloat(e.target.value || '0') })}
                                    className="h-9 px-3 rounded-xl border border-slate-300 font-mono outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-700">Start Date</label>
                                    <input
                                        type="date"
                                        value={newPromo.start_date}
                                        onChange={(e) => setNewPromo({ ...newPromo, start_date: e.target.value })}
                                        className="h-9 px-3 rounded-xl border border-slate-300 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="font-bold text-slate-700">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={newPromo.end_date}
                                        onChange={(e) => setNewPromo({ ...newPromo, end_date: e.target.value })}
                                        className="h-9 px-3 rounded-xl border border-slate-300 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setPromoModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold cursor-pointer"
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

