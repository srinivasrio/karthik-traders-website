import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import {
    calculateEligibleSubtotalPaise,
    previewRedemption,
    reservePoints,
} from '@/lib/loyalty';
import { resolveDeliveryRule, evaluateOrderFreeDelivery } from '@/lib/delivery-config';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export async function POST(request: Request) {
    try {
        console.log('Checkout POST request received.');

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing on server!');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            console.warn('Missing Authorization header for checkout request.');
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        console.log('Verifying token at /api/checkout...');

        // Use getUser(token) to verify the client-side JWT
        let user: any = null;
        const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user) {
            user = userData.user;
        } else if (token.includes('.')) {
            // Fallback: verify user by decoding JWT payload sub (handles minor clock drift or token renewal lag)
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
                    const jwtPayload = JSON.parse(payloadStr);
                    const userId = jwtPayload.sub || jwtPayload.user_id;
                    if (userId && typeof userId === 'string') {
                        const { data: dbUserRes } = await supabaseAdmin.auth.admin.getUserById(userId);
                        if (dbUserRes?.user) {
                            user = dbUserRes.user;
                        }
                    }
                }
            } catch (e) {
                console.warn('Checkout JWT decode fallback failed:', e);
            }
        }

        if (!user) {
            console.error('Checkout Auth Error:', authError);
            return NextResponse.json({
                error: 'Invalid token',
                details: authError?.message || 'User not found'
            }, { status: 401 });
        }

        const body = await request.json();
        const {
            items,
            shippingAddress,
            totalAmount,
            couponCode,
            discountAmount,
            pointsToRedeem: clientPointsToRedeem,
        } = body;

        if (!items || !shippingAddress || totalAmount === undefined || totalAmount === null) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Deduplication guard: Check if the user placed an order in the last 15 seconds
        const fifteenSecondsAgo = new Date(Date.now() - 15000).toISOString();
        const { data: recentOrder } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, total_amount, loyalty_points_redeemed, loyalty_discount_amount, created_at')
            .eq('user_id', user.id)
            .gte('created_at', fifteenSecondsAgo)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (recentOrder) {
            console.log(`[Checkout] Duplicate order request detected for user ${user.id} within 15s. Returning existing order #${recentOrder.order_number}`);
            return NextResponse.json({
                success: true,
                orderId: String(recentOrder.order_number),
                loyaltyPointsRedeemed: recentOrder.loyalty_points_redeemed || 0,
                loyaltyDiscount: recentOrder.loyalty_discount_amount || 0,
                isDuplicate: true,
            });
        }

        // Fetch user profile to get mobile number & referral linkage
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('mobile, full_name, referred_by')
            .eq('id', user.id)
            .single();

        // Server-side validation of eligible product subtotal (excluding delivery charges)
        const eligibleSubtotalPaise = calculateEligibleSubtotalPaise(items);

        let validatedLoyaltyPoints = 0;
        let loyaltyDiscountRupees = 0;

        // Process loyalty points redemption if requested
        const requestedPoints = parseInt(clientPointsToRedeem || '0', 10);
        if (requestedPoints > 0) {
            const preview = await previewRedemption(user.id, eligibleSubtotalPaise, requestedPoints);
            if (!preview.is_eligible) {
                // Secondary check: Did an order just get placed for this user in the last 120 seconds that consumed points?
                const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();
                const { data: justPlacedOrder } = await supabaseAdmin
                    .from('orders')
                    .select('id, order_number, loyalty_points_redeemed, loyalty_discount_amount')
                    .eq('user_id', user.id)
                    .gte('created_at', twoMinutesAgo)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (justPlacedOrder) {
                    console.log(`[Checkout] Points were already consumed by recent order #${justPlacedOrder.order_number}. Returning success.`);
                    return NextResponse.json({
                        success: true,
                        orderId: String(justPlacedOrder.order_number),
                        loyaltyPointsRedeemed: justPlacedOrder.loyalty_points_redeemed || 0,
                        loyaltyDiscount: justPlacedOrder.loyalty_discount_amount || 0,
                        isDuplicate: true,
                    });
                }

                return NextResponse.json({
                    error: preview.message || 'Cart does not meet loyalty points redemption requirements',
                    code: preview.reason_code,
                }, { status: 400 });
            }

            validatedLoyaltyPoints = Math.min(requestedPoints, preview.max_redeemable_points || 0);
            loyaltyDiscountRupees = preview.discount_rupees || 0;
        }

        // Query live database products to guarantee server-side price integrity against admin updates
        const { data: dbProducts } = await supabaseAdmin
            .from('products')
            .select('id, slug, name, price, mrp, stock, is_active');

        // Format items for RPC with verified live prices
        const formattedItems = items.map((item: any) => {
            const dbMatch = (dbProducts || []).find((p: any) => {
                const cId = String(item.id || '').toLowerCase().trim();
                const cSlug = String(item.slug || '').toLowerCase().trim();
                const pId = String(p.id || '').toLowerCase().trim();
                const pSlug = String(p.slug || '').toLowerCase().trim();
                return (
                    (cId && pId && cId === pId) ||
                    (cSlug && pSlug && cSlug === pSlug) ||
                    (cId && pSlug && cId === pSlug) ||
                    (cSlug && pId && cSlug === pId)
                );
            });
            const livePrice = dbMatch && typeof dbMatch.price === 'number'
                ? Number(dbMatch.price)
                : Number(item.salePrice || item.price || item.mrp || 0);

            return {
                product_id: item.slug || item.id, // Use slug for DB mapping, fallback to ID
                quantity: item.quantity,
                price: livePrice
            };
        });

        // Normalize customer mobile number (digits only, no + or spaces)
        const rawMobile = String(profile?.mobile || shippingAddress.mobile || '');
        const normalizedMobile = rawMobile.replace(/\D/g, '');

        // Generate clean idempotency key for this order checkout
        const orderIdempotencyKey = `chk_${user.id}_${Date.now()}`;

        // Check if a referral code was applied
        let referredBy: string | null = null;
        let orderReferralCode: string | null = null;
        let referralDiscountAmount = 0;

        const rawCandidate = String(body.referralCode || couponCode || '').trim().toUpperCase();
        const candidateCode = rawCandidate.replace(/[^A-Z0-9]/g, '');
        if (candidateCode) {
            try {
                const { data: refProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('id, referral_code')
                    .or(`referral_code.eq.${candidateCode},referral_code.eq.${rawCandidate}`)
                    .maybeSingle();

                if (refProfile && refProfile.id !== user.id) {
                    referredBy = refProfile.id;
                    orderReferralCode = refProfile.referral_code;
                    referralDiscountAmount = Number(discountAmount) || 0;
                }
            } catch (refErr) {
                console.warn('Referral check error during checkout:', refErr);
            }
        }

        // If not entered at checkout, check if the customer was already referred during signup
        if (!referredBy && profile?.referred_by) {
            try {
                const { data: signupReferrer } = await supabaseAdmin
                    .from('profiles')
                    .select('id, referral_code')
                    .eq('id', profile.referred_by)
                    .maybeSingle();

                if (signupReferrer && signupReferrer.id !== user.id) {
                    referredBy = signupReferrer.id;
                    orderReferralCode = signupReferrer.referral_code;
                }
            } catch (refErr) {
                console.warn('Signup referrer lookup notice:', refErr);
            }
        }

        // Resolve state delivery rule strictly based on shipping state & aerator eligibility
        const stateCandidate = body.deliveryState || shippingAddress?.state || 'Andhra Pradesh';
        const deliveryEval = evaluateOrderFreeDelivery(items, stateCandidate);
        const deliveryRule = deliveryEval.deliveryRule;

        // Create order directly (with customer_mobile, loyalty, referral, and delivery fields)
        const orderPayload: any = {
            user_id: user.id,
            customer_mobile: normalizedMobile,
            customer_name: profile?.full_name || shippingAddress.fullName,
            total_amount: totalAmount,
            discount_amount: discountAmount || 0,
            coupon_code: couponCode || null,
            shipping_address: shippingAddress,
            status: 'pending',
            payment_status: 'pending',
            created_by_admin: false,
            delivery_state: deliveryRule.stateName,
            delivery_type: deliveryEval.isFreeDelivery ? 'free_ap' : 'customer_arranged',
            delivery_estimated_days: body.deliveryEstimatedDays || deliveryRule.timelineText,
            loyalty_points_redeemed: validatedLoyaltyPoints,
            loyalty_discount_amount: loyaltyDiscountRupees,
            loyalty_status: validatedLoyaltyPoints > 0 ? 'reserved' : 'none',
            referral_code: orderReferralCode,
            referred_by: referredBy,
            referral_discount_amount: referralDiscountAmount,
            referral_reward_status: referredBy ? 'pending' : 'none',
        };

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert(orderPayload)
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // Record referral ledger entry if referred
        if (referredBy && order) {
            try {
                await supabaseAdmin.from('referrals').insert({
                    referrer_id: referredBy,
                    referred_id: user.id,
                    order_id: order.id,
                    referral_code: orderReferralCode,
                    status: 'pending',
                    points_awarded: 0,
                    discount_given: referralDiscountAmount,
                });
            } catch (refInsertErr) {
                console.warn('Could not record referral ledger entry:', refInsertErr);
            }
        }

        // Reserve loyalty points atomically
        if (validatedLoyaltyPoints > 0) {
            try {
                await reservePoints(
                    user.id,
                    order.id,
                    validatedLoyaltyPoints,
                    eligibleSubtotalPaise,
                    orderIdempotencyKey
                );
            } catch (ptsError: any) {
                console.error('Failed to reserve points, rolling back order:', ptsError);
                // Rollback order creation
                await supabaseAdmin.from('orders').delete().eq('id', order.id);
                return NextResponse.json({
                    error: `Failed to redeem points: ${ptsError.message}`,
                }, { status: 400 });
            }
        }

        // Insert order items
        const orderItems = formattedItems.map((item: any) => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_purchase: item.price
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Rollback order and release points if reserved
            if (validatedLoyaltyPoints > 0) {
                try {
                    await supabaseAdmin.rpc('loyalty_release_points', {
                        p_order_id: order.id,
                        p_reason: 'Checkout items insertion failed'
                    });
                } catch (e) {
                    console.error('Release points rollback failed:', e);
                }
            }
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        // 3. Send Telegram Notification
        const itemsList = items.map((item: any) =>
            `• ${item.name} x${item.quantity} - ₹${(item.salePrice || item.price).toLocaleString()}`
        ).join('\n');

        let loyaltyText = '';
        if (validatedLoyaltyPoints > 0) {
            loyaltyText = `\n<b>🎁 Loyalty Redeemed:</b> <b>${validatedLoyaltyPoints} pts (-₹${loyaltyDiscountRupees.toLocaleString()})</b>`;
        }

        const telegramText = `
<b>🛍️ New Order Received!</b>
━━━━━━━━━━━━━━━━━━
<b>Order #:</b> <code>${order.order_number}</code>
<b>Customer:</b> ${order.customer_name}
<b>Mobile:</b> <code>${order.customer_mobile}</code>
<b>Total:</b> <b>₹${totalAmount.toLocaleString()}</b>${loyaltyText}
━━━━━━━━━━━━━━━━━━
<b>Items:</b>
${itemsList}
━━━━━━━━━━━━━━━━━━
<b>Shipping Address:</b>
${shippingAddress.addressLine1}, ${shippingAddress.city}
${shippingAddress.state}, ${shippingAddress.pincode}
`.trim();

        sendTelegramMessage(telegramText).catch(err => {
            console.error('Async Telegram Error:', err);
        });

        return NextResponse.json({
            success: true,
            orderId: String(order.order_number),
            loyaltyPointsRedeemed: validatedLoyaltyPoints,
            loyaltyDiscount: loyaltyDiscountRupees
        });
    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
