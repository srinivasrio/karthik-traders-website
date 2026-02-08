const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = envConfig.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY; // USING ANON KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create client with ANON key (simulating the app)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCouponAnon() {
    console.log('--- Checking Coupon with ANON KEY ---');
    const code = 'K500';

    const { data: coupon, error } = await supabase
        .from('coupons')
        .select(`
            *,
            coupon_aerators (product_id)
        `)
        .eq('code', code)
        .single();

    if (error) {
        console.error('Error fetching coupon:', error);
        return;
    }

    if (!coupon) {
        console.error('Coupon not found!');
        return;
    }

    console.log('Coupon Code:', coupon.code);
    console.log('Applicable Products (coupon_aerators):');
    console.log(JSON.stringify(coupon.coupon_aerators, null, 2));

    if (!coupon.coupon_aerators || coupon.coupon_aerators.length === 0) {
        console.error('🚨 FAILURE: coupon_aerators is empty! RLS likely blocking access.');
    } else {
        console.log('✅ SUCCESS: Coupon aerators fetched successfully.');
    }
}

checkCouponAnon();
