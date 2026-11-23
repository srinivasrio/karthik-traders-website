import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (match) {
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        envVars[match[1]] = val;
    }
});

const BASE_URL = 'https://karthiktraders.in';
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || BASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${testName}`);
        passedCount++;
    } else {
        console.error(`  ❌ [FAIL] ${testName}: ${details}`);
        failedCount++;
    }
}

async function runTests() {
    console.log('====================================================');
    console.log(' 🚀 LIVE PRODUCTION COMPREHENSIVE VERIFICATION');
    console.log(` Target URL: ${BASE_URL}`);
    console.log('====================================================\n');

    // 1. Test Public Routes
    console.log('📋 Test Group 1: Public Web Routes & Status');
    const routes = [
        '/',
        '/products',
        '/aerator-sets',
        '/long-arm',
        '/spares',
        '/cart',
        '/checkout',
        '/contact',
        '/privacy-policy',
        '/terms-conditions',
        '/refund-policy'
    ];

    for (const r of routes) {
        try {
            const res = await fetch(`${BASE_URL}${r}`, { method: 'GET' });
            assert(res.status === 200, `Route ${r} responds HTTP 200 OK`, `Status: ${res.status}`);
        } catch (e) {
            assert(false, `Route ${r} responded with error`, e.message);
        }
    }

    // 2. Test Delivery Config API
    console.log('\n📋 Test Group 2: Delivery Config API & Policy Rules');
    try {
        const res = await fetch(`${BASE_URL}/api/delivery/config`);
        const json = await res.json();
        assert(json.success === true, 'Delivery config API returns success: true');
        assert(Array.isArray(json.rules) && json.rules.length >= 5, `State delivery rules loaded successfully (${json.rules?.length || 0} priority coastal states configured)`);
        
        const apRule = json.rules.find(r => r.stateCode === 'AP' || r.stateName === 'Andhra Pradesh');
        assert(apRule !== undefined, 'Andhra Pradesh delivery rule is defined');
        assert(apRule?.isFreeDelivery === true, 'AP Free Delivery flag is true');
        assert(json.general?.minAeratorQtyForFreeDelivery === 10, 'Free delivery threshold is 10 units MOQ');
    } catch (e) {
        assert(false, 'Delivery Config API error', e.message);
    }

    // 3. Test Database Integrity & Payment Method Column
    console.log('\n📋 Test Group 3: Database Integrity & Orders Payment Method');
    try {
        const { data: orders, error: ordersErr } = await supabase
            .from('orders')
            .select('id, payment_method, status')
            .limit(5);

        assert(!ordersErr, 'Orders table query succeeds without column error');
        if (orders && orders.length > 0) {
            const first = orders[0];
            assert(first.payment_method === 'COD' || first.payment_method === 'Online', `Payment method is valid enum: ${first.payment_method}`);
        }
    } catch (e) {
        assert(false, 'Database payment_method test error', e.message);
    }

    // 4. Test Live Products Catalog in Database
    console.log('\n📋 Test Group 4: Live Products Catalog Count & Categories');
    try {
        const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, name, price, category');

        assert(!prodErr, 'Products table query succeeds');
        assert(products && products.length >= 40, `Products table has all catalog items (${products?.length || 0} items)`);
        
        const categories = new Set((products || []).map(p => (p.category || '').toLowerCase()));
        assert(categories.has('aerator-set') || categories.has('aerators'), 'Catalog contains aerator sets');
        assert(categories.has('motors') || categories.has('motor'), 'Catalog contains motors');
        assert(categories.has('gearboxes') || categories.has('gearbox'), 'Catalog contains gearboxes');
        assert(categories.has('spares') || categories.has('spare'), 'Catalog contains spare parts');
        assert(categories.has('long-arm'), 'Catalog contains long-arm products');
    } catch (e) {
        assert(false, 'Products query error', e.message);
    }

    // 5. Test Loaded Vehicle Image Upload to Supabase Storage
    console.log('\n📋 Test Group 5: Loaded Vehicle Image Upload & Storage Bucket');
    try {
        const testPng = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
            0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
            0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
            0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
            0x42, 0x60, 0x82
        ]);
        const testPath = `delivery/test-verification-${Date.now()}.png`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('product-images')
            .upload(testPath, testPng, { contentType: 'image/png', upsert: true });

        assert(!uploadErr, 'Vehicle photo successfully uploads to product-images/delivery/');
        
        const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(testPath);

        assert(Boolean(urlData?.publicUrl?.includes('/product-images/delivery/')), 'Public URL generated correctly for uploaded vehicle image');

        // Clean up test file
        await supabase.storage.from('product-images').remove([testPath]);
    } catch (e) {
        assert(false, 'Vehicle storage upload test error', e.message);
    }

    // 6. Test Server Action Body Size Configuration in Next.js config
    console.log('\n📋 Test Group 6: Next.js Configuration');
    try {
        const nextConfigContent = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');
        assert(nextConfigContent.includes('bodySizeLimit'), 'next.config.ts has bodySizeLimit configured');
        assert(nextConfigContent.includes('25mb'), 'bodySizeLimit set to 25mb for high-res mobile photos');
    } catch (e) {
        assert(false, 'next.config.ts check failed', e.message);
    }

    // 7. Test Lightning Icon Removal
    console.log('\n📋 Test Group 7: UI Cleanliness (Removal of ⚡ Icon)');
    try {
        const deliveryPageContent = fs.readFileSync(path.join(process.cwd(), 'src/app/admin/delivery/page.tsx'), 'utf8');
        assert(!deliveryPageContent.includes('⚡'), 'No ⚡ icon found in src/app/admin/delivery/page.tsx');
    } catch (e) {
        assert(false, 'Admin delivery page check failed', e.message);
    }

    // 8. Test Old Delivery Text Removal from Product Pages
    console.log('\n📋 Test Group 8: Clean Product Delivery Information');
    try {
        const productEstimatorContent = fs.readFileSync(path.join(process.cwd(), 'src/components/delivery/ProductDeliveryEstimator.tsx'), 'utf8');
        assert(!productEstimatorContent.includes('Delivery in 1 to 7 Days. Transport is customer responsibility'), 'Old static disclaimer removed from ProductDeliveryEstimator');
        assert(!productEstimatorContent.includes('Free delivery option is currently disabled by store administration'), 'Disabled banner removed');
    } catch (e) {
        assert(false, 'Product Delivery Estimator check failed', e.message);
    }

    console.log('\n====================================================');
    console.log(`📊 FINAL TEST REPORT: ${passedCount} Passed, ${failedCount} Failed out of ${passedCount + failedCount} Tests`);
    console.log('====================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});
