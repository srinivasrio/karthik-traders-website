const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = envConfig.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoupon() {
    const code = 'K500';
    console.log(`Checking coupon: ${code}...`);

    // 1. Fetch Coupon
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

    console.log('--- Coupon Data ---');
    console.log(JSON.stringify(coupon, null, 2));

    // 2. Analyze Identifiers
    const identifiers = coupon.coupon_aerators.map(ca => ca.product_id);
    console.log('\n--- Associated Product Identifiers ---');
    console.log(identifiers);

    // Check for potential whitespace or hidden characters
    identifiers.forEach(id => {
        console.log(`'${id}' (length: ${id.length})`);
    });
}

checkCoupon();
