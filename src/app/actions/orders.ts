'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { resolveDeliveryRule } from '@/lib/delivery-config';

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
        
        let columnsExist = true;
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
                const errMsg = itemError.message || '';
                if (
                    itemError.code === '42703' || 
                    itemError.code === 'PGRST200' || 
                    errMsg.includes('fulfilled_quantity') ||
                    errMsg.includes('is_available') ||
                    errMsg.includes('out_of_stock_reason') ||
                    errMsg.includes('column')
                ) {
                    columnsExist = false;
                    console.warn('[Server Action] Columns for partial fulfillment do not exist. Falling back to status-only update.');
                    break;
                }
                console.error(`Error updating order item ${item.id}:`, itemError);
                return { success: false, error: itemError.message };
            }
        }

        if (!columnsExist) {
            // Fallback: update status of the order only (without new fields like include_oos_in_invoice or total recalculations that rely on fulfilled_quantity)
            const { error: updateOrderError } = await supabaseAdmin
                .from('orders')
                .update({
                    status: status
                })
                .eq('id', orderId);

            if (updateOrderError) {
                console.error('Error updating order status in fallback:', updateOrderError);
                return { success: false, error: updateOrderError.message };
            }

            return { 
                success: true, 
                warning: 'Migration required: The "partial stock order management" columns (is_available, fulfilled_quantity, out_of_stock_reason) do not exist in your database schema cache. The order status has been updated, but out-of-stock items and recalculated totals could not be saved. Please run the migration script (vps_partial_fulfillment.sh) on your VPS or execute the SQL in your Supabase SQL Editor.' 
            };
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

export interface OrderDispatchInput {
    vehicle_number?: string;
    vehicle_type?: string;
    driver_name?: string;
    driver_mobile?: string;
    vehicle_photo_url?: string;
    transport_name?: string;
    lr_number?: string;
    estimated_delivery_date?: string;
    delivery_state?: string;
    delivery_type?: string;
    delivery_estimated_days?: string;
    mark_shipped?: boolean;
}

export async function updateOrderDispatchAction(orderId: string, input: OrderDispatchInput) {
    try {
        const { data: currentOrder, error: fetchErr } = await supabaseAdmin
            .from('orders')
            .select('id, status, shipping_address, delivery_state, dispatched_at')
            .eq('id', orderId)
            .single();

        if (fetchErr || !currentOrder) {
            return { success: false, error: 'Order not found' };
        }

        const stateToUse = input.delivery_state || currentOrder.delivery_state || (typeof currentOrder.shipping_address === 'object' ? currentOrder.shipping_address?.state : null) || 'Andhra Pradesh';
        const rule = resolveDeliveryRule(stateToUse);

        const updatePayload: Record<string, any> = {
            vehicle_number: input.vehicle_number ? String(input.vehicle_number).trim().toUpperCase() : null,
            vehicle_type: input.vehicle_type ? String(input.vehicle_type).trim() : null,
            driver_name: input.driver_name ? String(input.driver_name).trim() : null,
            driver_mobile: input.driver_mobile ? String(input.driver_mobile).trim().replace(/[^\d+]/g, '') : null,
            vehicle_photo_url: input.vehicle_photo_url ? String(input.vehicle_photo_url).trim() : null,
            transport_name: input.transport_name ? String(input.transport_name).trim() : null,
            lr_number: input.lr_number ? String(input.lr_number).trim() : null,
            estimated_delivery_date: input.estimated_delivery_date || null,
            delivery_state: rule.stateName,
            delivery_type: rule.responsibility === 'karthik_traders' ? 'free_ap' : 'customer_arranged',
            delivery_estimated_days: input.delivery_estimated_days || rule.timelineText,
            updated_at: new Date().toISOString(),
        };

        if (input.mark_shipped) {
            updatePayload.status = 'shipped';
            if (!currentOrder.dispatched_at) {
                updatePayload.dispatched_at = new Date().toISOString();
            }
        }

        const { data: updatedOrder, error: updateErr } = await supabaseAdmin
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)
            .select()
            .single();

        if (updateErr) {
            console.error('Error updating order dispatch details:', updateErr);
            return { success: false, error: updateErr.message };
        }

        return { success: true, data: updatedOrder };
    } catch (err: any) {
        console.error('Update dispatch action error:', err);
        return { success: false, error: err.message || 'Internal Server Error' };
    }
}

