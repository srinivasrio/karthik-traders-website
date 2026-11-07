'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/data/products';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface LoyaltyRedemptionControlProps {
    items: any[];
    session: any;
    onApplyPoints: (points: number, discountRupees: number) => void;
    appliedPoints: number;
    appliedDiscount: number;
}

export default function LoyaltyRedemptionControl({
    items,
    session,
    onApplyPoints,
    appliedPoints,
    appliedDiscount,
}: LoyaltyRedemptionControlProps) {
    const [loading, setLoading] = useState(false);
    const [walletData, setWalletData] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isRedeeming, setIsRedeeming] = useState(appliedPoints > 0);
    const [errorMsg, setErrorMsg] = useState('');

    // Sync if appliedPoints changes from outside
    useEffect(() => {
        if (appliedPoints > 0 && !isRedeeming) {
            setIsRedeeming(true);
        }
    }, [appliedPoints]);

    // Fetch wallet summary when session is present
    useEffect(() => {
        if (!session?.access_token) return;

        const fetchWallet = async () => {
            try {
                const res = await fetch('/api/loyalty/summary', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setWalletData(data);
                }
            } catch (err) {
                console.warn('Failed to fetch loyalty wallet:', err);
            }
        };

        fetchWallet();
    }, [session?.access_token]);

    // Preview redemption whenever cart items or wallet balance changes
    useEffect(() => {
        if (!session?.access_token || !items.length) {
            setPreviewData(null);
            return;
        }

        const runPreview = async () => {
            setLoading(true);
            setErrorMsg('');
            try {
                const res = await fetch('/api/loyalty/preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        items,
                        pointsRequested: isRedeeming ? 999999 : null,
                    }),
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setPreviewData(data);
                    if (isRedeeming) {
                        const pts = data.max_redeemable_points || 0;
                        const discount = Math.round(pts * (data.paise_per_point || 25)) / 100;
                        onApplyPoints(pts, discount);
                    }
                } else {
                    setErrorMsg(data.error || data.message || 'Unable to preview redemption');
                }
            } catch (err: any) {
                console.warn('Preview error:', err);
            } finally {
                setLoading(false);
            }
        };

        runPreview();
    }, [items, session?.access_token, isRedeeming]);

    if (!session) {
        return (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-xs grid place-items-center shrink-0">
                        ₹
                    </span>
                    <span className="leading-snug">Sign in to earn & redeem <strong>Loyalty Points</strong></span>
                </div>
                <Link href="/login" className="font-extrabold text-[#1450C8] hover:underline shrink-0">
                    Sign In →
                </Link>
            </div>
        );
    }

    if (!walletData?.settings?.is_enabled) {
        return null;
    }

    const availablePoints = walletData?.points_balance || 0;
    const rupeeValue = walletData?.rupee_value || 0;
    const isEligible = previewData?.is_eligible;
    const maxRedeemablePoints = previewData?.max_redeemable_points || 0;
    const minSubtotalRupees = previewData?.min_subtotal_rupees || (walletData?.settings?.min_cart_subtotal_rupees ?? 5000);
    const shortfallRupees = previewData?.shortfall_rupees || 0;
    const paisePerPoint = previewData?.paise_per_point || walletData?.settings?.paise_per_point || 25;

    const handleStartRedeem = () => {
        setIsRedeeming(true);
        const pts = maxRedeemablePoints;
        const discount = Math.round(pts * paisePerPoint) / 100;
        onApplyPoints(pts, discount);
    };

    const handleRemoveRedeem = () => {
        setIsRedeeming(false);
        onApplyPoints(0, 0);
    };

    return (
        <div className="rounded-2xl border border-[#DDE4F0] bg-white p-4 flex flex-col gap-3 shadow-xs">
            {/* Header: Title and Available Points */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-linear-to-b from-amber-300 to-amber-500 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        ₹
                    </span>
                    <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-[#0B1A33] font-poppins">
                            Loyalty Rewards
                        </span>
                        <span className="text-[11px] text-[#5B6880]">
                            Balance: <strong className="text-amber-900 font-mono">{availablePoints.toLocaleString()} pts</strong> (≈ ₹{rupeeValue.toLocaleString()})
                        </span>
                    </div>
                </div>

                {/* Redeem Button when eligible and not active */}
                {isEligible && !isRedeeming && (
                    <button
                        type="button"
                        onClick={handleStartRedeem}
                        className="h-8 px-3.5 rounded-full bg-[#0B7A4B] hover:bg-[#08633D] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        <span>Redeem {maxRedeemablePoints} pts</span>
                    </button>
                )}
            </div>

            {/* Ineligible State: Minimum Cart Subtotal Not Met */}
            {!isEligible && previewData?.reason_code === 'MIN_SUBTOTAL_NOT_MET' && (
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                        Add <strong>₹{shortfallRupees.toLocaleString()}</strong> more worth of items to unlock points redemption (Min subtotal: <strong>₹{minSubtotalRupees.toLocaleString()}</strong>).
                    </div>
                </div>
            )}

            {/* Ineligible State: Minimum Points Balance Not Met */}
            {!isEligible && previewData?.reason_code === 'MIN_POINTS_NOT_MET' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                        You have <strong>{availablePoints} points</strong>. A minimum of <strong>{walletData?.settings?.min_points_to_redeem || 50} points</strong> is required to redeem.
                    </div>
                </div>
            )}

            {/* Eligible and Active: Points applied automatically with configuration conditions */}
            {isEligible && isRedeeming && (
                <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <CheckCircleIcon className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                            <span>{maxRedeemablePoints.toLocaleString()} Points Applied</span>
                        </span>
                        <button
                            type="button"
                            onClick={handleRemoveRedeem}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                        >
                            Remove
                        </button>
                    </div>

                    {/* Summary row */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200">
                        <span className="text-emerald-900 font-medium">Applied Points Discount:</span>
                        <span className="font-extrabold font-mono text-emerald-800 text-sm">
                            − {formatPrice(appliedDiscount || Math.round(maxRedeemablePoints * paisePerPoint) / 100)}
                        </span>
                    </div>

                    <div className="text-[10px] text-emerald-800/80 leading-normal">
                        Redeeming {maxRedeemablePoints.toLocaleString()} points automatically based on configured cart conditions (1 pt = ₹{(paisePerPoint / 100).toFixed(2)} discount).
                    </div>
                </div>
            )}

            {/* Eligible and Inactive Prompt */}
            {isEligible && !isRedeeming && (
                <div className="text-xs text-[#5B6880] flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>
                        Save <strong className="text-emerald-700 font-mono">₹{Math.round(maxRedeemablePoints * paisePerPoint / 100).toLocaleString()}</strong> with points
                    </span>
                    <button
                        type="button"
                        onClick={handleStartRedeem}
                        className="text-xs font-bold text-[#0B7A4B] hover:underline cursor-pointer"
                    >
                        Apply points →
                    </button>
                </div>
            )}
        </div>
    );
}

