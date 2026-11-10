import { supabase } from '@/lib/supabase';

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating order status:', error);
            return { success: false, error: error.message };
        }

        // Trigger loyalty points & referral workflows based on lifecycle status
        const normalizedStatus = (status || '').toLowerCase();
        try {
            if (normalizedStatus === 'delivered' || normalizedStatus === 'completed') {
                // Award purchase reward points and confirm point redemption
                await supabase.rpc('loyalty_award_purchase_points', { p_order_id: orderId });
                await supabase.rpc('loyalty_confirm_redemption', { p_order_id: orderId });
                // Award referral bonus points to the referring farmer
                await supabase.rpc('loyalty_award_referral_points', { p_order_id: orderId });
            } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
                // Release reserved loyalty points back to customer
                await supabase.rpc('loyalty_release_points', {
                    p_order_id: orderId,
                    p_reason: `Order status updated to ${status}`
                });
                // Cancel referral reward
                await supabase
                    .from('orders')
                    .update({ referral_reward_status: 'cancelled' })
                    .eq('id', orderId);
                await supabase
                    .from('referrals')
                    .update({ status: 'cancelled' })
                    .eq('order_id', orderId);
            } else if (normalizedStatus === 'refunded') {
                // Process refund & restore redeemed points / revoke purchase reward
                await supabase.rpc('loyalty_process_refund_points', {
                    p_order_id: orderId,
                    p_refund_percentage: 100
                });
            }
        } catch (loyaltyErr) {
            console.warn('Loyalty lifecycle trigger warning (ignored if migration pending):', loyaltyErr);
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception updating order status:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({ payment_status: paymentStatus })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment status:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception updating payment status:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
