import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import {
    calculateEligibleSubtotalPaise,
    previewRedemption,
    reservePoints,
} from '@/lib/loyalty';

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
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
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

        // Fetch user profile to get mobile number
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('mobile, full_name')
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
                return NextResponse.json({
                    error: preview.message || 'Cart does not meet loyalty points redemption requirements',
                    code: preview.reason_code,
                }, { status: 400 });
            }

            validatedLoyaltyPoints = Math.min(requestedPoints, preview.max_redeemable_points || 0);
            loyaltyDiscountRupees = preview.discount_rupees || 0;
        }

        // Format items for RPC
        const formattedItems = items.map((item: any) => ({
            product_id: item.slug || item.id, // Use slug for DB mapping, fallback to ID
            quantity: item.quantity,
            price: item.salePrice || item.price || item.mrp
        }));

        // Normalize customer mobile number (digits only, no + or spaces)
        const rawMobile = profile?.mobile || shippingAddress.mobile || '';
        const normalizedMobile = rawMobile.replace(/\D/g, '');

        // Generate clean idempotency key for this order checkout
        const orderIdempotencyKey = `chk_${user.id}_${Date.now()}`;

        // Create order directly (with customer_mobile and loyalty fields)
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
            loyalty_points_redeemed: validatedLoyaltyPoints,
            loyalty_discount_amount: loyaltyDiscountRupees,
            loyalty_status: validatedLoyaltyPoints > 0 ? 'reserved' : 'none',
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
            orderId: order.order_number,
            loyaltyPointsRedeemed: validatedLoyaltyPoints,
            loyaltyDiscount: loyaltyDiscountRupees
        });
    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
