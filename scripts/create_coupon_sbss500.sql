-- Create Coupon: SBSS500
-- Discount: ₹500 Flat
-- Applicable To: PR 14 BSS (seaboss-2hp-4-paddle-pr14bss)

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
