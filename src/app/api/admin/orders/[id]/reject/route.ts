import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        // Verify admin token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status !== 'pending') {
            return NextResponse.json({ error: 'Order is not pending' }, { status: 400 });
        }

        // Update order status to rejected (no stock changes needed)
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Order rejected'
        });

    } catch (err: any) {
        console.error('Reject order error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
