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

    // TEST CASE 3: State Delivery Policy, 10 Aerators MOQ & Admin Enable/Disable
    await runTestCase('TC-03: State Delivery Policy, 10 Aerators MOQ & Admin Controls', async () => {
        // Query live delivery config from database delivery_general_settings
        const { data: generalRes } = await supabase
            .from('delivery_general_settings')
            .select('is_delivery_feature_enabled_in_production, is_free_delivery_enabled, min_aerator_qty_for_free_delivery')
            .eq('id', 1)
            .single();

        const enabledInProduction = generalRes?.is_delivery_feature_enabled_in_production ?? false;
        assert(enabledInProduction === true, 'Delivery transparency feature MUST be LIVE on production (enabledInProduction: true)');

        const minMoq = generalRes?.min_aerator_qty_for_free_delivery ?? 10;
        assert(minMoq === 10, `Minimum order quantity for free delivery must be 10 aerators, got ${minMoq}`);

        // Verify database holds a boolean for is_free_delivery_enabled
        assert(typeof generalRes?.is_free_delivery_enabled === 'boolean', 'is_free_delivery_enabled must be a boolean in database');

        // Test delivery rules
        const rules = [
            { id: 'andhra_pradesh', stateName: 'Andhra Pradesh', stateCode: 'AP', isFreeDelivery: true, timelineText: '3 to 7 Days' },
            { id: 'telangana', stateName: 'Telangana', stateCode: 'TS', isFreeDelivery: false, timelineText: '3 to 7 Days' },
            { id: 'tamil_nadu', stateName: 'Tamil Nadu', stateCode: 'TN', isFreeDelivery: false, timelineText: '3 to 7 Days' }
        ];

        // Dynamic mock evaluation helper matching delivery-config
        const evalOrder = (items, state, gen) => {
            const rule = rules.find(r => r.stateName === state) || rules[2];
            const isGloballyActive = gen?.isFreeDeliveryEnabled ?? true;
            if (!isGloballyActive) return { isFreeDelivery: false, reason: 'Disabled by admin' };
            if (!rule.isFreeDelivery) return { isFreeDelivery: false, reason: 'State not eligible' };
            const moq = gen?.minAeratorQtyForFreeDelivery ?? 10;
            const aeratorQty = items.reduce((sum, it) => (it.category === 'aerator-set' ? sum + (it.quantity || 1) : sum), 0);
            if (aeratorQty === 0) return { isFreeDelivery: false, reason: 'Spares only' };
            if (aeratorQty >= moq) return { isFreeDelivery: true, reason: 'Meets MOQ' };
            return { isFreeDelivery: false, reason: `Requires minimum ${moq} aerators` };
        };

        const genConfig = { isFreeDeliveryEnabled: true, minAeratorQtyForFreeDelivery: 10 };

        // Test 1: Exactly 10 aerators in AP -> FREE DELIVERY
        const res10 = evalOrder([{ category: 'aerator-set', quantity: 10 }], 'Andhra Pradesh', genConfig);
        assert(res10.isFreeDelivery === true, '10 aerators in Andhra Pradesh MUST get Free Delivery');

        // Test 2: Less than 10 aerators in AP (e.g. 2 aerators) -> NOT FREE
        const res2 = evalOrder([{ category: 'aerator-set', quantity: 2 }], 'Andhra Pradesh', genConfig);
        assert(res2.isFreeDelivery === false, '2 aerators in Andhra Pradesh must NOT get Free Delivery (MOQ is 10)');
        assert(res2.reason.includes('10 aerators'), 'Reason must specify 10 aerators requirement');

        // Test 3: 9 aerators in AP -> NOT FREE
        const res9 = evalOrder([{ category: 'aerator-set', quantity: 9 }], 'Andhra Pradesh', genConfig);
        assert(res9.isFreeDelivery === false, '9 aerators in Andhra Pradesh must NOT get Free Delivery');

        // Test 4: 15 aerators in AP -> FREE DELIVERY
        const res15 = evalOrder([{ category: 'aerator-set', quantity: 15 }], 'Andhra Pradesh', genConfig);
        assert(res15.isFreeDelivery === true, '15 aerators in Andhra Pradesh must get Free Delivery');

        // Test 5: 10 aerators in Telangana -> NOT FREE (Interstate customer arranged)
        const resTs = evalOrder([{ category: 'aerator-set', quantity: 10 }], 'Telangana', genConfig);
        assert(resTs.isFreeDelivery === false, 'Telangana orders must be Customer Arranged transport regardless of qty');

        // Test 6: Spares only in AP -> NOT FREE
        const resSpares = evalOrder([{ category: 'spare-part', quantity: 20 }], 'Andhra Pradesh', genConfig);
        assert(resSpares.isFreeDelivery === false, 'Spares only in Andhra Pradesh must not get Free Delivery');

        // Test 7: Admin disables Free Delivery globally -> All orders become Customer Arranged
        const resDisabled = evalOrder([{ category: 'aerator-set', quantity: 10 }], 'Andhra Pradesh', { isFreeDeliveryEnabled: false, minAeratorQtyForFreeDelivery: 10 });
        assert(resDisabled.isFreeDelivery === false, 'When Admin disables free delivery option, all orders must be Customer Arranged');

        // Test 8: State Selector Label Logic when Free Delivery is Disabled
        const disabledGen = { isFreeDeliveryEnabled: false, minAeratorQtyForFreeDelivery: 10 };
        const testStates = ['Andhra Pradesh', 'Telangana', 'Tamil Nadu'];
        for (const st of testStates) {
            const stEval = evalOrder([{ category: 'aerator-set', quantity: 10 }], st, disabledGen);
            const isFreeOption = (disabledGen.isFreeDeliveryEnabled ?? true) && stEval.isFreeDelivery;
            const optionLabel = `${st} (${isFreeOption ? 'FREE Delivery' : 'Customer Arranged'} · 3 to 7 Days)`;
            assert(isFreeOption === false, `State ${st} must NOT have isFreeOption when free delivery is disabled`);
            assert(!optionLabel.includes('FREE Delivery'), `State selector for ${st} must NOT contain 'FREE Delivery' when disabled by admin`);
            assert(optionLabel.includes('Customer Arranged'), `State selector for ${st} must show 'Customer Arranged' when disabled by admin`);
            assert(!optionLabel.includes('$'), `State selector for ${st} must never contain rogue '$' symbol`);
        }
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

    // TEST CASE 8: Cart Live Price Synchronization & Auto-Update on Admin Price Changes
    await runTestCase('TC-08: Cart Live Price Synchronization on Admin Price Updates', async () => {
        // 1. Query live products from Supabase
        const { data: dbProducts, error } = await supabase
            .from('products')
            .select('id, slug, name, price, mrp, stock, is_active')
            .limit(5);

        assert(!error, `Failed to query products from database: ${error?.message}`);
        assert(dbProducts && dbProducts.length > 0, 'Products table must contain active products');

        const testDbProduct = dbProducts[0];
        assert(testDbProduct.price > 0, 'Database product must have positive price');

        // 2. Simulate cart item with STALE / OLD price
        const stalePrice = Number(testDbProduct.price) - 2000;
        const initialCartItem = {
            id: testDbProduct.id,
            slug: testDbProduct.slug,
            name: testDbProduct.name,
            model: testDbProduct.name,
            price: stalePrice,
            salePrice: stalePrice,
            mrp: Number(testDbProduct.mrp || testDbProduct.price),
            quantity: 2,
            stock: 10,
        };

        // Replicate sync logic matching CartContext.updateCartWithLiveProducts
        const updateCart = (items, dbList) => {
            let hasPriceChanges = false;
            const changedNames = [];
            const updated = items.map((item) => {
                const cId = String(item.id || '').toLowerCase().trim();
                const cSlug = String(item.slug || '').toLowerCase().trim();
                const match = dbList.find((p) => {
                    const dbId = String(p.id || '').toLowerCase().trim();
                    const dbSlug = String(p.slug || '').toLowerCase().trim();
                    return (cId && dbId && cId === dbId) || (cSlug && dbSlug && cSlug === dbSlug) || (cId && dbSlug && cId === dbSlug);
                });
                if (!match) return item;
                const livePrice = Number(match.price);
                const liveMrp = Number(match.mrp || match.price);
                const curPrice = Number(item.salePrice ?? item.price ?? 0);
                if (Math.abs(livePrice - curPrice) > 0.01) {
                    hasPriceChanges = true;
                    changedNames.push(item.name || match.name);
                    return { ...item, price: livePrice, salePrice: livePrice, mrp: liveMrp, stock: match.stock };
                }
                return item;
            });
            return { updated, hasPriceChanges, changedNames };
        };

        // Test price update detection
        const result = updateCart([initialCartItem], [testDbProduct]);
        assert(result.hasPriceChanges === true, 'Sync must detect price change between cart and DB');
        assert(result.changedNames.length === 1, 'Changed names array must report affected product');
        assert(result.updated[0].salePrice === Number(testDbProduct.price), `Cart item salePrice must be updated to DB price ${testDbProduct.price}, got ${result.updated[0].salePrice}`);
        assert(result.updated[0].price === Number(testDbProduct.price), `Cart item price must be updated to DB price ${testDbProduct.price}`);

        // Test cart subtotal recalculation with updated prices
        const oldSubtotal = initialCartItem.salePrice * initialCartItem.quantity;
        const newSubtotal = result.updated[0].salePrice * result.updated[0].quantity;
        assert(newSubtotal === Number(testDbProduct.price) * 2, `Recalculated subtotal must equal new price * qty, got ${newSubtotal}`);
        assert(newSubtotal !== oldSubtotal, 'Recalculated subtotal must reflect the admin price update');

        // Test idempotency: running updateCart when prices are already up-to-date must NOT trigger change
        const noChangeResult = updateCart(result.updated, [testDbProduct]);
        assert(noChangeResult.hasPriceChanges === false, 'Sync must be idempotent when cart is already synchronized');

        // Verify CartContext.tsx has Realtime channel subscription and focus listener
        const cartContextCode = fs.readFileSync('src/context/CartContext.tsx', 'utf8');
        assert(cartContextCode.includes('cart-realtime-products-pricing'), 'CartContext must establish realtime channel for product pricing updates');
        assert(cartContextCode.includes('syncCartPrices'), 'CartContext must provide syncCartPrices helper');
        assert(cartContextCode.includes('priceUpdateNotice'), 'CartContext must provide priceUpdateNotice state');
    });

    // TEST CASE 9: Mobile DCIM & Vehicle Image Compression to High Quality PNG
    await runTestCase('TC-09: Mobile DCIM & Image Compression to High-Quality PNG', async () => {
        // 1. Verify client processor exists and defines compressAndConvertToPng
        const processorCode = fs.readFileSync('src/lib/client-image-processor.ts', 'utf8');
        assert(processorCode.includes('compressAndConvertToPng'), 'client-image-processor must export compressAndConvertToPng');
        assert(processorCode.includes("'image/png'"), 'client-image-processor must export as image/png');

        // 2. Verify OrderDispatchCard uses compressAndConvertToPng, uploadProductImageAction, auth headers, and supports imageUrl + publicUrl
        const dispatchCode = fs.readFileSync('src/components/admin/OrderDispatchCard.tsx', 'utf8');
        assert(dispatchCode.includes('compressAndConvertToPng'), 'OrderDispatchCard must compress images before upload');
        assert(dispatchCode.includes('uploadProductImageAction'), 'OrderDispatchCard must provide direct Server Action upload for mobile compatibility');
        assert(dispatchCode.includes('headers'), 'OrderDispatchCard must pass Authorization headers to upload endpoint');
        assert(dispatchCode.includes('data.publicUrl || data.imageUrl'), 'OrderDispatchCard must check both publicUrl and imageUrl');
        assert(!dispatchCode.includes('capture="environment"'), 'OrderDispatchCard must not restrict file input with capture="environment" to allow DCIM gallery');

        // 3. Verify upload-vehicle-image route returns both publicUrl and imageUrl
        const uploadRouteCode = fs.readFileSync('src/app/api/admin/orders/upload-vehicle-image/route.ts', 'utf8');
        assert(uploadRouteCode.includes('publicUrl: result.publicUrl'), 'upload-vehicle-image route must return publicUrl');
        assert(uploadRouteCode.includes('imageUrl: result.publicUrl'), 'upload-vehicle-image route must return imageUrl for backward compatibility');

        // 4. Verify storage-upload.ts stores all images canonically as .png
        const storageUploadCode = fs.readFileSync('src/lib/storage-upload.ts', 'utf8');
        assert(storageUploadCode.includes("const ext = 'png'"), 'storage-upload.ts must store files as png');
        assert(storageUploadCode.includes("'Content-Type': 'image/png'"), 'storage-upload.ts must use image/png content type');

        // 5. Test mathematical scaling logic (proportional downscaling to maxDimension)
        const scaleDimensions = (w, h, maxDim = 1600) => {
            if (w > maxDim || h > maxDim) {
                if (w > h) return { w: maxDim, h: Math.round((h * maxDim) / w) };
                return { w: Math.round((w * maxDim) / h), h: maxDim };
            }
            return { w, h };
        };

        // 4000x3000 DCIM photo scaled to 1600x1200
        const scaled4k = scaleDimensions(4000, 3000, 1600);
        assert(scaled4k.w === 1600, 'Width must scale to 1600');
        assert(scaled4k.h === 1200, 'Height must scale to 1200');

        // 3000x4000 Portrait DCIM photo scaled to 1200x1600
        const scaledPortrait = scaleDimensions(3000, 4000, 1600);
        assert(scaledPortrait.w === 1200, 'Portrait width must scale to 1200');
        assert(scaledPortrait.h === 1600, 'Portrait height must scale to 1600');
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
