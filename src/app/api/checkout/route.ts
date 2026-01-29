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

        const body = await request.json();
        const { items, shippingAddress, totalAmount } = body;

        if (!items || !shippingAddress || !totalAmount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Format items for RPC
        const formattedItems = items.map((item: any) => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.salePrice || item.price || item.mrp
        }));

        // Call RPC function using Admin Client (bypasses RLS)
        const { data: orderId, error } = await supabaseAdmin
            .rpc('create_order_with_stock', {
                p_user_id: user.id,
                p_total_amount: totalAmount,
                p_shipping_address: shippingAddress,
                p_items: formattedItems
            });

        if (error) {
            console.error('Order creation error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, orderId });
    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
