-- Migration: 20261116_delivery_rules_manager.sql
-- Enables Admin management of Delivery Timelines, State policies, and Pincode detection

CREATE TABLE IF NOT EXISTS public.delivery_rules (
    id TEXT PRIMARY KEY,
    state_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    is_free_delivery BOOLEAN NOT NULL DEFAULT false,
    responsibility TEXT NOT NULL DEFAULT 'customer',
    estimated_days_min INTEGER NOT NULL DEFAULT 3,
    estimated_days_max INTEGER NOT NULL DEFAULT 7,
    timeline_text TEXT NOT NULL DEFAULT '3 to 7 Days',
    policy_badge_text TEXT NOT NULL DEFAULT 'Customer Responsibility',
    tagline TEXT,
    description TEXT,
    pincode_prefixes TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial default rules if empty
INSERT INTO public.delivery_rules (
    id, state_name, state_code, is_free_delivery, responsibility,
    estimated_days_min, estimated_days_max, timeline_text, policy_badge_text,
    tagline, description, pincode_prefixes, is_active, sort_order
) VALUES
(
    'andhra_pradesh', 'Andhra Pradesh', 'AP', true, 'karthik_traders',
    3, 7, '3 to 7 Days', 'FREE Delivery',
    'Free door & farm pond delivery in 3 to 7 days',
    'Karthik Traders provides 100% Free Door/Pond Delivery across all aquaculture districts in Andhra Pradesh.',
    ARRAY['51', '52', '53', '515', '516', '517', '518', '520', '521', '522', '523', '524', '530', '531', '532', '533', '534', '535'],
    true, 1
),
(
    'telangana', 'Telangana', 'TS', false, 'customer',
    3, 7, '3 to 7 Days', 'Customer Responsibility (3-7 Days)',
    'Delivery in 3 to 7 days (Customer arranged transport)',
    'Transport is customer responsibility. Goods dispatched via regional transport (To-Pay) or customer arranged vehicle.',
    ARRAY['50', '500', '501', '502', '503', '504', '505', '506', '507', '508', '509'],
    true, 2
),
(
    'tamil_nadu', 'Tamil Nadu', 'TN', false, 'customer',
    3, 7, '3 to 7 Days', 'Customer Responsibility (3-7 Days)',
    'Delivery in 3 to 7 days (Customer arranged transport)',
    'Transport is customer responsibility. Dispatched via interstate transport or customer arranged vehicle.',
    ARRAY['60', '61', '62', '63', '64', '600', '601', '602', '603', '604', '605', '606', '607', '608', '609', '610', '611', '612', '613', '614', '620', '621', '622', '624', '625', '626', '627', '628', '629', '630', '631', '632', '635', '636', '637', '638', '639', '641', '642', '643'],
    true, 3
),
(
    'west_bengal', 'West Bengal', 'WB', false, 'customer',
    10, 15, '10 to 15 Days', 'Customer Responsibility (10-15 Days)',
    'Delivery in 10 to 15 days (Customer arranged freight)',
    'Long-distance freight is customer responsibility. Loaded onto interstate logistics carriers or customer vehicle.',
    ARRAY['70', '71', '72', '73', '74', '700', '711', '712', '713', '721', '722', '723', '731', '732', '733', '734', '735', '736', '741', '742', '743'],
    true, 4
),
(
    'other_states', 'Other States', 'OTHER', false, 'customer',
    5, 10, '5 to 10 Days', 'Customer Arranged Transport',
    'Delivery in 5 to 10 days (Customer arranged transport)',
    'Transport is customer responsibility. Dispatched from Nellore via regional or national freight transport.',
    ARRAY[]::TEXT[],
    true, 5
)
ON CONFLICT (id) DO UPDATE SET
    state_name = EXCLUDED.state_name,
    timeline_text = EXCLUDED.timeline_text,
    policy_badge_text = EXCLUDED.policy_badge_text,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    pincode_prefixes = EXCLUDED.pincode_prefixes,
    updated_at = NOW();

-- Enable RLS
ALTER TABLE public.delivery_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active delivery rules" ON public.delivery_rules;
CREATE POLICY "Public can view active delivery rules" ON public.delivery_rules
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage delivery rules" ON public.delivery_rules;
CREATE POLICY "Admins can manage delivery rules" ON public.delivery_rules
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Delivery Settings Table for presets & notices
CREATE TABLE IF NOT EXISTS public.delivery_general_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    warehouse_city TEXT NOT NULL DEFAULT 'Nellore',
    warehouse_state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
    warehouse_phone TEXT NOT NULL DEFAULT '+91 86885 66023',
    vehicle_presets TEXT[] NOT NULL DEFAULT ARRAY[
        'Tata Ace (Chota Hathi)',
        'Ashok Leyland Dost',
        'Mahindra Bolero Maxi Truck / Pickup',
        '14ft Eicher Truck',
        '17ft Multi-Axle Truck',
        'Tractor Trailer',
        'Navata Road Transport (Lorry)',
        'VRL Logistics',
        'Kranti Transport',
        'Customer Own Vehicle / Self-Pickup',
        'Other Transport Carrier'
    ],
    free_shipping_notice TEXT NOT NULL DEFAULT '100% Free Door/Pond Delivery across Andhra Pradesh covered by Karthik Traders.',
    customer_arranged_notice TEXT NOT NULL DEFAULT 'Transport arranged by customer (To-Pay / customer vehicle).',
    free_delivery_for_aerators_only BOOLEAN NOT NULL DEFAULT true,
    eligible_aerator_slugs TEXT[] NOT NULL DEFAULT '{}',
    is_delivery_feature_enabled_in_production BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT delivery_general_settings_single_row CHECK (id = 1)
);

INSERT INTO public.delivery_general_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.delivery_general_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view delivery general settings" ON public.delivery_general_settings;
CREATE POLICY "Public can view delivery general settings" ON public.delivery_general_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage delivery general settings" ON public.delivery_general_settings;
CREATE POLICY "Admins can manage delivery general settings" ON public.delivery_general_settings
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
