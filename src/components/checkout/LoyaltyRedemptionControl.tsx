'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/data/products';
import { SparklesIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

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
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [pointsInput, setPointsInput] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState('');

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
                        pointsRequested: isRedeeming ? pointsInput : null,
                    }),
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setPreviewData(data);
                    if (isRedeeming) {
                        const maxPts = data.max_redeemable_points || 0;
                        const pts = Math.min(pointsInput || maxPts, maxPts);
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
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Log in to earn & redeem <strong>Loyalty Points</strong></span>
                </div>
                <Link href="/login" className="font-extrabold text-[#1E3A8A] underline hover:text-[#0B1A33]">
                    Log In
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

    const handleToggle = (checked: boolean) => {
        setIsRedeeming(checked);
        if (checked) {
            const initialPts = maxRedeemablePoints;
            setPointsInput(initialPts);
            const discount = Math.round(initialPts * paisePerPoint) / 100;
            onApplyPoints(initialPts, discount);
        } else {
            setPointsInput(0);
            onApplyPoints(0, 0);
        }
    };

    const handlePointsChange = (pts: number) => {
        const clamped = Math.max(0, Math.min(pts, maxRedeemablePoints));
        setPointsInput(clamped);
        const discount = Math.round(clamped * paisePerPoint) / 100;
        onApplyPoints(clamped, discount);
    };

    return (
        <div className="rounded-2xl border border-[#DDE4F0] bg-linear-to-b from-white to-[#F8FAFC] p-4 flex flex-col gap-3 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <SparklesIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs font-extrabold text-[#0B1A33] flex items-center gap-1.5 font-poppins">
                            <span>Karthik Loyalty Rewards</span>
                            <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                {availablePoints} pts (≈ ₹{rupeeValue.toLocaleString()})
                            </span>
                        </div>
                    </div>
                </div>

                {isEligible && (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isRedeeming}
                            onChange={(e) => handleToggle(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B7A4B]"></div>
                    </label>
                )}
            </div>

            {/* Ineligible states */}
            {!isEligible && previewData?.reason_code === 'MIN_SUBTOTAL_NOT_MET' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                        Add <strong>₹{shortfallRupees.toLocaleString()}</strong> more worth of items to unlock points redemption (Min subtotal: <strong>₹{minSubtotalRupees.toLocaleString()}</strong>).
                    </div>
                </div>
            )}

            {!isEligible && previewData?.reason_code === 'MIN_POINTS_NOT_MET' && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <InformationCircleIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                        You have <strong>{availablePoints} points</strong>. A minimum of <strong>{walletData?.settings?.min_points_to_redeem || 50} points</strong> is required to redeem.
                    </div>
                </div>
            )}

            {/* Eligible and Active */}
            {isEligible && isRedeeming && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                        <span>Redeem Points:</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                max={maxRedeemablePoints}
                                value={pointsInput}
                                onChange={(e) => handlePointsChange(parseInt(e.target.value || '0', 10))}
                                className="w-20 h-7 text-center font-mono font-bold text-xs bg-white border border-emerald-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={() => handlePointsChange(maxRedeemablePoints)}
                                className="px-2 py-1 rounded-md bg-emerald-600 text-white font-extrabold text-[10px] hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                                Max
                            </button>
                        </div>
                    </div>

                    {/* Discount feedback */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/60">
                        <span className="text-emerald-800 font-medium">Applied Points Discount:</span>
                        <span className="font-extrabold font-mono text-emerald-700 text-sm">
                            − {formatPrice(appliedDiscount)}
                        </span>
                    </div>

                    <div className="text-[11px] text-emerald-800/80 leading-normal">
                        Using {pointsInput} points out of {maxRedeemablePoints} max redeemable for this order (1 pt = ₹{(paisePerPoint / 100).toFixed(2)}).
                    </div>
                </div>
            )}

            {/* Eligible but Not Active prompt */}
            {isEligible && !isRedeeming && (
                <div className="flex items-center justify-between text-xs text-[#5B6880] px-1">
                    <span>You can redeem up to <strong>{maxRedeemablePoints} points</strong> (Save <strong>₹{(maxRedeemablePoints * paisePerPoint / 100).toLocaleString()}</strong>)</span>
                    <button
                        type="button"
                        onClick={() => handleToggle(true)}
                        className="text-xs font-extrabold text-[#0B7A4B] hover:underline cursor-pointer"
                    >
                        Redeem Now
                    </button>
                </div>
            )}
        </div>
    );
}

