'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client using service role to bypass client RLS policies
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

export async function deleteOrderAction(orderId: string) {
    try {
        console.log(`Server Action: Deleting order ${orderId}...`);
        const { error } = await supabaseAdmin
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            console.error('Error deleting order:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Delete order exception:', err);
        return { success: false, error: err.message || 'Internal Server Error' };
    }
}

export async function updateOrderFulfillmentAction(
    orderId: string,
    items: Array<{
        id: string;
        is_available: boolean;
        fulfilled_quantity: number;
        out_of_stock_reason?: string;
    }>,
    includeOosInInvoice: boolean,
    status: string
) {
    try {
        console.log(`Server Action: Updating fulfillment for order ${orderId}...`);
        // 1. Update each order item
        for (const item of items) {
            const { error: itemError } = await supabaseAdmin
                .from('order_items')
                .update({
                    is_available: item.is_available,
                    fulfilled_quantity: item.is_available ? item.fulfilled_quantity : 0,
                    out_of_stock_reason: item.is_available ? null : (item.out_of_stock_reason || null)
                })
                .eq('id', item.id);

            if (itemError) {
                console.error(`Error updating order item ${item.id}:`, itemError);
                return { success: false, error: itemError.message };
            }
        }

        // 2. Fetch updated order items to recalculate total
        const { data: updatedItems, error: fetchError } = await supabaseAdmin
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (fetchError || !updatedItems) {
            console.error('Error fetching updated order items:', fetchError);
            return { success: false, error: fetchError?.message || 'Failed to fetch items' };
        }

        // Recalculate subtotal using only available items (and their fulfilled quantity)
        let newSubtotal = 0;
        updatedItems.forEach(item => {
            if (item.is_available) {
                newSubtotal += Number(item.price_at_purchase) * Number(item.fulfilled_quantity || 0);
            }
        });

        // Fetch order to get discount details
        const { data: orderData, error: orderFetchError } = await supabaseAdmin
            .from('orders')
            .select('discount_amount')
            .eq('id', orderId)
            .single();

        if (orderFetchError || !orderData) {
            console.error('Error fetching order discount:', orderFetchError);
            return { success: false, error: orderFetchError?.message || 'Failed to fetch order details' };
        }

        const discount = Number(orderData.discount_amount || 0);
        // Avoid negative total
        const newTotal = Math.max(0, newSubtotal - discount);

        // 3. Update order total, include_oos_in_invoice, and status
        const { error: updateOrderError } = await supabaseAdmin
            .from('orders')
            .update({
                total_amount: newTotal,
                include_oos_in_invoice: includeOosInInvoice,
                status: status
            })
            .eq('id', orderId);

        if (updateOrderError) {
            console.error('Error updating order totals:', updateOrderError);
            return { success: false, error: updateOrderError.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Fulfillment update exception:', err);
        return { success: false, error: err.message || 'Internal Server Error' };
    }
}
