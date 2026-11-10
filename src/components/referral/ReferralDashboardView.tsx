'use client';

import { useState, useEffect } from 'react';
import {
    GiftIcon,
    ShareIcon,
    ClipboardDocumentIcon,
    CheckIcon,
    SparklesIcon,
    UserGroupIcon,
    ClockIcon,
    ArrowPathIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ReferralDashboardData } from '@/types/referral';
import { supabase } from '@/lib/supabase';

interface ReferralDashboardViewProps {
    onTabSwitch?: (tab: string) => void;
}

export default function ReferralDashboardView({ onTabSwitch }: ReferralDashboardViewProps) {
    const [data, setData] = useState<ReferralDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const fetchReferralInfo = async () => {
        setLoading(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch('/api/referral/info', { headers });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to load referral details');
            }

            const json = await res.json();
            if (json.success && json.data) {
                setData(json.data);
            }
        } catch (err: any) {
            console.error('Error fetching referral details:', err);
            setError(err.message || 'Could not load your referral information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferralInfo();
    }, []);

    const copyToClipboard = (text: string, type: 'code' | 'link') => {
        navigator.clipboard.writeText(text);
        if (type === 'code') {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2500);
        } else {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        }
    };

    if (loading && !data) {
        return (
            <div className="p-12 text-center text-sm font-medium text-[#5B6880] flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                <span>Loading your referral dashboard...</span>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-2xs flex flex-col items-center gap-3">
                <p className="text-sm font-bold text-red-600">{error}</p>
                <button
                    type="button"
                    onClick={fetchReferralInfo}
                    className="h-9 px-4 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const referralCode = data?.referral_code || 'KT-AQUA-0000';
    const referralLink = data?.referral_link || `https://karthiktraders.in/?ref=${referralCode}`;
    const discountRupees = data?.discount_rupees || 500;
    const bonusPoints = data?.bonus_points || 1000;
    const minOrderRupees = data?.min_order_rupees || 5000;

    // Craft pre-filled WhatsApp share text (Telugu + English)
    const whatsappMessage = encodeURIComponent(
        `నమస్తే! నేను కార్తీక్ ట్రేడర్స్ (నెల్లూరు) నుండి రొయ్యల & చేపల చెరువుల మోటార్లు, ఏరియేటర్లు తీసుకుంటున్నాను. నా రిఫరల్ కోడ్ లేదా ఈ లింక్ ఉపయోగించి మీ మొదటి కొనుగోలుపై ఫ్లాట్ ₹${discountRupees.toLocaleString()} డిస్కౌంట్ పొందండి:\n\n👉 కోడ్: ${referralCode}\n👉 లింక్: ${referralLink}\n\nNamaste! I buy aqua pond aerators & motors from Karthik Traders. Use my referral code ${referralCode} to get flat ₹${discountRupees.toLocaleString()} OFF on your first purchase!`
    );
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

    return (
        <div className="flex flex-col gap-6">
            {/* Hero Card */}
            <div className="rounded-3xl bg-linear-to-r from-emerald-600 via-teal-700 to-[#0B1A33] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col gap-5 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-emerald-100 text-xs font-extrabold uppercase tracking-wider">
                            <GiftIcon className="w-4 h-4 text-emerald-300" />
                            <span>Karthik Traders Farmer Referral Club</span>
                        </div>
                        <button
                            type="button"
                            onClick={fetchReferralInfo}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 transition-colors"
                            title="Refresh"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl sm:text-4xl font-extrabold font-poppins tracking-tight">
                            Refer a Farmer, Earn <span className="text-yellow-300">{bonusPoints.toLocaleString()} Points</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl font-medium leading-relaxed">
                            Share Karthik Traders with fellow aqua farmers. They get <strong className="text-white font-bold">₹{discountRupees.toLocaleString()} OFF</strong> on their first equipment purchase (₹{minOrderRupees.toLocaleString()}+), and you get <strong className="text-white font-bold">{bonusPoints.toLocaleString()} Points (₹{(bonusPoints * 0.25).toLocaleString()} value)</strong> added to your wallet!
                        </p>
                    </div>

                    {/* Referral Code & Action Box */}
                    <div className="mt-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col items-center sm:items-start gap-1">
                            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Your Personal Referral Code</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-yellow-300">
                                    {referralCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(referralCode, 'code')}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all flex items-center gap-1 text-xs font-bold"
                                    title="Copy Code"
                                >
                                    {copiedCode ? <CheckIcon className="w-4 h-4 text-yellow-300" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>

                        {/* WhatsApp Share Button */}
                        <div className="flex w-full sm:w-auto items-center gap-2">
                            <a
                                href={whatsappShareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.176.582 4.218 1.599 5.979l-1.607 5.849 6.006-1.575c1.701.928 3.651 1.455 5.727 1.455 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                                </svg>
                                <span>Share on WhatsApp</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(referralLink, 'link')}
                                className="px-3.5 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                                title="Copy Referral Link"
                            >
                                <ShareIcon className="w-4 h-4" />
                                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E3E8F0] shadow-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[#5B6880]">
                        <span className="text-xs font-bold uppercase tracking-wider">Farmers Referred</span>
                        <UserGroupIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-extrabold text-[#0B1A33] font-poppins mt-1">
                        {data?.total_referrals || 0}
                    </div>
                    <span className="text-[11px] text-[#5B6880]">
                        {data?.completed_referrals || 0} completed • {data?.pending_referrals || 0} pending
                    </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E3E8F0] shadow-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[#5B6880]">
                        <span className="text-xs font-bold uppercase tracking-wider">Points Earned</span>
                        <SparklesIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-amber-600 font-poppins mt-1">
                        {(data?.total_points_earned || 0).toLocaleString()} <span className="text-sm font-bold text-amber-500">pts</span>
                    </div>
                    <span className="text-[11px] text-[#5B6880]">
                        Worth ₹{(data?.total_rupee_value || 0).toLocaleString()} in checkout discounts
                    </span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E3E8F0] shadow-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[#5B6880]">
                        <span className="text-xs font-bold uppercase tracking-wider">Pending Rewards</span>
                        <ClockIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-extrabold text-[#0B1A33] font-poppins mt-1">
                        {data?.pending_referrals || 0} <span className="text-sm font-bold text-[#5B6880]">orders</span>
                    </div>
                    <span className="text-[11px] text-[#5B6880]">
                        Credited when friend's order is delivered
                    </span>
                </div>
            </div>

            {/* How It Works Explainer */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E3E8F0] p-6 flex flex-col gap-4">
                <h3 className="text-base font-extrabold text-[#0B1A33] flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-600" />
                    <span>How the Referral Program Works</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-white border border-[#E3E8F0] shadow-2xs">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                            1
                        </div>
                        <h4 className="text-sm font-bold text-[#0B1A33]">Share with Aqua Farmers</h4>
                        <p className="text-xs text-[#5B6880] leading-relaxed">
                            Send your code or link via WhatsApp to nearby shrimp or fish farmers in your cluster.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-white border border-[#E3E8F0] shadow-2xs">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                            2
                        </div>
                        <h4 className="text-sm font-bold text-[#0B1A33]">Friend Gets ₹{discountRupees} OFF</h4>
                        <p className="text-xs text-[#5B6880] leading-relaxed">
                            Your friend applies your code at checkout and gets an instant flat ₹{discountRupees} discount on their equipment.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-4 rounded-xl bg-white border border-[#E3E8F0] shadow-2xs">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
                            3
                        </div>
                        <h4 className="text-sm font-bold text-[#0B1A33]">You Earn {bonusPoints} Points</h4>
                        <p className="text-xs text-[#5B6880] leading-relaxed">
                            As soon as their order is delivered, {bonusPoints} Points are automatically added to your rewards wallet!
                        </p>
                    </div>
                </div>
            </div>

            {/* Referred Farmers History */}
            <div className="rounded-2xl bg-white border border-[#E3E8F0] p-6 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#0B1A33]">
                        Your Referral Activity
                    </h3>
                    <span className="text-xs text-[#5B6880] font-medium">
                        {data?.referrals.length || 0} friends invited
                    </span>
                </div>

                {(!data?.referrals || data.referrals.length === 0) ? (
                    <div className="py-10 text-center flex flex-col items-center gap-2">
                        <span className="text-3xl">🤝</span>
                        <p className="text-sm font-bold text-[#0B1A33]">No referrals yet</p>
                        <p className="text-xs text-[#5B6880] max-w-sm">
                            Click "Share on WhatsApp" above to invite fellow farmers and start earning reward points on equipment purchases!
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#EEF2F8] overflow-hidden">
                        {data.referrals.map((item) => (
                            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#0B1A33] truncate">
                                            {item.referred_name}
                                        </span>
                                        <span className="text-xs text-[#5B6880] font-mono">
                                            ({item.referred_mobile_masked})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-[#5B6880]">
                                        <span>Invited: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        {item.order_number && (
                                            <span>• Order #{item.order_number}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {item.status === 'completed' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                            <CheckIcon className="w-3.5 h-3.5" />
                                            <span>+{item.points_awarded} pts awarded</span>
                                        </span>
                                    ) : item.status === 'pending' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            <span>Order Pending Delivery</span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                                            Cancelled
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

