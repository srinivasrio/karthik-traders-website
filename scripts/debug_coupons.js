const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim().replace(/"/g, ''); // Simple parsing
    }
});

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCoupons() {
    console.log('Fetching recent coupons...');

    const { data: coupons, error } = await supabase
        .from('coupons')
        .select(`
      id, 
      code, 
      created_at,
      coupon_aerators (
        product_id
      )
    `)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching coupons:', error);
        return;
    }

    console.log(JSON.stringify(coupons, null, 2));
}

checkCoupons();
