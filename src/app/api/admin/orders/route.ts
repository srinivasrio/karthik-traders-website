import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { customerMobile, customerName, items, totalAmount, notes } = body;

        if (!customerMobile || !items || items.length === 0 || !totalAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Normalize customer mobile number (digits only, no + or spaces)
        const normalizedMobile = customerMobile.replace(/\D/g, '');
        const last10Digits = normalizedMobile.slice(-10);

        // Check if customer with this mobile exists
        // Match digits only (avoiding dangerous '+' inside the or filter string)
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .or(`mobile.eq.${normalizedMobile},mobile.eq.91${last10Digits},mobile.eq.${last10Digits}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: existingProfile?.id || null, // Link if user exists
                customer_mobile: normalizedMobile,
                customer_name: customerName || existingProfile?.full_name || 'Unknown',
                total_amount: totalAmount,
                status: 'pending',
                payment_status: 'pending',
                created_by_admin: true,
                shipping_address: { notes: notes || '' }
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 500 });
        }

        // Insert order items
        const orderItems = items.map((item: any) => ({
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
            // Rollback: delete the order
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }

        // Update product stock using RPC correctly
        for (const item of items) {
            await supabaseAdmin.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity
            });
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            message: existingProfile
                ? 'Order created and linked to existing customer'
                : 'Order created - will be linked when customer registers'
        });
    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Fetch products for name mapping (Invoice PDF fix)
        const { data: productsData } = await supabaseAdmin
            .from('products')
            .select('id, name, slug');

        const productMap = new Map();
        if (productsData) {
            productsData.forEach(p => {
                productMap.set(p.id, p);
                productMap.set(p.slug, p);
            });
        }

        // Fetch all orders with customer info
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                profile:profiles(full_name, mobile),
                order_items(
                    quantity,
                    price_at_purchase,
                    product_id
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const mappedOrders = (orders || []).map(order => ({
            ...order,
            order_items: order.order_items?.map((item: any) => ({
                ...item,
                product_name: productMap.get(item.product_id)?.name || item.product_id
            })) || []
        }));

        return NextResponse.json({ orders: mappedOrders });
    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
