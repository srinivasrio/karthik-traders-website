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
