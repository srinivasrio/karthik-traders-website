import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getLocalSettingsPath() {
    return path.join(process.cwd(), 'src/data/loyalty-settings.json');
}

function readLocalSettings(): LoyaltySettings | null {
    try {
        const filePath = getLocalSettingsPath();
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        // Ignore read error
    }
    return null;
}

function writeLocalSettings(settings: LoyaltySettings) {
    try {
        const filePath = getLocalSettingsPath();
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
    } catch (e) {
        console.warn('Failed to write local loyalty settings file:', e);
    }
}

// Default configuration constants (used as fallback and initial values)
export const DEFAULT_LOYALTY_SETTINGS = {
    id: 1,
    is_enabled: true,
    signup_bonus_points: 50,
    earning_percentage: 1.0,     // 1.0% reward on eligible subtotal
    rupees_spent_per_point: 100, // Legacy fallback: Spend ₹100 to earn 1 point
    paise_per_point: 25,         // 1 point = 25 paise = ₹0.25 discount
    min_cart_subtotal_paise: 500000, // ₹5,000 minimum cart subtotal required to redeem
    min_points_to_redeem: 50,    // Minimum 50 points required to redeem
    max_redemption_percentage: 20, // Max 20% of eligible subtotal can be paid with points
    max_points_per_order: 2000,  // Max 2,000 points redeemable per order (₹500 discount cap)
    expiry_days: 365,            // Points expire after 365 days
};

export interface LoyaltySettings {
    id: number;
    is_enabled: boolean;
    signup_bonus_points: number;
    earning_percentage: number;
    rupees_spent_per_point: number;
    paise_per_point: number;
    min_cart_subtotal_paise: number;
    min_points_to_redeem: number;
    max_redemption_percentage: number;
    max_points_per_order: number;
    expiry_days: number;
    updated_at?: string;
    updated_by?: string;
}

export interface LoyaltyWallet {
    id: string;
    user_id: string;
    points_balance: number;
    lifetime_earned_points: number;
    lifetime_redeemed_points: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoyaltyTransaction {
    id: string;
    wallet_id: string;
    user_id: string;
    transaction_type:
        | 'signup_bonus'
        | 'purchase_earned'
        | 'promotional_bonus'
        | 'checkout_redemption'
        | 'redemption_refund'
        | 'points_expired'
        | 'admin_credit'
        | 'admin_debit'
        | 'order_cancelled_restore';
    points: number;
    balance_after: number;
    rupee_value_paise: number;
    conversion_rate_paise: number;
    reference_id?: string;
    description: string;
    idempotency_key?: string;
    created_at: string;
}

export interface LoyaltyPromotion {
    id: string;
    name: string;
    code?: string;
    description?: string;
    promotion_type: 'multiplier' | 'fixed_bonus';
    bonus_value: number;
    min_cart_subtotal_paise: number;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoyaltyRedemption {
    id: string;
    order_id?: string;
    wallet_id: string;
    user_id: string;
    points_redeemed: number;
    discount_paise: number;
    conversion_rate_paise: number;
    status: 'reserved' | 'applied' | 'released' | 'refunded';
    idempotency_key: string;
    created_at: string;
}

export interface LoyaltyAdminAudit {
    id: string;
    admin_user_id: string;
    action_type: string;
    target_wallet_id?: string;
    target_user_id?: string;
    points_changed?: number;
    reason: string;
    details: Record<string, any>;
    created_at: string;
    admin_profile?: {
        full_name?: string;
        mobile?: string;
    };
}

export interface RedemptionPreviewResult {
    is_eligible: boolean;
    available_points?: number;
    max_redeemable_points?: number;
    points_to_redeem?: number;
    discount_paise?: number;
    discount_rupees?: number;
    paise_per_point?: number;
    max_percentage?: number;
    reason_code?: string;
    message?: string;
    min_subtotal_rupees?: number;
    shortfall_rupees?: number;
    min_points_required?: number;
}

// Create Supabase Admin client
export function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing on server');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

/**
 * Calculates the eligible product subtotal in integer paise.
 * Excludes delivery charges and validates prices strictly.
 */
export function calculateEligibleSubtotalPaise(items: any[]): number {
    if (!Array.isArray(items) || items.length === 0) return 0;

    const subtotalRupees = items.reduce((sum, item) => {
        const rawPrice = item.salePrice !== undefined && item.salePrice !== null
            ? item.salePrice
            : (item.price !== undefined && item.price !== null ? item.price : item.mrp);

        const price = typeof rawPrice === 'string'
            ? parseFloat(rawPrice.replace(/[^\d.]/g, ''))
            : (typeof rawPrice === 'number' ? rawPrice : 0);

        const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
        return sum + (price * quantity);
    }, 0);

    return Math.round(subtotalRupees * 100);
}

/**
 * Verifies authenticated caller securely from request headers.
 * Accepts both Supabase Bearer JWTs and Firebase ID Tokens via bridge.
 * Never trusts user_id supplied by client payload.
 */
export async function getAuthenticatedUser(request: Request): Promise<{
    user: { id: string; phone?: string; email?: string };
    profile: { id: string; role: string; mobile?: string; full_name?: string } | null;
    isAdmin: boolean;
} | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Try Supabase JWT verification
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (!error && user) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id, role, mobile, full_name')
                .eq('id', user.id)
                .maybeSingle();

            const isAdmin = profile?.role === 'admin' ||
                ['+918688566023', '+916301183738', '+919515816084', '8688566023', '6301183738', '9515816084'].includes(
                    (profile?.mobile || user.phone || '').replace(/\s+/g, '')
                );

            return {
                user: { id: user.id, phone: user.phone || profile?.mobile, email: user.email },
                profile,
                isAdmin: !!isAdmin,
            };
        }
    } catch (e) {
        // Fall through to Firebase check
    }

    // 2. Fallback: Firebase ID Token Bridge
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (firebaseApiKey) {
        try {
            const verificationUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
            const verificationResponse = await fetch(verificationUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: token }),
            });

            if (verificationResponse.ok) {
                const verificationData = await verificationResponse.json();
                if (verificationData.users && verificationData.users.length > 0) {
                    const fbUser = verificationData.users[0];
                    const phone = fbUser.phoneNumber;

                    if (phone) {
                        const cleanDigits = phone.replace(/\D/g, '');
                        const last10 = cleanDigits.slice(-10);

                        // Match user profile by phone
                        const { data: profile } = await supabaseAdmin
                            .from('profiles')
                            .select('id, role, mobile, full_name')
                            .or(`mobile.eq.${cleanDigits},mobile.eq.+91${last10},mobile.eq.${last10}`)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        if (profile) {
                            const isAdmin = profile.role === 'admin';
                            return {
                                user: { id: profile.id, phone, email: fbUser.email },
                                profile,
                                isAdmin,
                            };
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Firebase bridge authentication error:', e);
        }
    }

    return null;
}

/**
 * Fetch Loyalty Settings (with safe fallback)
 */
export async function getLoyaltySettings(): Promise<LoyaltySettings> {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('loyalty_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (!error && data) {
            return data as LoyaltySettings;
        }
    } catch (e) {
        // Fall through to local fallback
    }

    const local = readLocalSettings();
    if (local) return local;

    return DEFAULT_LOYALTY_SETTINGS as LoyaltySettings;
}

/**
 * Update Loyalty Settings (direct confirmation without requiring audit reason)
 */
export async function updateLoyaltySettings(
    adminId: string,
    newSettings: Partial<LoyaltySettings>,
    reason?: string
) {
    const current = await getLoyaltySettings();
    const merged: LoyaltySettings = {
        ...current,
        ...newSettings,
        updated_at: new Date().toISOString(),
        updated_by: adminId,
    };

    // Always update local fallback file so localhost and offline work immediately
    writeLocalSettings(merged);

    // Also attempt to update Supabase database table if present
    try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from('loyalty_settings')
            .upsert({
                ...merged,
                id: 1,
            }, { onConflict: 'id' });

        if (error) {
            console.warn('Supabase loyalty_settings update note (migration pending on database):', error.message);
        }
    } catch (err: any) {
        console.warn('Supabase loyalty_settings update notice:', err?.message);
    }

    return { success: true, settings: merged };
}

/**
 * Fetch customer wallet summary (points balance, rupee value, recent transactions)
 */
export async function getWalletSummary(userId: string) {
    const supabase = getSupabaseAdmin();

    try {
        const { data, error } = await supabase.rpc('loyalty_get_wallet_summary', {
            p_user_id: userId,
        });

        if (!error && data) {
            return data;
        }
    } catch (e) {
        // Fallback below
    }

    // Fallback: query tables directly
    const settings = await getLoyaltySettings();

    try {
        // Ensure wallet exists
        let { data: wallet, error: wErr } = await supabase
            .from('loyalty_wallets')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (wErr) {
            console.warn('Loyalty wallet query note:', wErr.message);
        }

        if (!wallet && !wErr) {
            try {
                const { data: newWallet } = await supabase
                    .from('loyalty_wallets')
                    .insert({ user_id: userId, points_balance: 0 })
                    .select()
                    .single();
                wallet = newWallet;
            } catch (e) {
                // Table might not exist yet
            }
        }

        let transactions: any[] = [];
        try {
            const { data: txData } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);
            transactions = txData || [];
        } catch (e) {
            // Ignore if table missing
        }

        const points = wallet?.points_balance || 0;
        const rupeeValue = Math.round((points * (settings.paise_per_point || 25))) / 100;

        return {
            wallet_id: wallet?.id || null,
            user_id: userId,
            points_balance: points,
            rupee_value: rupeeValue,
            lifetime_earned_points: wallet?.lifetime_earned_points || 0,
            lifetime_redeemed_points: wallet?.lifetime_redeemed_points || 0,
            is_active: wallet?.is_active ?? true,
            expiring_soon_points: 0,
            next_expiry_date: null,
            settings: {
                is_enabled: settings.is_enabled,
                earning_percentage: settings.earning_percentage ?? 1.0,
                paise_per_point: settings.paise_per_point,
                rupees_spent_per_point: settings.rupees_spent_per_point,
                min_cart_subtotal_paise: settings.min_cart_subtotal_paise,
                min_cart_subtotal_rupees: (settings.min_cart_subtotal_paise || 0) / 100,
                min_points_to_redeem: settings.min_points_to_redeem,
                max_redemption_percentage: settings.max_redemption_percentage,
                max_points_per_order: settings.max_points_per_order,
            },
            recent_transactions: transactions,
        };
    } catch (err: any) {
        console.warn('Fallback loyalty summary error:', err?.message);
        return {
            wallet_id: null,
            user_id: userId,
            points_balance: 0,
            rupee_value: 0,
            lifetime_earned_points: 0,
            lifetime_redeemed_points: 0,
            is_active: true,
            expiring_soon_points: 0,
            next_expiry_date: null,
            settings: {
                is_enabled: settings.is_enabled,
                earning_percentage: settings.earning_percentage ?? 1.0,
                paise_per_point: settings.paise_per_point,
                rupees_spent_per_point: settings.rupees_spent_per_point,
                min_cart_subtotal_paise: settings.min_cart_subtotal_paise,
                min_cart_subtotal_rupees: (settings.min_cart_subtotal_paise || 0) / 100,
                min_points_to_redeem: settings.min_points_to_redeem,
                max_redemption_percentage: settings.max_redemption_percentage,
                max_points_per_order: settings.max_points_per_order,
            },
            recent_transactions: [],
        };
    }
}

/**
 * Preview redemption eligibility and calculate exact points and discounts
 */
export async function previewRedemption(
    userId: string,
    eligibleSubtotalPaise: number,
    pointsRequested?: number
): Promise<RedemptionPreviewResult> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('loyalty_preview_redemption', {
        p_user_id: userId,
        p_eligible_subtotal_paise: eligibleSubtotalPaise,
        p_points_requested: pointsRequested ?? null,
    });

    if (!error && data) {
        return data as RedemptionPreviewResult;
    }

    // Fallback: Pure TypeScript validation logic matching the SQL rules
    const settings = await getLoyaltySettings();
    if (!settings.is_enabled) {
        return {
            is_eligible: false,
            reason_code: 'PROGRAM_DISABLED',
            message: 'Loyalty rewards program is currently inactive.',
        };
    }

    const { data: wallet } = await supabase
        .from('loyalty_wallets')
        .select('points_balance, is_active')
        .eq('user_id', userId)
        .maybeSingle();

    const pointsBalance = wallet?.points_balance || 0;

    if (eligibleSubtotalPaise < settings.min_cart_subtotal_paise) {
        const shortfallPaise = settings.min_cart_subtotal_paise - eligibleSubtotalPaise;
        const shortfallRupees = Math.ceil(shortfallPaise / 100);
        return {
            is_eligible: false,
            reason_code: 'MIN_SUBTOTAL_NOT_MET',
            min_subtotal_rupees: settings.min_cart_subtotal_paise / 100,
            shortfall_rupees: shortfallRupees,
            message: `Add ₹${shortfallRupees.toLocaleString()} more of eligible products to redeem loyalty points.`,
        };
    }

    if (pointsBalance < settings.min_points_to_redeem) {
        return {
            is_eligible: false,
            reason_code: 'MIN_POINTS_NOT_MET',
            min_points_required: settings.min_points_to_redeem,
            available_points: pointsBalance,
            message: `A minimum of ${settings.min_points_to_redeem} points is required to redeem. You have ${pointsBalance} points.`,
        };
    }

    const maxDiscountPaise = Math.floor(eligibleSubtotalPaise * (settings.max_redemption_percentage / 100));
    const maxPointsBySubtotal = Math.floor(maxDiscountPaise / settings.paise_per_point);
    const maxPointsByOrder = settings.max_points_per_order > 0 ? settings.max_points_per_order : 99999999;
    const maxRedeemablePoints = Math.max(0, Math.min(pointsBalance, maxPointsBySubtotal, maxPointsByOrder));

    if (maxRedeemablePoints < settings.min_points_to_redeem) {
        return {
            is_eligible: false,
            reason_code: 'MAX_BELOW_MIN_THRESHOLD',
            max_redeemable_points: maxRedeemablePoints,
            min_points_required: settings.min_points_to_redeem,
            message: `Order limit allows up to ${maxRedeemablePoints} points, which is below the minimum threshold of ${settings.min_points_to_redeem} points.`,
        };
    }

    const pointsToRedeem = pointsRequested && pointsRequested > 0
        ? Math.min(pointsRequested, maxRedeemablePoints)
        : maxRedeemablePoints;

    const discountPaise = pointsToRedeem * settings.paise_per_point;

    return {
        is_eligible: true,
        available_points: pointsBalance,
        max_redeemable_points: maxRedeemablePoints,
        points_to_redeem: pointsToRedeem,
        discount_paise: discountPaise,
        discount_rupees: Math.round(discountPaise) / 100,
        paise_per_point: settings.paise_per_point,
        max_percentage: settings.max_redemption_percentage,
    };
}

/**
 * Reserve points for checkout
 */
export async function reservePoints(
    userId: string,
    orderId: string,
    pointsToRedeem: number,
    eligibleSubtotalPaise: number,
    idempotencyKey: string
) {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('loyalty_reserve_points', {
        p_user_id: userId,
        p_order_id: orderId,
        p_points_to_redeem: pointsToRedeem,
        p_eligible_subtotal_paise: eligibleSubtotalPaise,
        p_idempotency_key: idempotencyKey,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Confirm points redemption when order is confirmed
 */
export async function confirmRedemption(orderId: string) {
    const supabase = getSupabaseAdmin();
    return await supabase.rpc('loyalty_confirm_redemption', { p_order_id: orderId });
}

/**
 * Release reserved points when checkout fails or order cancelled
 */
export async function releasePoints(orderId: string, reason: string) {
    const supabase = getSupabaseAdmin();
    return await supabase.rpc('loyalty_release_points', {
        p_order_id: orderId,
        p_reason: reason,
    });
}

/**
 * Award purchase reward points when order is delivered/completed
 */
export async function awardPurchasePoints(orderId: string) {
    const supabase = getSupabaseAdmin();
    return await supabase.rpc('loyalty_award_purchase_points', { p_order_id: orderId });
}

/**
 * Process expired points
 */
export async function processExpiredPoints() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('loyalty_process_expired_points');
    if (error) throw new Error(error.message);
    return data;
}

/**
 * Process refunds and points restoration
 */
export async function processRefundPoints(orderId: string, refundPercentage: number = 100) {
    const supabase = getSupabaseAdmin();
    return await supabase.rpc('loyalty_process_refund_points', {
        p_order_id: orderId,
        p_refund_percentage: refundPercentage,
    });
}

/**
 * Admin manual points adjustment
 */
export async function adminAdjustPoints(
    adminId: string,
    userId: string,
    points: number,
    reason: string
) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('loyalty_admin_adjust_points', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_points: points,
        p_reason: reason,
    });

    if (error) throw new Error(error.message);
    return data;
}
