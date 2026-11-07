'use client';

import { formatPrice } from '@/data/products';
import {
    SparklesIcon,
    GiftIcon,
    ShoppingBagIcon,
    ArrowPathIcon,
    ClockIcon,
    CheckBadgeIcon,
} from '@heroicons/react/24/solid';

interface LoyaltyCustomerViewProps {
    loyaltyData: any;
    loading: boolean;
    onRefresh: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    signup_bonus: {
        label: 'Signup Bonus',
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: GiftIcon,
    },
    purchase_earned: {
        label: 'Purchase Reward',
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        icon: ShoppingBagIcon,
    },
    promotional_bonus: {
        label: 'Promo Bonus',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: SparklesIcon,
    },
    checkout_redemption: {
        label: 'Checkout Discount',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: ShoppingBagIcon,
    },
    redemption_refund: {
        label: 'Refund Restored',
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        icon: ArrowPathIcon,
    },
    order_cancelled_restore: {
        label: 'Order Cancelled Restored',
        bg: 'bg-sky-100',
        text: 'text-sky-800',
        icon: ArrowPathIcon,
    },
    points_expired: {
        label: 'Points Expired',
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        icon: ClockIcon,
    },
    admin_credit: {
        label: 'Admin Credit',
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        icon: CheckBadgeIcon,
    },
    admin_debit: {
        label: 'Admin Adjustment',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        icon: CheckBadgeIcon,
    },
};

export default function LoyaltyCustomerView({
    loyaltyData,
    loading,
    onRefresh,
}: LoyaltyCustomerViewProps) {
    if (loading && !loyaltyData) {
        return (
            <div className="p-12 text-center text-sm font-medium text-[#5B6880] flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                <span>Loading your Loyalty & Rewards balance...</span>
            </div>
        );
    }

    const points = loyaltyData?.points_balance || 0;
    const rupeeValue = loyaltyData?.rupee_value || 0;
    const lifetimeEarned = loyaltyData?.lifetime_earned_points || 0;
    const lifetimeRedeemed = loyaltyData?.lifetime_redeemed_points || 0;
    const settings = loyaltyData?.settings || {};
    const transactions = loyaltyData?.recent_transactions || [];

    const paisePerPoint = settings.paise_per_point || 25;
    const rupeesSpentPerPoint = settings.rupees_spent_per_point || 100;
    const minSubtotalRupees = settings.min_cart_subtotal_rupees || 5000;
    const maxPercent = settings.max_redemption_percentage || 20;

    return (
        <div className="flex flex-col gap-6">
            {/* Hero Card */}
            <div className="rounded-3xl bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs">
                                <SparklesIcon className="w-5 h-5 text-amber-100" />
                            </span>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-100 font-poppins">
                                Karthik Traders Rewards Club
                            </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold font-poppins tracking-tight">
                            {points.toLocaleString()} <span className="text-xl font-bold text-amber-200">Points</span>
                        </h2>
                        <p className="text-sm text-amber-100 font-medium">
                            Equivalent to{' '}
                            <strong className="text-white text-lg">₹{rupeeValue.toLocaleString()}</strong> in
                            checkout discounts (1 pt = ₹{(paisePerPoint / 100).toFixed(2)})
                        </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 sm:border-l border-white/20 pt-4 sm:pt-0 sm:pl-8 gap-4">
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                        <div className="text-right text-xs text-amber-100 flex flex-col gap-0.5">
                            <div>Lifetime Earned: <strong className="text-white">{lifetimeEarned} pts</strong></div>
                            <div>Total Redeemed: <strong className="text-white">{lifetimeRedeemed} pts</strong></div>
                            <div>Total Saved: <strong className="text-white font-extrabold text-sm">₹{((lifetimeRedeemed * paisePerPoint) / 100).toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>

                {loyaltyData?.expiring_soon_points > 0 && (
                    <div className="mt-5 p-3 rounded-xl bg-black/20 border border-white/20 text-xs text-amber-100 flex items-center justify-between">
                        <span>⚠️ <strong>{loyaltyData.expiring_soon_points} points</strong> are expiring soon!</span>
                        <span className="font-mono text-[11px]">
                            {loyaltyData.next_expiry_date ? new Date(loyaltyData.next_expiry_date).toLocaleDateString() : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* How It Works Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E3E8F0] shadow-xs flex flex-col gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                        🎁
                    </div>
                    <span className="font-extrabold text-sm text-[#0B1A33] font-poppins">Signup Bonus</span>
                    <p className="text-xs text-[#5B6880] leading-relaxed">
                        Earn <strong>{settings.signup_bonus_points || 50} bonus points</strong> instantly upon mobile-verified registration on Karthik Traders.
                    </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E3E8F0] shadow-xs flex flex-col gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        ⚡
                    </div>
                    <span className="font-extrabold text-sm text-[#0B1A33] font-poppins">Earn On Every Order</span>
                    <p className="text-xs text-[#5B6880] leading-relaxed">
                        Earn <strong>{settings.earning_percentage ?? 1}% of your order value</strong> back in reward points on farm equipment, aerator sets, and spares.
                    </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E3E8F0] shadow-xs flex flex-col gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                        💳
                    </div>
                    <span className="font-extrabold text-sm text-[#0B1A33] font-poppins">Redeem At Checkout</span>
                    <p className="text-xs text-[#5B6880] leading-relaxed">
                        Redeem points on orders over <strong>₹{minSubtotalRupees.toLocaleString()}</strong> to save up to <strong>{maxPercent}%</strong> off your purchase.
                    </p>
                </div>
            </div>

            {/* Transactions Ledger */}
            <div className="rounded-3xl bg-white border border-[#E3E8F0] p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-extrabold font-poppins text-[#0B1A33]">
                            Reward Points History
                        </h3>
                        <p className="text-xs text-[#5B6880]">
                            Your immutable record of earned and redeemed loyalty points
                        </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#EEF2F8] text-[#5B6880] px-2.5 py-1 rounded-full">
                        {transactions.length} record{transactions.length === 1 ? '' : 's'}
                    </span>
                </div>

                {transactions.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#FBFBFB] border border-dashed border-[#D5DCE8] flex flex-col items-center gap-2">
                        <span className="text-2xl">🪙</span>
                        <span className="text-sm font-bold text-[#0B1A33]">No points transactions yet</span>
                        <span className="text-xs text-[#5B6880]">
                            Your welcome points and purchase rewards will appear here.
                        </span>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-[#EEF2F8] text-[#5B6880] font-extrabold uppercase tracking-wider text-[10px]">
                                    <th className="py-3 px-2">Type</th>
                                    <th className="py-3 px-2">Description</th>
                                    <th className="py-3 px-2">Date</th>
                                    <th className="py-3 px-2 text-right">Points</th>
                                    <th className="py-3 px-2 text-right">Value (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EEF2F8]">
                                {transactions.map((tx: any) => {
                                    const isPositive = Number(tx.points) > 0;
                                    const cfg = TYPE_CONFIG[tx.transaction_type] || {
                                        label: tx.transaction_type,
                                        bg: 'bg-slate-100',
                                        text: 'text-slate-800',
                                        icon: SparklesIcon,
                                    };
                                    const IconComponent = cfg.icon;

                                    return (
                                        <tr key={tx.id} className="hover:bg-[#F8FAFC] transition-colors">
                                            <td className="py-3 px-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
                                                    <IconComponent className="w-3 h-3" />
                                                    <span>{cfg.label}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-[#0B1A33] font-medium max-w-xs truncate">
                                                {tx.description}
                                            </td>
                                            <td className="py-3 px-2 text-[#5B6880] font-mono whitespace-nowrap">
                                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className={`py-3 px-2 text-right font-extrabold font-mono text-sm whitespace-nowrap ${isPositive ? 'text-[#0B7A4B]' : 'text-[#B4123A]'
                                                }`}>
                                                {isPositive ? `+${tx.points}` : tx.points}
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold font-mono text-[#0B1A33] whitespace-nowrap">
                                                {formatPrice((tx.rupee_value_paise || 0) / 100)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

