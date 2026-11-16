import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/loyalty';
import {
    DEFAULT_RULES,
    DEFAULT_GENERAL_SETTINGS,
    mapRawRuleToStateDeliveryRule,
    StateDeliveryRule,
    DeliveryGeneralSettings,
} from '@/lib/delivery-config';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Fetch delivery rules from database
        const { data: dbRules, error: rulesErr } = await supabase
            .from('delivery_rules')
            .select('*')
            .order('sort_order', { ascending: true });

        // 2. Fetch general delivery settings
        const { data: dbGeneral, error: generalErr } = await supabase
            .from('delivery_general_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        let rules: StateDeliveryRule[] = DEFAULT_RULES;
        if (!rulesErr && dbRules && dbRules.length > 0) {
            rules = dbRules.map(mapRawRuleToStateDeliveryRule);
        }

        let general: DeliveryGeneralSettings = DEFAULT_GENERAL_SETTINGS;
        if (!generalErr && dbGeneral) {
            general = {
                warehouseCity: dbGeneral.warehouse_city || DEFAULT_GENERAL_SETTINGS.warehouseCity,
                warehouseState: dbGeneral.warehouse_state || DEFAULT_GENERAL_SETTINGS.warehouseState,
                warehousePhone: dbGeneral.warehouse_phone || DEFAULT_GENERAL_SETTINGS.warehousePhone,
                vehiclePresets: dbGeneral.vehicle_presets || DEFAULT_GENERAL_SETTINGS.vehiclePresets,
                freeShippingNotice: dbGeneral.free_shipping_notice || DEFAULT_GENERAL_SETTINGS.freeShippingNotice,
                customerArrangedNotice: dbGeneral.customer_arranged_notice || DEFAULT_GENERAL_SETTINGS.customerArrangedNotice,
            };
        }

        return NextResponse.json(
            {
                success: true,
                rules,
                general,
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
                },
            }
        );
    } catch (err: any) {
        console.error('Error fetching delivery config:', err);
        return NextResponse.json({
            success: true,
            rules: DEFAULT_RULES,
            general: DEFAULT_GENERAL_SETTINGS,
            fromFallback: true,
        });
    }
}
