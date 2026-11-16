import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';
import { resolveDeliveryRule } from '@/lib/delivery-config';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;
        if (!orderId) {
            return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
        }

        const authResult = await getAuthenticatedUser(request);
        if (!authResult || !authResult.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const {
            vehicle_number,
            vehicle_type,
            driver_name,
            driver_mobile,
            vehicle_photo_url,
            transport_name,
            lr_number,
            estimated_delivery_date,
            delivery_state,
            delivery_estimated_days,
            mark_shipped,
        } = body;

        const supabase = getSupabaseAdmin();

        // 1. Fetch current order
        const { data: currentOrder, error: fetchErr } = await supabase
            .from('orders')
            .select('id, status, shipping_address, delivery_state, dispatched_at')
            .eq('id', orderId)
            .single();

        if (fetchErr || !currentOrder) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        // Determine state & rule if not provided
        const stateToUse = delivery_state || currentOrder.delivery_state || (typeof currentOrder.shipping_address === 'object' ? currentOrder.shipping_address?.state : null) || 'Andhra Pradesh';
        const rule = resolveDeliveryRule(stateToUse);

        const updatePayload: Record<string, any> = {
            vehicle_number: vehicle_number ? String(vehicle_number).trim().toUpperCase() : null,
            vehicle_type: vehicle_type ? String(vehicle_type).trim() : null,
            driver_name: driver_name ? String(driver_name).trim() : null,
            driver_mobile: driver_mobile ? String(driver_mobile).trim().replace(/[^\d+]/g, '') : null,
            vehicle_photo_url: vehicle_photo_url ? String(vehicle_photo_url).trim() : null,
            transport_name: transport_name ? String(transport_name).trim() : null,
            lr_number: lr_number ? String(lr_number).trim() : null,
            estimated_delivery_date: estimated_delivery_date || null,
            delivery_state: rule.stateName,
            delivery_type: rule.responsibility === 'karthik_traders' ? 'free_ap' : 'customer_arranged',
            delivery_estimated_days: delivery_estimated_days || rule.timelineText,
            updated_at: new Date().toISOString(),
        };

        // If admin wants to mark as shipped or vehicle is being dispatched for the first time
        if (mark_shipped || (currentOrder.status === 'confirmed' && vehicle_number)) {
            updatePayload.status = 'shipped';
            if (!currentOrder.dispatched_at) {
                updatePayload.dispatched_at = new Date().toISOString();
            }
        }

        const { data: updatedOrder, error: updateErr } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)
            .select()
            .single();

        if (updateErr) {
            console.error('Error updating order dispatch details:', updateErr);
            return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (err: any) {
        console.error('API /admin/orders/[id]/dispatch error:', err);
        return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
