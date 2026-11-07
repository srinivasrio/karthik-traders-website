-- ============================================================================
-- Migration: 20261106_loyalty_system.sql
-- Description: Complete Loyalty Points & Rewards System for Karthik Traders
-- Architecture: Supabase PostgreSQL (Standard / Self-Hosted) with RLS & PL/pgSQL
-- ============================================================================

-- 1. LOYALTY SETTINGS TABLE (Singleton Configuration)
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    signup_bonus_points INT NOT NULL DEFAULT 50 CHECK (signup_bonus_points >= 0),
    earning_percentage NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (earning_percentage >= 0 AND earning_percentage <= 100), -- e.g. 1.0% reward on order subtotal
    rupees_spent_per_point INT NOT NULL DEFAULT 100 CHECK (rupees_spent_per_point > 0), -- e.g. ₹100 spent = 1 point earned
    paise_per_point INT NOT NULL DEFAULT 25 CHECK (paise_per_point > 0), -- e.g. 1 point = 25 paise (₹0.25)
    min_cart_subtotal_paise INT NOT NULL DEFAULT 500000 CHECK (min_cart_subtotal_paise >= 0), -- e.g. ₹5,000 in paise
    min_points_to_redeem INT NOT NULL DEFAULT 50 CHECK (min_points_to_redeem >= 0), -- Minimum points needed to redeem
    max_redemption_percentage INT NOT NULL DEFAULT 20 CHECK (max_redemption_percentage >= 1 AND max_redemption_percentage <= 100), -- Max 20% of eligible subtotal
    max_points_per_order INT NOT NULL DEFAULT 2000 CHECK (max_points_per_order >= 0), -- 0 = unlimited, otherwise cap
    expiry_days INT NOT NULL DEFAULT 365 CHECK (expiry_days > 0), -- Points expire after 365 days
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Seed default settings
INSERT INTO public.loyalty_settings (
    id, is_enabled, signup_bonus_points, earning_percentage, rupees_spent_per_point,
    paise_per_point, min_cart_subtotal_paise, min_points_to_redeem,
    max_redemption_percentage, max_points_per_order, expiry_days
) VALUES (
    1, true, 50, 1.0, 100, 25, 500000, 50, 20, 2000, 365
) ON CONFLICT (id) DO NOTHING;

-- 2. LOYALTY WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_earned_points INT NOT NULL DEFAULT 0 CHECK (lifetime_earned_points >= 0),
    lifetime_redeemed_points INT NOT NULL DEFAULT 0 CHECK (lifetime_redeemed_points >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_wallets_user ON public.loyalty_wallets(user_id);

-- 3. LOYALTY TRANSACTIONS TABLE (IMMUTABLE LEDGER)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.loyalty_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'signup_bonus',
        'purchase_earned',
        'promotional_bonus',
        'checkout_redemption',
        'redemption_refund',
        'points_expired',
        'admin_credit',
        'admin_debit',
        'order_cancelled_restore'
    )),
    points INT NOT NULL CHECK (points != 0), -- Positive = credit, Negative = debit
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    rupee_value_paise INT NOT NULL DEFAULT 0, -- Monetary value at time of transaction
    conversion_rate_paise INT NOT NULL DEFAULT 0, -- Conversion rate (paise/point) when recorded
    reference_id TEXT, -- e.g. order_id, promotion_id, admin_audit_id
    description TEXT NOT NULL,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_wallet ON public.loyalty_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_ref ON public.loyalty_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_created ON public.loyalty_transactions(created_at DESC);

-- Prevent update or delete on loyalty transactions (strictly immutable)
CREATE OR REPLACE FUNCTION public.trg_prevent_loyalty_tx_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Loyalty transactions ledger is immutable. Updates and deletes are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loyalty_tx_immutable ON public.loyalty_transactions;
CREATE TRIGGER trg_loyalty_tx_immutable
    BEFORE UPDATE OR DELETE ON public.loyalty_transactions
    FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_loyalty_tx_modification();

-- 4. LOYALTY POINT LOTS (FIFO Point Expiration Tracking)
CREATE TABLE IF NOT EXISTS public.loyalty_point_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.loyalty_wallets(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.loyalty_transactions(id) ON DELETE CASCADE,
    points_initial INT NOT NULL CHECK (points_initial > 0),
    points_remaining INT NOT NULL CHECK (points_remaining >= 0 AND points_remaining <= points_initial),
    expires_at TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_lots_wallet_fifo ON public.loyalty_point_lots(wallet_id, is_expired, expires_at ASC);
CREATE INDEX IF NOT EXISTS idx_loyalty_lots_expiry ON public.loyalty_point_lots(is_expired, expires_at);

-- 5. LOYALTY PROMOTIONS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    promotion_type TEXT NOT NULL CHECK (promotion_type IN ('multiplier', 'fixed_bonus')),
    bonus_value NUMERIC(10,2) NOT NULL CHECK (bonus_value > 0),
    min_cart_subtotal_paise INT NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LOYALTY REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    wallet_id UUID NOT NULL REFERENCES public.loyalty_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_redeemed INT NOT NULL CHECK (points_redeemed > 0),
    discount_paise INT NOT NULL CHECK (discount_paise > 0),
    conversion_rate_paise INT NOT NULL CHECK (conversion_rate_paise > 0),
    status TEXT NOT NULL CHECK (status IN ('reserved', 'applied', 'released', 'refunded')),
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_order ON public.loyalty_redemptions(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_wallet ON public.loyalty_redemptions(wallet_id);

-- 7. LOYALTY ADMIN AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.loyalty_admin_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES public.profiles(id),
    action_type TEXT NOT NULL CHECK (action_type IN (
        'settings_update',
        'manual_adjustment',
        'promotion_create',
        'promotion_update',
        'promotion_delete',
        'manual_expiry_run'
    )),
    target_wallet_id UUID REFERENCES public.loyalty_wallets(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    points_changed INT,
    reason TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_audit_admin ON public.loyalty_admin_audit(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_audit_created ON public.loyalty_admin_audit(created_at DESC);

-- 8. ORDERS TABLE ENHANCEMENTS
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_discount_amount NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS loyalty_points_earned INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_status TEXT DEFAULT 'none';

-- Add check constraint safely
DO $$
BEGIN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_loyalty_status_check;
    ALTER TABLE public.orders ADD CONSTRAINT orders_loyalty_status_check
        CHECK (loyalty_status IN ('none', 'reserved', 'applied', 'rewarded', 'refunded', 'cancelled'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_point_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_admin_audit ENABLE ROW LEVEL SECURITY;

-- loyalty_settings policies
DROP POLICY IF EXISTS "Public can view loyalty settings" ON public.loyalty_settings;
CREATE POLICY "Public can view loyalty settings" ON public.loyalty_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update loyalty settings" ON public.loyalty_settings;
CREATE POLICY "Admins can update loyalty settings" ON public.loyalty_settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- loyalty_wallets policies
DROP POLICY IF EXISTS "Users can view own loyalty wallet" ON public.loyalty_wallets;
CREATE POLICY "Users can view own loyalty wallet" ON public.loyalty_wallets
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- loyalty_transactions policies
DROP POLICY IF EXISTS "Users can view own loyalty transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view own loyalty transactions" ON public.loyalty_transactions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- loyalty_point_lots policies
DROP POLICY IF EXISTS "Users can view own loyalty point lots" ON public.loyalty_point_lots;
CREATE POLICY "Users can view own loyalty point lots" ON public.loyalty_point_lots
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.loyalty_wallets w WHERE w.id = loyalty_point_lots.wallet_id AND w.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- loyalty_promotions policies
DROP POLICY IF EXISTS "Public can view active loyalty promotions" ON public.loyalty_promotions;
CREATE POLICY "Public can view active loyalty promotions" ON public.loyalty_promotions
    FOR SELECT USING (
        is_active = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage loyalty promotions" ON public.loyalty_promotions;
CREATE POLICY "Admins can manage loyalty promotions" ON public.loyalty_promotions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- loyalty_redemptions policies
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.loyalty_redemptions;
CREATE POLICY "Users can view own redemptions" ON public.loyalty_redemptions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- loyalty_admin_audit policies
DROP POLICY IF EXISTS "Admins can view loyalty audit log" ON public.loyalty_admin_audit;
CREATE POLICY "Admins can view loyalty audit log" ON public.loyalty_admin_audit
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================================================
-- SECURE PL/PGSQL FUNCTIONS & RPCs
-- ============================================================================

-- Function 1: Initialize Wallet & Award Signup Bonus
CREATE OR REPLACE FUNCTION public.loyalty_init_wallet(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_bonus_awarded BOOLEAN := false;
    v_bonus_points INT := 0;
    v_tx_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be null';
    END IF;

    -- Fetch current settings
    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;
    IF NOT FOUND THEN
        INSERT INTO loyalty_settings (id) VALUES (1) RETURNING * INTO v_settings;
    END IF;

    -- Ensure wallet exists
    INSERT INTO loyalty_wallets (user_id, points_balance, lifetime_earned_points, lifetime_redeemed_points)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_wallet FROM loyalty_wallets WHERE user_id = p_user_id FOR UPDATE;

    -- Check if signup bonus should be awarded
    IF v_settings.is_enabled AND v_settings.signup_bonus_points > 0 THEN
        IF NOT EXISTS (
            SELECT 1 FROM loyalty_transactions
            WHERE user_id = p_user_id AND transaction_type = 'signup_bonus'
        ) THEN
            v_bonus_points := v_settings.signup_bonus_points;
            v_expires_at := NOW() + (v_settings.expiry_days || ' days')::INTERVAL;

            -- Update wallet balance
            UPDATE loyalty_wallets
            SET points_balance = points_balance + v_bonus_points,
                lifetime_earned_points = lifetime_earned_points + v_bonus_points,
                updated_at = NOW()
            WHERE id = v_wallet.id
            RETURNING * INTO v_wallet;

            -- Record immutable transaction
            INSERT INTO loyalty_transactions (
                wallet_id, user_id, transaction_type, points,
                balance_after, rupee_value_paise, conversion_rate_paise,
                reference_id, description, idempotency_key
            ) VALUES (
                v_wallet.id, p_user_id, 'signup_bonus', v_bonus_points,
                v_wallet.points_balance, (v_bonus_points * v_settings.paise_per_point), v_settings.paise_per_point,
                p_user_id::text, 'Welcome bonus points on signup', 'signup_bonus_' || p_user_id::text
            ) RETURNING id INTO v_tx_id;

            -- Insert FIFO point lot
            INSERT INTO loyalty_point_lots (
                wallet_id, transaction_id, points_initial, points_remaining, expires_at
            ) VALUES (
                v_wallet.id, v_tx_id, v_bonus_points, v_bonus_points, v_expires_at
            );

            v_bonus_awarded := true;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'wallet_id', v_wallet.id,
        'user_id', v_wallet.user_id,
        'points_balance', v_wallet.points_balance,
        'lifetime_earned_points', v_wallet.lifetime_earned_points,
        'lifetime_redeemed_points', v_wallet.lifetime_redeemed_points,
        'is_active', v_wallet.is_active,
        'signup_bonus_awarded', v_bonus_awarded,
        'signup_bonus_points', v_bonus_points
    );
END;
$$;

-- Trigger to auto-initialize wallet when a profile is created
CREATE OR REPLACE FUNCTION public.trg_loyalty_on_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.loyalty_init_wallet(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_loyalty ON public.profiles;
CREATE TRIGGER on_profile_created_loyalty
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trg_loyalty_on_profile_created();

-- Function 2: Get Customer Wallet Summary
CREATE OR REPLACE FUNCTION public.loyalty_get_wallet_summary(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_expiring_soon_points INT := 0;
    v_next_expiry_date TIMESTAMPTZ := NULL;
    v_transactions JSONB;
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id cannot be null';
    END IF;

    -- Ensure wallet initialized
    PERFORM public.loyalty_init_wallet(p_user_id);

    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;
    SELECT * INTO v_wallet FROM loyalty_wallets WHERE user_id = p_user_id;

    -- Expiring points within 30 days
    SELECT COALESCE(SUM(points_remaining), 0), MIN(expires_at)
    INTO v_expiring_soon_points, v_next_expiry_date
    FROM loyalty_point_lots
    WHERE wallet_id = v_wallet.id
      AND is_expired = false
      AND points_remaining > 0
      AND expires_at <= NOW() + INTERVAL '30 days';

    -- Next nearest expiry across all lots
    IF v_next_expiry_date IS NULL THEN
        SELECT MIN(expires_at) INTO v_next_expiry_date
        FROM loyalty_point_lots
        WHERE wallet_id = v_wallet.id
          AND is_expired = false
          AND points_remaining > 0;
    END IF;

    -- Recent transactions
    SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY t.created_at DESC), '[]'::jsonb)
    INTO v_transactions
    FROM (
        SELECT id, transaction_type, points, balance_after, rupee_value_paise,
               conversion_rate_paise, reference_id, description, created_at
        FROM loyalty_transactions
        WHERE wallet_id = v_wallet.id
        ORDER BY created_at DESC
        LIMIT 20
    ) t;

    RETURN jsonb_build_object(
        'wallet_id', v_wallet.id,
        'user_id', v_wallet.user_id,
        'points_balance', v_wallet.points_balance,
        'rupee_value', ROUND((v_wallet.points_balance * v_settings.paise_per_point)::numeric / 100.0, 2),
        'lifetime_earned_points', v_wallet.lifetime_earned_points,
        'lifetime_redeemed_points', v_wallet.lifetime_redeemed_points,
        'is_active', v_wallet.is_active,
        'expiring_soon_points', v_expiring_soon_points,
        'next_expiry_date', v_next_expiry_date,
        'settings', jsonb_build_object(
            'is_enabled', v_settings.is_enabled,
            'earning_percentage', COALESCE(v_settings.earning_percentage, 1.0),
            'paise_per_point', v_settings.paise_per_point,
            'rupees_spent_per_point', v_settings.rupees_spent_per_point,
            'min_cart_subtotal_paise', v_settings.min_cart_subtotal_paise,
            'min_cart_subtotal_rupees', ROUND(v_settings.min_cart_subtotal_paise::numeric / 100.0, 2),
            'min_points_to_redeem', v_settings.min_points_to_redeem,
            'max_redemption_percentage', v_settings.max_redemption_percentage,
            'max_points_per_order', v_settings.max_points_per_order
        ),
        'recent_transactions', v_transactions
    );
END;
$$;

-- Function 3: Preview Redemption Eligibility & Calculate Max Points
CREATE OR REPLACE FUNCTION public.loyalty_preview_redemption(
    p_user_id UUID,
    p_eligible_subtotal_paise INT,
    p_points_requested INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_max_discount_paise INT;
    v_max_points_by_subtotal INT;
    v_max_points_by_order INT;
    v_max_redeemable_points INT;
    v_points_to_redeem INT;
    v_discount_paise INT;
    v_shortfall_paise INT;
BEGIN
    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;
    IF NOT v_settings.is_enabled THEN
        RETURN jsonb_build_object(
            'is_eligible', false,
            'reason_code', 'PROGRAM_DISABLED',
            'message', 'Loyalty rewards program is currently inactive.'
        );
    END IF;

    SELECT * INTO v_wallet FROM loyalty_wallets WHERE user_id = p_user_id;
    IF NOT FOUND OR NOT v_wallet.is_active THEN
        RETURN jsonb_build_object(
            'is_eligible', false,
            'reason_code', 'WALLET_INACTIVE',
            'message', 'Loyalty wallet not found or inactive.'
        );
    END IF;

    -- Validate minimum subtotal
    IF p_eligible_subtotal_paise < v_settings.min_cart_subtotal_paise THEN
        v_shortfall_paise := v_settings.min_cart_subtotal_paise - p_eligible_subtotal_paise;
        RETURN jsonb_build_object(
            'is_eligible', false,
            'reason_code', 'MIN_SUBTOTAL_NOT_MET',
            'min_subtotal_rupees', ROUND(v_settings.min_cart_subtotal_paise::numeric / 100.0, 2),
            'shortfall_rupees', CEIL(v_shortfall_paise::numeric / 100.0),
            'current_subtotal_rupees', ROUND(p_eligible_subtotal_paise::numeric / 100.0, 2),
            'message', 'Add ₹' || CEIL(v_shortfall_paise::numeric / 100.0) || ' more of eligible products to redeem loyalty points.'
        );
    END IF;

    -- Validate minimum points balance
    IF v_wallet.points_balance < v_settings.min_points_to_redeem THEN
        RETURN jsonb_build_object(
            'is_eligible', false,
            'reason_code', 'MIN_POINTS_NOT_MET',
            'min_points_required', v_settings.min_points_to_redeem,
            'available_points', v_wallet.points_balance,
            'message', 'A minimum of ' || v_settings.min_points_to_redeem || ' points is required to redeem. You have ' || v_wallet.points_balance || ' points.'
        );
    END IF;

    -- Calculate maximum points by subtotal percentage
    v_max_discount_paise := FLOOR(p_eligible_subtotal_paise * (v_settings.max_redemption_percentage / 100.0));
    v_max_points_by_subtotal := FLOOR(v_max_discount_paise / v_settings.paise_per_point);

    -- Calculate maximum points by order limit
    v_max_points_by_order := CASE
        WHEN v_settings.max_points_per_order > 0 THEN v_settings.max_points_per_order
        ELSE 99999999
    END;

    -- Effective maximum redeemable points
    v_max_redeemable_points := GREATEST(0, LEAST(
        v_wallet.points_balance,
        v_max_points_by_subtotal,
        v_max_points_by_order
    ));

    IF v_max_redeemable_points < v_settings.min_points_to_redeem THEN
        RETURN jsonb_build_object(
            'is_eligible', false,
            'reason_code', 'MAX_BELOW_MIN_THRESHOLD',
            'max_redeemable_points', v_max_redeemable_points,
            'min_points_required', v_settings.min_points_to_redeem,
            'message', 'Order subtotal limit allows up to ' || v_max_redeemable_points || ' points, which is below the minimum threshold of ' || v_settings.min_points_to_redeem || ' points.'
        );
    END IF;

    -- Determine requested points
    IF p_points_requested IS NOT NULL AND p_points_requested > 0 THEN
        v_points_to_redeem := LEAST(p_points_requested, v_max_redeemable_points);
    ELSE
        v_points_to_redeem := v_max_redeemable_points;
    END IF;

    v_discount_paise := v_points_to_redeem * v_settings.paise_per_point;

    RETURN jsonb_build_object(
        'is_eligible', true,
        'available_points', v_wallet.points_balance,
        'max_redeemable_points', v_max_redeemable_points,
        'points_to_redeem', v_points_to_redeem,
        'discount_paise', v_discount_paise,
        'discount_rupees', ROUND(v_discount_paise::numeric / 100.0, 2),
        'paise_per_point', v_settings.paise_per_point,
        'max_percentage', v_settings.max_redemption_percentage
    );
END;
$$;

-- Function 4: Reserve Points for Checkout (Atomic FIFO Point Deduction)
CREATE OR REPLACE FUNCTION public.loyalty_reserve_points(
    p_user_id UUID,
    p_order_id UUID,
    p_points_to_redeem INT,
    p_eligible_subtotal_paise INT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_preview JSONB;
    v_lot loyalty_point_lots%ROWTYPE;
    v_remaining_to_deduct INT;
    v_deduct_from_lot INT;
    v_discount_paise INT;
    v_tx_id UUID;
    v_existing_redemption loyalty_redemptions%ROWTYPE;
BEGIN
    IF p_user_id IS NULL OR p_points_to_redeem <= 0 OR p_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'Invalid parameters for point reservation';
    END IF;

    -- Idempotency check: Return existing redemption if already processed with this key
    SELECT * INTO v_existing_redemption
    FROM loyalty_redemptions
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_duplicate', true,
            'redemption_id', v_existing_redemption.id,
            'points_redeemed', v_existing_redemption.points_redeemed,
            'discount_paise', v_existing_redemption.discount_paise,
            'discount_rupees', ROUND(v_existing_redemption.discount_paise::numeric / 100.0, 2),
            'status', v_existing_redemption.status
        );
    END IF;

    -- Validate redemption via preview logic
    v_preview := public.loyalty_preview_redemption(p_user_id, p_eligible_subtotal_paise, p_points_to_redeem);
    IF NOT (v_preview->>'is_eligible')::boolean THEN
        RAISE EXCEPTION '%', (v_preview->>'message');
    END IF;

    IF p_points_to_redeem > (v_preview->>'max_redeemable_points')::INT THEN
        RAISE EXCEPTION 'Requested points % exceeds maximum redeemable limit of %',
            p_points_to_redeem, (v_preview->>'max_redeemable_points')::INT;
    END IF;

    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;

    -- Row lock wallet for update
    SELECT * INTO v_wallet
    FROM loyalty_wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet.points_balance < p_points_to_redeem THEN
        RAISE EXCEPTION 'Insufficient points balance. Available: %, Requested: %',
            v_wallet.points_balance, p_points_to_redeem;
    END IF;

    v_discount_paise := p_points_to_redeem * v_settings.paise_per_point;

    -- Update wallet balance atomically
    UPDATE loyalty_wallets
    SET points_balance = points_balance - p_points_to_redeem,
        lifetime_redeemed_points = lifetime_redeemed_points + p_points_to_redeem,
        updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    -- Record transaction
    INSERT INTO loyalty_transactions (
        wallet_id, user_id, transaction_type, points,
        balance_after, rupee_value_paise, conversion_rate_paise,
        reference_id, description, idempotency_key
    ) VALUES (
        v_wallet.id, p_user_id, 'checkout_redemption', -p_points_to_redeem,
        v_wallet.points_balance, v_discount_paise, v_settings.paise_per_point,
        p_order_id::text, 'Redeemed points at checkout for order discount', p_idempotency_key
    ) RETURNING id INTO v_tx_id;

    -- FIFO Deduction from point lots (oldest non-expired first)
    v_remaining_to_deduct := p_points_to_redeem;

    FOR v_lot IN
        SELECT * FROM loyalty_point_lots
        WHERE wallet_id = v_wallet.id
          AND is_expired = false
          AND points_remaining > 0
        ORDER BY expires_at ASC, created_at ASC
        FOR UPDATE
    LOOP
        IF v_remaining_to_deduct <= 0 THEN
            EXIT;
        END IF;

        IF v_lot.points_remaining <= v_remaining_to_deduct THEN
            v_deduct_from_lot := v_lot.points_remaining;
            v_remaining_to_deduct := v_remaining_to_deduct - v_deduct_from_lot;

            UPDATE loyalty_point_lots
            SET points_remaining = 0,
                is_expired = true,
                updated_at = NOW()
            WHERE id = v_lot.id;
        ELSE
            v_deduct_from_lot := v_remaining_to_deduct;
            v_remaining_to_deduct := 0;

            UPDATE loyalty_point_lots
            SET points_remaining = points_remaining - v_deduct_from_lot,
                updated_at = NOW()
            WHERE id = v_lot.id;
        END IF;
    END LOOP;

    -- Insert redemption record
    INSERT INTO loyalty_redemptions (
        order_id, wallet_id, user_id, points_redeemed,
        discount_paise, conversion_rate_paise, status, idempotency_key
    ) VALUES (
        p_order_id, v_wallet.id, p_user_id, p_points_to_redeem,
        v_discount_paise, v_settings.paise_per_point, 'reserved', p_idempotency_key
    ) RETURNING * INTO v_existing_redemption;

    -- Update order if it exists
    IF p_order_id IS NOT NULL THEN
        UPDATE public.orders
        SET loyalty_points_redeemed = p_points_to_redeem,
            loyalty_discount_amount = ROUND(v_discount_paise::numeric / 100.0, 2),
            loyalty_status = 'reserved'
        WHERE id = p_order_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'redemption_id', v_existing_redemption.id,
        'points_redeemed', p_points_to_redeem,
        'discount_paise', v_discount_paise,
        'discount_rupees', ROUND(v_discount_paise::numeric / 100.0, 2),
        'remaining_balance', v_wallet.points_balance,
        'status', 'reserved'
    );
END;
$$;

-- Function 5: Confirm Redemption (Transitions Reserved Points to Applied)
CREATE OR REPLACE FUNCTION public.loyalty_confirm_redemption(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE loyalty_redemptions
    SET status = 'applied',
        updated_at = NOW()
    WHERE order_id = p_order_id AND status = 'reserved';

    UPDATE public.orders
    SET loyalty_status = 'applied'
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'applied');
END;
$$;

-- Function 6: Release Reserved Points (Order Cancelled / Checkout Failure)
CREATE OR REPLACE FUNCTION public.loyalty_release_points(p_order_id UUID, p_reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_redemption loyalty_redemptions%ROWTYPE;
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_tx_id UUID;
BEGIN
    SELECT * INTO v_redemption
    FROM loyalty_redemptions
    WHERE order_id = p_order_id AND status IN ('reserved', 'applied')
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No active redemption found for order');
    END IF;

    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;

    SELECT * INTO v_wallet
    FROM loyalty_wallets
    WHERE id = v_redemption.wallet_id
    FOR UPDATE;

    -- Restore wallet balance
    UPDATE loyalty_wallets
    SET points_balance = points_balance + v_redemption.points_redeemed,
        lifetime_redeemed_points = GREATEST(0, lifetime_redeemed_points - v_redemption.points_redeemed),
        updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    -- Record restoration transaction
    INSERT INTO loyalty_transactions (
        wallet_id, user_id, transaction_type, points,
        balance_after, rupee_value_paise, conversion_rate_paise,
        reference_id, description, idempotency_key
    ) VALUES (
        v_wallet.id, v_redemption.user_id, 'order_cancelled_restore', v_redemption.points_redeemed,
        v_wallet.points_balance, v_redemption.discount_paise, v_redemption.conversion_rate_paise,
        p_order_id::text, 'Points restored: ' || COALESCE(p_reason, 'Order cancelled/rejected'),
        'release_' || p_order_id::text || '_' || v_redemption.id::text
    ) RETURNING id INTO v_tx_id;

    -- Restore point lot with fresh default expiry
    INSERT INTO loyalty_point_lots (
        wallet_id, transaction_id, points_initial, points_remaining, expires_at
    ) VALUES (
        v_wallet.id, v_tx_id, v_redemption.points_redeemed, v_redemption.points_redeemed,
        NOW() + (v_settings.expiry_days || ' days')::INTERVAL
    );

    -- Update redemption status
    UPDATE loyalty_redemptions
    SET status = 'released',
        updated_at = NOW()
    WHERE id = v_redemption.id;

    -- Update order status
    UPDATE public.orders
    SET loyalty_status = 'cancelled'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_restored', v_redemption.points_redeemed,
        'wallet_balance', v_wallet.points_balance
    );
END;
$$;

-- Function 7: Award Purchase & Promotional Points (When Order Delivered/Completed)
CREATE OR REPLACE FUNCTION public.loyalty_award_purchase_points(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_user_id UUID;
    v_settings loyalty_settings%ROWTYPE;
    v_wallet loyalty_wallets%ROWTYPE;
    v_eligible_subtotal NUMERIC := 0;
    v_base_points INT := 0;
    v_bonus_points INT := 0;
    v_total_points INT := 0;
    v_promo RECORD;
    v_tx_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Idempotency check: Have purchase points already been awarded for this order?
    IF EXISTS (
        SELECT 1 FROM loyalty_transactions
        WHERE reference_id = p_order_id::text AND transaction_type = 'purchase_earned'
    ) THEN
        RETURN jsonb_build_object('success', true, 'already_awarded', true);
    END IF;

    -- Fetch order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Determine user_id
    v_user_id := v_order.user_id;
    IF v_user_id IS NULL AND v_order.customer_mobile IS NOT NULL THEN
        SELECT id INTO v_user_id FROM public.profiles
        WHERE mobile = v_order.customer_mobile OR mobile = '+91' || v_order.customer_mobile
        LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        -- Cannot award points without a registered user
        RETURN jsonb_build_object('success', false, 'reason', 'User not registered');
    END IF;

    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;
    IF NOT v_settings.is_enabled THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Program disabled');
    END IF;

    -- Calculate eligible product subtotal from fulfilled order items (excluding freight/delivery)
    SELECT COALESCE(SUM(
        price_at_purchase * COALESCE(fulfilled_quantity, quantity)
    ), 0)
    INTO v_eligible_subtotal
    FROM public.order_items
    WHERE order_id = p_order_id
      AND COALESCE(is_available, true) = true;

    -- If no order_items fulfilled, fallback to total_amount minus discounts
    IF v_eligible_subtotal <= 0 THEN
        v_eligible_subtotal := GREATEST(0, COALESCE(v_order.total_amount, 0));
    END IF;

    -- Calculate base points using percentage (e.g. 1.0% reward on order subtotal):
    IF COALESCE(v_settings.earning_percentage, 0) > 0 THEN
        v_base_points := FLOOR(((v_eligible_subtotal * 100.0) * (v_settings.earning_percentage / 100.0)) / v_settings.paise_per_point);
    ELSE
        v_base_points := FLOOR(v_eligible_subtotal / COALESCE(v_settings.rupees_spent_per_point, 100));
    END IF;

    -- Check active promotions
    FOR v_promo IN
        SELECT * FROM loyalty_promotions
        WHERE is_active = true
          AND NOW() >= start_date
          AND (end_date IS NULL OR NOW() <= end_date)
          AND (min_cart_subtotal_paise <= (v_eligible_subtotal * 100))
        ORDER BY bonus_value DESC
        LIMIT 1
    LOOP
        IF v_promo.promotion_type = 'multiplier' THEN
            v_bonus_points := FLOOR(v_base_points * (v_promo.bonus_value - 1.0));
        ELSIF v_promo.promotion_type = 'fixed_bonus' THEN
            v_bonus_points := v_promo.bonus_value::INT;
        END IF;
    END LOOP;

    v_total_points := v_base_points + v_bonus_points;

    IF v_total_points <= 0 THEN
        RETURN jsonb_build_object('success', true, 'points_awarded', 0);
    END IF;

    -- Ensure wallet exists
    PERFORM public.loyalty_init_wallet(v_user_id);

    SELECT * INTO v_wallet
    FROM loyalty_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    v_expires_at := NOW() + (v_settings.expiry_days || ' days')::INTERVAL;

    -- Credit points to wallet
    UPDATE loyalty_wallets
    SET points_balance = points_balance + v_total_points,
        lifetime_earned_points = lifetime_earned_points + v_total_points,
        updated_at = NOW()
    WHERE id = v_wallet.id
    RETURNING * INTO v_wallet;

    -- Record transaction
    INSERT INTO loyalty_transactions (
        wallet_id, user_id, transaction_type, points,
        balance_after, rupee_value_paise, conversion_rate_paise,
        reference_id, description, idempotency_key
    ) VALUES (
        v_wallet.id, v_user_id, 'purchase_earned', v_total_points,
        v_wallet.points_balance, (v_total_points * v_settings.paise_per_point), v_settings.paise_per_point,
        p_order_id::text, 'Purchase reward for Order #' || COALESCE(v_order.order_number::text, p_order_id::text),
        'purchase_reward_' || p_order_id::text
    ) RETURNING id INTO v_tx_id;

    -- Create FIFO point lot
    INSERT INTO loyalty_point_lots (
        wallet_id, transaction_id, points_initial, points_remaining, expires_at
    ) VALUES (
        v_wallet.id, v_tx_id, v_total_points, v_total_points, v_expires_at
    );

    -- Update order with earned points & loyalty status
    UPDATE public.orders
    SET loyalty_points_earned = v_total_points,
        loyalty_status = 'rewarded'
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'points_awarded', v_total_points,
        'base_points', v_base_points,
        'bonus_points', v_bonus_points,
        'new_balance', v_wallet.points_balance
    );
END;
$$;

-- Function 8: Process Expired Points (Scheduled / Background Job)
CREATE OR REPLACE FUNCTION public.loyalty_process_expired_points()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record RECORD;
    v_total_expired_points INT := 0;
    v_total_lots_expired INT := 0;
    v_wallets_affected INT := 0;
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
BEGIN
    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;

    -- Group expired lots by wallet
    FOR v_record IN
        SELECT wallet_id, SUM(points_remaining) AS expired_sum, COUNT(*) AS lot_count
        FROM loyalty_point_lots
        WHERE is_expired = false
          AND points_remaining > 0
          AND expires_at < NOW()
        GROUP BY wallet_id
    LOOP
        SELECT * INTO v_wallet
        FROM loyalty_wallets
        WHERE id = v_record.wallet_id
        FOR UPDATE;

        -- Deduct expired points from wallet balance
        UPDATE loyalty_wallets
        SET points_balance = GREATEST(0, points_balance - v_record.expired_sum),
            updated_at = NOW()
        WHERE id = v_wallet.id
        RETURNING * INTO v_wallet;

        -- Mark lots as expired
        UPDATE loyalty_point_lots
        SET points_remaining = 0,
            is_expired = true,
            updated_at = NOW()
        WHERE wallet_id = v_record.wallet_id
          AND is_expired = false
          AND points_remaining > 0
          AND expires_at < NOW();

        -- Record transaction
        INSERT INTO loyalty_transactions (
            wallet_id, user_id, transaction_type, points,
            balance_after, rupee_value_paise, conversion_rate_paise,
            reference_id, description, idempotency_key
        ) VALUES (
            v_wallet.id, v_wallet.user_id, 'points_expired', -v_record.expired_sum,
            v_wallet.points_balance, (v_record.expired_sum * v_settings.paise_per_point), v_settings.paise_per_point,
            NOW()::date::text, 'Points expired automatically based on validity period',
            'expiry_' || v_wallet.id::text || '_' || to_char(NOW(), 'YYYYMMDD_HH24MISS_US')
        );

        v_total_expired_points := v_total_expired_points + v_record.expired_sum;
        v_total_lots_expired := v_total_lots_expired + v_record.lot_count;
        v_wallets_affected := v_wallets_affected + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'total_expired_points', v_total_expired_points,
        'total_lots_expired', v_total_lots_expired,
        'wallets_affected', v_wallets_affected
    );
END;
$$;

-- Function 9: Process Refund / Cancellation Points Restoration
CREATE OR REPLACE FUNCTION public.loyalty_process_refund_points(
    p_order_id UUID,
    p_refund_percentage NUMERIC DEFAULT 100.0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_redemption loyalty_redemptions%ROWTYPE;
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_points_to_restore INT := 0;
    v_points_to_revoke INT := 0;
    v_tx_id UUID;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;

    -- 1. Restore redeemed points if any
    SELECT * INTO v_redemption
    FROM loyalty_redemptions
    WHERE order_id = p_order_id AND status = 'applied'
    FOR UPDATE;

    IF FOUND THEN
        v_points_to_restore := ROUND(v_redemption.points_redeemed * (p_refund_percentage / 100.0));
        IF v_points_to_restore > 0 THEN
            SELECT * INTO v_wallet FROM loyalty_wallets WHERE id = v_redemption.wallet_id FOR UPDATE;

            UPDATE loyalty_wallets
            SET points_balance = points_balance + v_points_to_restore,
                lifetime_redeemed_points = GREATEST(0, lifetime_redeemed_points - v_points_to_restore),
                updated_at = NOW()
            WHERE id = v_wallet.id
            RETURNING * INTO v_wallet;

            INSERT INTO loyalty_transactions (
                wallet_id, user_id, transaction_type, points,
                balance_after, rupee_value_paise, conversion_rate_paise,
                reference_id, description, idempotency_key
            ) VALUES (
                v_wallet.id, v_wallet.user_id, 'redemption_refund', v_points_to_restore,
                v_wallet.points_balance, (v_points_to_restore * v_redemption.conversion_rate_paise), v_redemption.conversion_rate_paise,
                p_order_id::text, 'Refund points restored for returned/refunded order',
                'refund_restore_' || p_order_id::text
            ) RETURNING id INTO v_tx_id;

            INSERT INTO loyalty_point_lots (
                wallet_id, transaction_id, points_initial, points_remaining, expires_at
            ) VALUES (
                v_wallet.id, v_tx_id, v_points_to_restore, v_points_to_restore,
                NOW() + (v_settings.expiry_days || ' days')::INTERVAL
            );

            UPDATE loyalty_redemptions SET status = 'refunded' WHERE id = v_redemption.id;
        END IF;
    END IF;

    -- 2. Revoke earned purchase points if any were already awarded
    IF COALESCE(v_order.loyalty_points_earned, 0) > 0 THEN
        v_points_to_revoke := ROUND(v_order.loyalty_points_earned * (p_refund_percentage / 100.0));
        IF v_points_to_revoke > 0 THEN
            SELECT * INTO v_wallet FROM loyalty_wallets WHERE user_id = v_order.user_id FOR UPDATE;

            UPDATE loyalty_wallets
            SET points_balance = GREATEST(0, points_balance - v_points_to_revoke),
                lifetime_earned_points = GREATEST(0, lifetime_earned_points - v_points_to_revoke),
                updated_at = NOW()
            WHERE id = v_wallet.id
            RETURNING * INTO v_wallet;

            INSERT INTO loyalty_transactions (
                wallet_id, user_id, transaction_type, points,
                balance_after, rupee_value_paise, conversion_rate_paise,
                reference_id, description, idempotency_key
            ) VALUES (
                v_wallet.id, v_wallet.user_id, 'admin_debit', -v_points_to_revoke,
                v_wallet.points_balance, (v_points_to_revoke * v_settings.paise_per_point), v_settings.paise_per_point,
                p_order_id::text, 'Purchase points revoked due to order refund/return',
                'refund_revoke_' || p_order_id::text
            );
        END IF;
    END IF;

    UPDATE public.orders SET loyalty_status = 'refunded' WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_restored', v_points_to_restore,
        'points_revoked', v_points_to_revoke
    );
END;
$$;

-- Function 10: Admin Manual Points Adjustment (Credit / Debit with Mandatory Reason)
CREATE OR REPLACE FUNCTION public.loyalty_admin_adjust_points(
    p_admin_id UUID,
    p_user_id UUID,
    p_points INT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
    v_wallet loyalty_wallets%ROWTYPE;
    v_settings loyalty_settings%ROWTYPE;
    v_tx_type TEXT;
    v_tx_id UUID;
    v_audit_id UUID;
BEGIN
    -- Verify admin role
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = p_admin_id;
    IF v_admin_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can adjust loyalty points.';
    END IF;

    IF p_points = 0 THEN
        RAISE EXCEPTION 'Points adjustment cannot be zero.';
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Mandatory adjustment reason must be provided.';
    END IF;

    SELECT * INTO v_settings FROM loyalty_settings WHERE id = 1;

    -- Ensure wallet exists
    PERFORM public.loyalty_init_wallet(p_user_id);

    SELECT * INTO v_wallet FROM loyalty_wallets WHERE user_id = p_user_id FOR UPDATE;

    IF p_points < 0 AND (v_wallet.points_balance + p_points) < 0 THEN
        RAISE EXCEPTION 'Cannot debit % points. Customer only has % points.',
            ABS(p_points), v_wallet.points_balance;
    END IF;

    IF p_points > 0 THEN
        v_tx_type := 'admin_credit';
        UPDATE loyalty_wallets
        SET points_balance = points_balance + p_points,
            lifetime_earned_points = lifetime_earned_points + p_points,
            updated_at = NOW()
        WHERE id = v_wallet.id
        RETURNING * INTO v_wallet;
    ELSE
        v_tx_type := 'admin_debit';
        UPDATE loyalty_wallets
        SET points_balance = points_balance + p_points,
            updated_at = NOW()
        WHERE id = v_wallet.id
        RETURNING * INTO v_wallet;
    END IF;

    -- Record transaction
    INSERT INTO loyalty_transactions (
        wallet_id, user_id, transaction_type, points,
        balance_after, rupee_value_paise, conversion_rate_paise,
        reference_id, description, idempotency_key
    ) VALUES (
        v_wallet.id, p_user_id, v_tx_type, p_points,
        v_wallet.points_balance, (ABS(p_points) * v_settings.paise_per_point), v_settings.paise_per_point,
        p_admin_id::text, p_reason, 'admin_adj_' || gen_random_uuid()::text
    ) RETURNING id INTO v_tx_id;

    -- If credited, create a point lot
    IF p_points > 0 THEN
        INSERT INTO loyalty_point_lots (
            wallet_id, transaction_id, points_initial, points_remaining, expires_at
        ) VALUES (
            v_wallet.id, v_tx_id, p_points, p_points, NOW() + (v_settings.expiry_days || ' days')::INTERVAL
        );
    END IF;

    -- Record in Admin Audit Log
    INSERT INTO loyalty_admin_audit (
        admin_user_id, action_type, target_wallet_id, target_user_id,
        points_changed, reason, details
    ) VALUES (
        p_admin_id, 'manual_adjustment', v_wallet.id, p_user_id,
        p_points, p_reason, jsonb_build_object('transaction_id', v_tx_id, 'new_balance', v_wallet.points_balance)
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'wallet_id', v_wallet.id,
        'user_id', p_user_id,
        'points_changed', p_points,
        'new_balance', v_wallet.points_balance,
        'audit_id', v_audit_id
    );
END;
$$;

-- Function 11: Admin Update Loyalty Settings with Mandatory Reason & Audit
CREATE OR REPLACE FUNCTION public.loyalty_admin_update_settings(
    p_admin_id UUID,
    p_settings JSONB,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
    v_old_settings loyalty_settings%ROWTYPE;
    v_new_settings loyalty_settings%ROWTYPE;
BEGIN
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = p_admin_id;
    IF v_admin_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update loyalty settings.';
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Mandatory reason must be provided for settings update.';
    END IF;

    SELECT * INTO v_old_settings FROM loyalty_settings WHERE id = 1 FOR UPDATE;

    UPDATE loyalty_settings
    SET is_enabled = COALESCE((p_settings->>'is_enabled')::boolean, is_enabled),
        signup_bonus_points = COALESCE((p_settings->>'signup_bonus_points')::int, signup_bonus_points),
        earning_percentage = COALESCE((p_settings->>'earning_percentage')::numeric, earning_percentage),
        rupees_spent_per_point = COALESCE((p_settings->>'rupees_spent_per_point')::int, rupees_spent_per_point),
        paise_per_point = COALESCE((p_settings->>'paise_per_point')::int, paise_per_point),
        min_cart_subtotal_paise = COALESCE((p_settings->>'min_cart_subtotal_paise')::int, min_cart_subtotal_paise),
        min_points_to_redeem = COALESCE((p_settings->>'min_points_to_redeem')::int, min_points_to_redeem),
        max_redemption_percentage = COALESCE((p_settings->>'max_redemption_percentage')::int, max_redemption_percentage),
        max_points_per_order = COALESCE((p_settings->>'max_points_per_order')::int, max_points_per_order),
        expiry_days = COALESCE((p_settings->>'expiry_days')::int, expiry_days),
        updated_at = NOW(),
        updated_by = p_admin_id
    WHERE id = 1
    RETURNING * INTO v_new_settings;

    -- Record in Admin Audit Log
    INSERT INTO loyalty_admin_audit (
        admin_user_id, action_type, points_changed, reason, details
    ) VALUES (
        p_admin_id, 'settings_update', NULL, p_reason,
        jsonb_build_object('old', to_jsonb(v_old_settings), 'new', to_jsonb(v_new_settings))
    );

    RETURN jsonb_build_object(
        'success', true,
        'settings', to_jsonb(v_new_settings)
    );
END;
$$;

-- Inform PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

