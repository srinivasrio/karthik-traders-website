import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        console.log('[DEBUG] Reject Order Request received for:', orderId);

        // Debug environment variables
        console.log('[DEBUG] SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('[DEBUG] SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

        // Debug environment variables
        console.log('[DEBUG] SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('[DEBUG] SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);


        // Verify admin token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('[DEBUG] Token extraction success, length:', token.length);

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            console.error('[DEBUG] Auth Error:', authError?.message || 'No user found');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        console.log('[DEBUG] User authenticated:', user.id);

        // Check if user is admin
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('[DEBUG] Profile fetch:', profile?.role || 'null', 'Error:', profileError?.message || 'none');

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get order with items
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                order_items(product_id, quantity)
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'pending') {
            return NextResponse.json({ error: 'Order is not pending' }, { status: 400 });
        }

        // Deduct stock for each item
        for (const item of order.order_items) {
            const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity
            });

            if (stockError) {
                console.error('Stock deduction error:', stockError);
                // Try direct update as fallback
                const { data: product } = await supabaseAdmin
                    .from('products')
                    .select('stock')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    await supabaseAdmin
                        .from('products')
                        .update({ stock: Math.max(0, product.stock - item.quantity) })
                        .eq('id', item.product_id);
                }
            }
        }

        // Update order status to confirmed
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Order accepted and stock updated'
        });

    } catch (err: any) {
        console.error('Accept order error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
