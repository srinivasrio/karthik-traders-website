const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2].replace(/^"(.*)"$/, '$1');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCoupon() {
    const code = 'K500';
    console.log(`Checking coupon: ${code}...`);

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

    console.log('Coupon Data:', JSON.stringify(coupon, null, 2));
}

checkCoupon();
