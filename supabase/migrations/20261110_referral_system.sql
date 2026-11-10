-- ==============================================================================
-- KARTHIK TRADERS: DUAL-BENEFIT REFERRAL PROGRAM MIGRATION
-- ==============================================================================

-- 1. EXTEND PROFILES WITH REFERRAL FIELDS
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 2. HELPER FUNCTION TO GENERATE CLEAN, UNIQUE REFERRAL CODE
CREATE OR REPLACE FUNCTION public.fn_generate_referral_code(p_name TEXT, p_mobile TEXT)
RETURNS TEXT AS $$
DECLARE
    v_clean_name TEXT;
    v_clean_phone TEXT;
    v_suffix TEXT;
    v_candidate TEXT;
    v_exists BOOLEAN;
    v_attempt INT := 0;
BEGIN
    -- Extract clean alphanumeric uppercase name snippet (max 6 chars)
    v_clean_name := UPPER(REGEXP_REPLACE(COALESCE(p_name, 'FARMER'), '[^a-zA-Z0-9]', '', 'g'));
    IF LENGTH(v_clean_name) < 3 THEN
        v_clean_name := 'FARMER';
    ELSE
        v_clean_name := SUBSTRING(v_clean_name FROM 1 FOR 6);
    END IF;

    -- Extract last 4 digits of phone
    v_clean_phone := REGEXP_REPLACE(COALESCE(p_mobile, ''), '[^0-9]', '', 'g');
    IF LENGTH(v_clean_phone) >= 4 THEN
        v_suffix := SUBSTRING(v_clean_phone FROM LENGTH(v_clean_phone) - 3 FOR 4);
    ELSE
        v_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;

    v_candidate := 'KT-' || v_clean_name || '-' || v_suffix;

    -- Ensure uniqueness
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_candidate) INTO v_exists;
    WHILE v_exists AND v_attempt < 10 LOOP
        v_attempt := v_attempt + 1;
        v_candidate := 'KT-' || v_clean_name || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_candidate) INTO v_exists;
    END LOOP;

    RETURN v_candidate;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. TRIGGER TO AUTO-GENERATE REFERRAL CODE ON PROFILE INSERT
CREATE OR REPLACE FUNCTION public.trg_assign_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL OR TRIM(NEW.referral_code) = '' THEN
        NEW.referral_code := public.fn_generate_referral_code(NEW.full_name, NEW.mobile);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_referral_code ON public.profiles;
CREATE TRIGGER trg_profiles_referral_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_assign_referral_code();

-- 4. BACKFILL REFERRAL CODES FOR ALL EXISTING PROFILES
DO $$
DECLARE
    r RECORD;
    v_code TEXT;
BEGIN
    FOR r IN SELECT id, full_name, mobile FROM public.profiles WHERE referral_code IS NULL LOOP
        v_code := public.fn_generate_referral_code(r.full_name, r.mobile);
        UPDATE public.profiles SET referral_code = v_code WHERE id = r.id;
    END LOOP;
END $$;

-- 5. EXTEND ORDERS TABLE WITH REFERRAL TRACKING
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS referral_code TEXT,
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS referral_discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS referral_reward_status TEXT NOT NULL DEFAULT 'none';

-- Drop and recreate check constraint safely on orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_referral_reward_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_referral_reward_status_check
    CHECK (referral_reward_status IN ('none', 'pending', 'awarded', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_orders_referred_by ON public.orders(referred_by);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code);

-- 6. EXTEND LOYALTY SETTINGS WITH REFERRAL CONFIGURATION
ALTER TABLE public.loyalty_settings
    ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS referral_discount_rupees INT NOT NULL DEFAULT 500,
    ADD COLUMN IF NOT EXISTS referral_bonus_points INT NOT NULL DEFAULT 1000,
    ADD COLUMN IF NOT EXISTS referral_min_order_rupees INT NOT NULL DEFAULT 5000;

-- 7. UPDATE LOYALTY TRANSACTIONS CHECK CONSTRAINT FOR 'referral_bonus'
ALTER TABLE public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_transaction_type_check;
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_transaction_type_check
    CHECK (transaction_type IN (
        'signup_bonus',
        'purchase_earned',
        'promotional_bonus',
        'checkout_redemption',
        'redemption_refund',
        'points_expired',
        'admin_credit',
        'admin_debit',
        'order_cancelled_restore',
        'referral_bonus'
    ));

-- 8. REFERRALS LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    points_awarded INT NOT NULL DEFAULT 0,
    discount_given INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    awarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_order ON public.referrals(order_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT USING (
        auth.uid() = referrer_id OR auth.uid() = referred_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
CREATE POLICY "Admins can manage referrals" ON public.referrals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 9. STORED PROCEDURE TO AWARD REFERRAL BONUS POINTS UPON ORDER DELIVERY
CREATE OR REPLACE FUNCTION public.loyalty_award_referral_points(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_settings RECORD;
    v_referrer_wallet RECORD;
    v_points_to_award INT;
    v_new_balance INT;
    v_paise_value INT;
    v_paise_rate INT;
    v_tx_id UUID;
BEGIN
    -- 1. Fetch order details
    SELECT id, order_number, user_id, customer_name, customer_mobile, total_amount, status, referred_by, referral_code, referral_reward_status
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Check if eligible for referral reward
    IF v_order.referred_by IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order has no referrer');
    END IF;

    IF v_order.referral_reward_status = 'awarded' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Referral reward already awarded');
    END IF;

    -- Only award when order is delivered or completed
    IF LOWER(COALESCE(v_order.status, '')) NOT IN ('delivered', 'completed') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Order must be delivered or completed to award referral bonus');
    END IF;

    -- 2. Fetch loyalty settings
    SELECT referral_enabled, referral_bonus_points, paise_per_point
    INTO v_settings
    FROM public.loyalty_settings
    LIMIT 1;

    IF NOT FOUND OR NOT COALESCE(v_settings.referral_enabled, true) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Referral system is currently disabled');
    END IF;

    v_points_to_award := COALESCE(v_settings.referral_bonus_points, 1000);
    v_paise_rate := COALESCE(v_settings.paise_per_point, 25);
    v_paise_value := v_points_to_award * v_paise_rate;

    -- 3. Lock and fetch referrer wallet
    SELECT id, user_id, points_balance, lifetime_earned_points, is_active
    INTO v_referrer_wallet
    FROM public.loyalty_wallets
    WHERE user_id = v_order.referred_by
    FOR UPDATE;

    -- If referrer has no wallet yet, initialize one
    IF NOT FOUND THEN
        INSERT INTO public.loyalty_wallets (user_id, points_balance, lifetime_earned_points, lifetime_redeemed_points, is_active)
        VALUES (v_order.referred_by, 0, 0, 0, true)
        RETURNING id, user_id, points_balance, lifetime_earned_points, is_active
        INTO v_referrer_wallet;
    END IF;

    IF NOT v_referrer_wallet.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Referrer loyalty wallet is inactive');
    END IF;

    v_new_balance := v_referrer_wallet.points_balance + v_points_to_award;

    -- 4. Update referrer wallet balance
    UPDATE public.loyalty_wallets
    SET points_balance = v_new_balance,
        lifetime_earned_points = v_referrer_wallet.lifetime_earned_points + v_points_to_award,
        updated_at = NOW()
    WHERE id = v_referrer_wallet.id;

    -- 5. Record immutable transaction in ledger
    INSERT INTO public.loyalty_transactions (
        wallet_id,
        user_id,
        transaction_type,
        points,
        balance_after,
        rupee_value_paise,
        conversion_rate_paise,
        reference_id,
        description,
        idempotency_key
    ) VALUES (
        v_referrer_wallet.id,
        v_order.referred_by,
        'referral_bonus',
        v_points_to_award,
        v_new_balance,
        v_paise_value,
        v_paise_rate,
        v_order.id::TEXT,
        'Referral reward: ' || COALESCE(v_order.customer_name, 'Farmer') || ' completed order #' || COALESCE(v_order.order_number::TEXT, v_order.id::TEXT),
        'ref_reward_' || v_order.id::TEXT
    )
    RETURNING id INTO v_tx_id;

    -- 6. Update order referral reward status
    UPDATE public.orders
    SET referral_reward_status = 'awarded',
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 7. Update referrals ledger table
    UPDATE public.referrals
    SET status = 'completed',
        points_awarded = v_points_to_award,
        awarded_at = NOW()
    WHERE order_id = p_order_id;

    -- If no referral record existed, insert completed record
    IF NOT FOUND THEN
        INSERT INTO public.referrals (
            referrer_id,
            referred_id,
            order_id,
            referral_code,
            status,
            points_awarded,
            discount_given,
            created_at,
            awarded_at
        ) VALUES (
            v_order.referred_by,
            v_order.user_id,
            p_order_id,
            COALESCE(v_order.referral_code, 'DIRECT'),
            'completed',
            v_points_to_award,
            COALESCE(v_order.referral_discount_amount, 500)::INT,
            NOW(),
            NOW()
        );
    END IF;

    -- 8. Increment referrer's referral count
    UPDATE public.profiles
    SET referral_count = referral_count + 1,
        updated_at = NOW()
    WHERE id = v_order.referred_by;

    RETURN jsonb_build_object(
        'success', true,
        'points_awarded', v_points_to_award,
        'new_balance', v_new_balance,
        'referrer_id', v_order.referred_by,
        'transaction_id', v_tx_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

