import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

        const token = authHeader.replace('Bearer ', '');
        console.log('Token received length:', token.length);
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
        const { items, shippingAddress, totalAmount } = body;

        if (!items || !shippingAddress || !totalAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch user profile to get mobile number
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('mobile, full_name')
            .eq('id', user.id)
            .single();

        // Format items for RPC
        const formattedItems = items.map((item: any) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.salePrice || item.price || item.mrp
        }));

        // Create order directly (with customer_mobile for linking)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                customer_mobile: profile?.mobile || shippingAddress.mobile,
                customer_name: profile?.full_name || shippingAddress.fullName,
                total_amount: totalAmount,
                shipping_address: shippingAddress,
                status: 'pending',
                payment_status: 'pending',
                created_by_admin: false
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 500 });
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
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, orderId: order.order_number });
    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
