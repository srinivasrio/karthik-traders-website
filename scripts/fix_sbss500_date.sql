-- Fix Coupon Date: make SBSS500 active immediately by clearing start_date
-- (or setting it to yesterday)

UPDATE public.coupons
SET start_date = NULL,
    is_active = true
WHERE code = 'SBSS500';

SELECT * FROM public.coupons WHERE code = 'SBSS500';
