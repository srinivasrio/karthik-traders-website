-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create coupons-aerators mapping table
CREATE TABLE IF NOT EXISTS coupon_aerators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL, -- Corresponds to product.id or slug from codebase
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coupon_id, product_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_aerators ENABLE ROW LEVEL SECURITY;

-- Create Policies (Adjust based on your auth model -> authenticated users/admins only?)
-- For now, allowing all authenticated users (assuming only admins have access to the dashboard)
-- OR even better, create a specific policy for "admin" role if you have it.

-- Policy: Read access for everyone (so clients can validate coupons)
CREATE POLICY "Public read access for coupons" ON coupons
FOR SELECT USING (true); -- Or limit to is_active = true for public

-- Policy: Admin all access (Assuming you handle auth check in application/middleware for mutations)
-- If you want strict RLS enforcement for writes:
-- CREATE POLICY "Admin write access" ON coupons
-- FOR ALL USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- For this MVP, we will rely on Application Level Security (Admin Panel) and generic authenticated access
CREATE POLICY "Authenticated full access" ON coupons
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access" ON coupon_aerators
FOR ALL USING (auth.role() = 'authenticated');
