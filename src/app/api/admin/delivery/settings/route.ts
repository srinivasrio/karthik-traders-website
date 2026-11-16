import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/loyalty';
import {
    DEFAULT_RULES,
    DEFAULT_GENERAL_SETTINGS,
    mapRawRuleToStateDeliveryRule,
    StateDeliveryRule,
    DeliveryGeneralSettings,
} from '@/lib/delivery-config';

function getLocalSettingsPath() {
    return path.join(process.cwd(), 'src/data/delivery-settings.json');
}

function syncLocalSettingsFile(rules: StateDeliveryRule[], general: DeliveryGeneralSettings) {
    try {
        const filePath = getLocalSettingsPath();
        const payload = {
            general: {
                warehouse_city: general.warehouseCity,
                warehouse_state: general.warehouseState,
                warehouse_phone: general.warehousePhone,
                vehicle_presets: general.vehiclePresets,
                free_shipping_notice: general.freeShippingNotice,
                customer_arranged_notice: general.customerArrangedNotice,
            },
            rules: rules.map((r) => ({
                id: r.id,
                state_name: r.stateName,
                state_code: r.stateCode,
                is_free_delivery: r.isFreeDelivery,
                responsibility: r.responsibility,
                estimated_days_min: r.estimatedDaysMin,
                estimated_days_max: r.estimatedDaysMax,
                timeline_text: r.timelineText,
                policy_badge_text: r.policyBadgeText,
                tagline: r.tagline,
                description: r.description,
                is_active: r.isActive,
                sort_order: r.sortOrder,
            })),
        };
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e) {
        console.warn('Failed to sync local delivery settings file:', e);
    }
}

export async function GET(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth || !auth.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const supabase = getSupabaseAdmin();

        const { data: dbRules, error: rulesErr } = await supabase
            .from('delivery_rules')
            .select('*')
            .order('sort_order', { ascending: true });

        const { data: dbGeneral, error: genErr } = await supabase
            .from('delivery_general_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        let rules: StateDeliveryRule[] = DEFAULT_RULES;
        if (!rulesErr && dbRules && dbRules.length > 0) {
            rules = dbRules.map(mapRawRuleToStateDeliveryRule);
        }

        let general: DeliveryGeneralSettings = DEFAULT_GENERAL_SETTINGS;
        if (!genErr && dbGeneral) {
            general = {
                warehouseCity: dbGeneral.warehouse_city || DEFAULT_GENERAL_SETTINGS.warehouseCity,
                warehouseState: dbGeneral.warehouse_state || DEFAULT_GENERAL_SETTINGS.warehouseState,
                warehousePhone: dbGeneral.warehouse_phone || DEFAULT_GENERAL_SETTINGS.warehousePhone,
                vehiclePresets: dbGeneral.vehicle_presets || DEFAULT_GENERAL_SETTINGS.vehiclePresets,
                freeShippingNotice: dbGeneral.free_shipping_notice || DEFAULT_GENERAL_SETTINGS.freeShippingNotice,
                customerArrangedNotice: dbGeneral.customer_arranged_notice || DEFAULT_GENERAL_SETTINGS.customerArrangedNotice,
            };
        }

        return NextResponse.json({
            success: true,
            rules,
            general,
            stats: {
                totalRules: rules.length,
                freeCount: rules.filter((r) => r.isFreeDelivery).length,
                customerArrangedCount: rules.filter((r) => !r.isFreeDelivery).length,
                activeCount: rules.filter((r) => r.isActive).length,
            },
        });
    } catch (err: any) {
        console.error('Error fetching admin delivery settings:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth || !auth.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { rules, general } = body;

        const supabase = getSupabaseAdmin();

        // 1. Update general settings if provided
        if (general) {
            const generalUpdate = {
                warehouse_city: general.warehouseCity || 'Nellore',
                warehouse_state: general.warehouseState || 'Andhra Pradesh',
                warehouse_phone: general.warehousePhone || '+91 86885 66023',
                vehicle_presets: general.vehiclePresets || DEFAULT_GENERAL_SETTINGS.vehiclePresets,
                free_shipping_notice: general.freeShippingNotice || DEFAULT_GENERAL_SETTINGS.freeShippingNotice,
                customer_arranged_notice: general.customerArrangedNotice || DEFAULT_GENERAL_SETTINGS.customerArrangedNotice,
                updated_at: new Date().toISOString(),
            };

            await supabase
                .from('delivery_general_settings')
                .upsert({ id: 1, ...generalUpdate }, { onConflict: 'id' });
        }

        // 2. Update / upsert state rules if provided
        let processedRules: StateDeliveryRule[] = [];
        if (Array.isArray(rules)) {
            for (let i = 0; i < rules.length; i++) {
                const r = rules[i];
                const ruleId = r.id || (r.stateName ? r.stateName.toLowerCase().replace(/[^a-z0-9]/g, '_') : `rule_${i}`);
                const isFree = Boolean(r.isFreeDelivery);
                const resp = r.responsibility || (isFree ? 'karthik_traders' : 'customer');
                const minDays = Number(r.estimatedDaysMin || 3);
                const maxDays = Number(r.estimatedDaysMax || 7);
                const timeline = r.timelineText || `${minDays} to ${maxDays} Days`;

                const dbPayload = {
                    id: ruleId,
                    state_name: r.stateName || 'State',
                    state_code: r.stateCode || 'IN',
                    is_free_delivery: isFree,
                    responsibility: resp,
                    estimated_days_min: minDays,
                    estimated_days_max: maxDays,
                    timeline_text: timeline,
                    policy_badge_text: r.policyBadgeText || (isFree ? 'FREE Delivery' : `Customer Responsibility (${timeline})`),
                    tagline: r.tagline || (isFree ? `Free door & farm pond delivery in ${timeline}` : `Delivery in ${timeline} (Customer arranged transport)`),
                    description: r.description || '',
                    is_active: r.isActive !== false,
                    sort_order: r.sortOrder ?? i + 1,
                    updated_at: new Date().toISOString(),
                };

                const { error: upsertErr } = await supabase
                    .from('delivery_rules')
                    .upsert(dbPayload, { onConflict: 'id' });

                if (upsertErr) {
                    console.error('Error saving delivery rule:', upsertErr);
                } else {
                    processedRules.push(mapRawRuleToStateDeliveryRule(dbPayload));
                }
            }

            // Sync to local JSON file for zero-latency fallbacks
            syncLocalSettingsFile(processedRules, general || DEFAULT_GENERAL_SETTINGS);
        }

        return NextResponse.json({
            success: true,
            message: 'State delivery timelines and shipping fee policies saved successfully!',
            rules: processedRules,
        });
    } catch (err: any) {
        console.error('Error saving admin delivery settings:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const auth = await getAuthenticatedUser(request);
        if (!auth || !auth.isAdmin) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const ruleId = searchParams.get('id');
        if (!ruleId) {
            return NextResponse.json({ success: false, error: 'Rule ID is required' }, { status: 400 });
        }

        // Prevent deleting core states
        const CORE_IDS = ['andhra_pradesh', 'telangana', 'tamil_nadu', 'west_bengal', 'other_states'];
        if (CORE_IDS.includes(ruleId)) {
            return NextResponse.json({
                success: false,
                error: 'Cannot delete core state rule. You can edit its timeline, fee policy, or toggle it inactive.',
            }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from('delivery_rules').delete().eq('id', ruleId);
        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Custom state delivery rule deleted successfully' });
    } catch (err: any) {
        console.error('Error deleting delivery rule:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
