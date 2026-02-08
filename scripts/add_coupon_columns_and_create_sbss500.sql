-- 1. Add missing columns to support advanced coupon features
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS applicable_products text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_order_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_limit integer DEFAULT NULL;

-- 2. Create Coupon: SBSS500
INSERT INTO public.coupons (
    code, 
    discount_type, 
    discount_value, 
    min_order_value, 
    applicable_products, 
    usage_limit, 
    is_active, 
    created_at
)
VALUES (
    'SBSS500',                                  -- Code
    'flat',                                     -- Type
    500,                                        -- Value
    0,                                          -- Min Order Value
    ARRAY['seaboss-2hp-4-paddle-pr14bss'],      -- Applicable Product Slug
    NULL,                                       -- Unlimited Usage
    true,                                       -- Active
    NOW()
)
ON CONFLICT (code) DO UPDATE
SET 
    discount_value = 500,
    applicable_products = ARRAY['seaboss-2hp-4-paddle-pr14bss'],
    is_active = true;

SELECT * FROM public.coupons WHERE code = 'SBSS500';
