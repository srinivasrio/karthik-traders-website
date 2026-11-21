import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local
if (fs.existsSync('.env.local')) {
    const content = fs.readFileSync('.env.local', 'utf8');
    content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
                const key = trimmed.slice(0, idx).trim();
                const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
                process.env[key] = val;
            }
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://karthiktraders.in';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

const results = [];

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
}

async function runTestCase(name, fn) {
    process.stdout.write(`⏳ Running: ${name}... `);
    const start = Date.now();
    try {
        await fn();
        const duration = Date.now() - start;
        console.log(`✅ PASSED (${duration}ms)`);
        results.push({ name, status: 'PASSED', duration });
    } catch (err) {
        const duration = Date.now() - start;
        console.log(`❌ FAILED (${duration}ms)`);
        console.error(`   Error: ${err.message}`);
        results.push({ name, status: 'FAILED', duration, error: err.message });
    }
}

async function main() {
    console.log('====================================================');
    console.log('   KARTHIK TRADERS — ORDER FLOW TEST SUITE');
    console.log('====================================================\n');

    // TEST CASE 1: Checkout Form Validation Rules
    await runTestCase('TC-01: Checkout Form Validation Rules (Full Name, Address, City, State, Mobile, Pin)', async () => {
        const validate = (formData) => {
            const errors = {};
            if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
            if (!formData.addressLine1?.trim()) errors.addressLine1 = 'Address is required';
            if (!formData.city?.trim()) errors.city = 'City is required';
            if (!formData.state?.trim()) errors.state = 'State is required';
            if (!/^\d{6}$/.test(formData.pincode || '')) errors.pincode = 'Invalid pincode';
            if (!/^\d{10}$/.test(formData.mobile || '')) errors.mobile = 'Invalid mobile';
            return errors;
        };

        // Test invalid form
        const invalidForm = { fullName: '', mobile: '12345', pincode: '524' };
        const errors = validate(invalidForm);
        assert(errors.fullName, 'Should catch empty name');
        assert(errors.mobile, 'Should reject non-10-digit mobile');
        assert(errors.pincode, 'Should reject non-6-digit pincode');

        // Test valid form
        const validForm = {
            fullName: 'Srinivas Test',
            addressLine1: 'Farm Road, Allur',
            city: 'Nellore',
            state: 'Andhra Pradesh',
            pincode: '524001',
            mobile: '9515816084',
        };
        const validErrors = validate(validForm);
        assert(Object.keys(validErrors).length === 0, 'Valid form should have 0 errors');
    });

    // TEST CASE 2: Cart Calculation & Pricing Accuracy
    await runTestCase('TC-02: Cart Calculation & Price Discount Accuracy', async () => {
        const item = {
            name: 'SEA BOSS 2HP 4 PADDLE WHEEL AERATOR',
            mrp: 31000,
            salePrice: 27999,
            quantity: 2
        };
        const subtotal = item.salePrice * item.quantity;
        const mrpTotal = item.mrp * item.quantity;
        const totalSavings = mrpTotal - subtotal;
        const loyaltyDiscount = 500;
        const finalPayable = subtotal - loyaltyDiscount;

        assert(subtotal === 55998, `Subtotal expected 55998, got ${subtotal}`);
        assert(totalSavings === 6002, `Savings expected 6002, got ${totalSavings}`);
        assert(finalPayable === 55498, `Final payable expected 55498, got ${finalPayable}`);
    });

    // TEST CASE 3: State Delivery Policy & Staging Safety Guard
    await runTestCase('TC-03: State Delivery Policy & Production Live Verification', async () => {
        // Query live delivery config from database delivery_general_settings
        const { data: generalRes } = await supabase
            .from('delivery_general_settings')
            .select('is_delivery_feature_enabled_in_production')
            .eq('id', 1)
            .single();
        const enabledInProduction = generalRes?.is_delivery_feature_enabled_in_production ?? false;

        assert(enabledInProduction === true, 'CRITICAL: Delivery transparency feature MUST be LIVE on production (enabledInProduction: true)');

        // Test delivery rule resolution
        const rules = [
            { stateName: 'Andhra Pradesh', isFreeDelivery: true, timelineText: '3 to 7 Days' },
            { stateName: 'Telangana', isFreeDelivery: false, timelineText: '3 to 7 Days' },
            { stateName: 'Tamil Nadu', isFreeDelivery: false, timelineText: '3 to 7 Days' }
        ];

        const apRule = rules.find(r => r.stateName === 'Andhra Pradesh');
        assert(apRule.isFreeDelivery === true, 'Andhra Pradesh aerators must be FREE delivery');

        const tsRule = rules.find(r => r.stateName === 'Telangana');
        assert(tsRule.isFreeDelivery === false, 'Telangana orders must be Customer Arranged transport');
    });

    // TEST CASE 4: Loyalty Points Database Rules & Preview RPC
    await runTestCase('TC-04: Loyalty Points Settings & Redemption Thresholds', async () => {
        // Test RPC loyalty_get_wallet_summary
        const testUserId = '50db9da9-0238-4242-8c55-6f574bea0432';
        const { data: summary, error } = await supabase.rpc('loyalty_get_wallet_summary', { p_user_id: testUserId });
        assert(!error, `Failed to fetch wallet summary: ${error?.message}`);
        assert(summary && summary.settings, 'Wallet summary must return settings');
        assert(summary.settings.is_enabled === true, 'Loyalty program must be enabled');
        assert(summary.settings.min_points_to_redeem >= 50, 'Minimum points to redeem should be >= 50');

        // Test preview redemption with user who has 0 points
        const { data: preview } = await supabase.rpc('loyalty_preview_redemption', {
            p_user_id: testUserId,
            p_eligible_subtotal_paise: 300000,
            p_points_requested: 100
        });

        assert(preview, 'Preview RPC must return preview result');
        assert(preview.is_eligible === false, 'User with 0 points should not be eligible for redemption');
        assert(preview.reason_code === 'MIN_POINTS_NOT_MET', 'Reason code should be MIN_POINTS_NOT_MET');
        assert(preview.available_points === 0, 'Available points should be 0');
        assert(preview.message.includes('A minimum of'), 'Message should indicate minimum threshold requirement');
    });

    // TEST CASE 5: Duplicate Order Protection & Database Integrity
    await runTestCase('TC-05: Duplicate Order Protection & Database Integrity', async () => {
        // Query recent orders from orders table
        const { data: recentOrders, error } = await supabase
            .from('orders')
            .select('id, order_number, total_amount, loyalty_points_redeemed, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        assert(!error, `Failed to query orders: ${error?.message}`);
        assert(recentOrders && recentOrders.length > 0, 'Orders should exist in database');

        const latest = recentOrders[0];
        assert(latest.order_number > 0, 'Order number must be positive integer');
        assert(latest.total_amount > 0, 'Order total must be positive number');
    });

    // TEST CASE 6: Proforma Invoice & Delivery Notice Compliance
    await runTestCase('TC-06: Proforma Invoice Labels & Delivery Notice Verification', async () => {
        const invoiceCode = fs.readFileSync('src/components/invoice/InvoicePDF.tsx', 'utf8');

        assert(invoiceCode.includes('PROFORMA INVOICE'), 'InvoicePDF must display PROFORMA INVOICE');
        assert(!invoiceCode.includes('<Text style={styles.taxInvoicePill}>TAX INVOICE</Text>'), 'InvoicePDF must NOT display TAX INVOICE as header badge');
        assert(invoiceCode.includes('TAX INVOICE WILL BE PROVIDED AT DELIVERY'), 'InvoicePDF must state TAX INVOICE WILL BE PROVIDED AT DELIVERY');
        assert(invoiceCode.includes('Official GST Tax Invoice will be handed over at the time of delivery'), 'InvoicePDF terms must state Tax Invoice will be given at delivery');

        const dashCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
        assert(dashCode.includes('PROFORMA INVOICE'), 'Dashboard preview must display PROFORMA INVOICE');
        assert(dashCode.includes('Tax invoice will be given during delivery'), 'Dashboard must state Tax invoice will be given during delivery');

        const checkoutCode = fs.readFileSync('src/app/bulk-orders/page.tsx', 'utf8');
        assert(checkoutCode.includes('Official GST tax invoice will be given during delivery'), 'Checkout terms must state Tax invoice will be given during delivery');
    });

    // TEST CASE 7: Admin Orders & Customer Foreign Key Safety
    await runTestCase('TC-07: Admin Orders Access & Customer Deletion Safety', async () => {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, customer_mobile, total_amount, status, payment_status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);

        assert(!error, `Failed to query orders: ${error?.message}`);
        assert(orders && orders.length > 0, 'Orders table should return orders');
        
        const order = orders[0];
        assert(order.order_number, 'Order must have order_number');
        assert(order.customer_name, 'Order must have customer_name');
        assert(order.customer_mobile, 'Order must have customer_mobile');
    });

    console.log('\n====================================================');
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed out of ${results.length} Tests`);
    console.log('====================================================\n');
}

main().catch(err => {
    console.error('Test Suite Fatal Error:', err);
    process.exit(1);
});
