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

async function inspectCoupons() {
    console.log('--- Inspecting Coupons Table ---');

    // Fetch one row to see structure, or just use error message if empty
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length === 0) {
            console.log('Table is empty. Attempting to insert dummy to get column error or just listing keys from a previous known state is hard.');
            console.log('Please check Supabase Dashboard for exact columns.');
        } else {
            console.log('Found columns:', Object.keys(data[0]));
        }
    }
}

inspectCoupons();
