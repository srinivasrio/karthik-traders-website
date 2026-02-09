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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoupon() {
    console.log('--- Checking Coupon SBSS500 ---');

    const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', 'SBSS500')
        .single();

    if (error) {
        console.error('Error fetching coupon:', error);
    } else {
        console.log('Coupon Data:', coupon);
        if (coupon) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            console.log('Server Logic NOW (Start of Day):', now.toISOString());

            if (coupon.start_date) {
                const start = new Date(coupon.start_date);
                start.setHours(0, 0, 0, 0);
                console.log('Coupon Start Date (Start of Day):', start.toISOString());
                console.log('Start > Now?', start > now);
            } else {
                console.log('Start Date is NULL (Active immediately)');
            }
        }
    }
}

checkCoupon();
