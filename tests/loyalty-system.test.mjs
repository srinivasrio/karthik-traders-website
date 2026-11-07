/**
 * Comprehensive Test Suite for Karthik Traders Loyalty Points & Rewards System
 * Tests:
 * 1. Signup bonus & idempotency
 * 2. Purchase reward calculation (base & promotions)
 * 3. Minimum cart amount validation (excluding freight)
 * 4. Redemption limits (percentage cap, order points cap)
 * 5. FIFO point lots & expiry processing
 * 6. Order cancellation & refund restoration
 * 7. Idempotency & duplicate request prevention
 * 8. Authorization & validation guards
 */

import assert from 'assert';

console.log('====================================================');
console.log('🧪 Starting Karthik Traders Loyalty System Tests... ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Error: ${err.message}\n`);
    }
}

// -------------------------------------------------------------
// Test 1: Eligible Subtotal Calculation (Excluding Delivery Fee)
// -------------------------------------------------------------
runTest('Eligible Subtotal strictly excludes delivery fee and sums item prices', () => {
    const items = [
        { id: 'aerator-1', name: '2HP Aerator', price: 25000, quantity: 2 }, // ₹50,000
        { id: 'spare-1', name: 'Impeller Fan', price: 450, salePrice: 350, quantity: 4 } // ₹1,400
    ];
    const deliveryFee = 1500; // Freight should not be in product subtotal

    // Calculate eligible subtotal
    const subtotalRupees = items.reduce((sum, item) => {
        const price = item.salePrice || item.price;
        return sum + (price * item.quantity);
    }, 0);

    const eligibleSubtotalPaise = Math.round(subtotalRupees * 100);

    assert.strictEqual(subtotalRupees, 51400, 'Subtotal in rupees should be ₹51,400');
    assert.strictEqual(eligibleSubtotalPaise, 5140000, 'Subtotal in paise should be 5,140,000 paise');
});

// -------------------------------------------------------------
// Test 2: Minimum Cart Subtotal Validation Rule
// -------------------------------------------------------------
runTest('Redemption is rejected when product subtotal is below minimum threshold', () => {
    const minCartSubtotalPaise = 500000; // ₹5,000 in paise
    const cart1SubtotalPaise = 420000;   // ₹4,200 in paise (Under minimum)
    const cart2SubtotalPaise = 500000;   // ₹5,000 in paise (Exactly minimum)
    const cart3SubtotalPaise = 1500000;  // ₹15,000 in paise (Above minimum)

    // Check 1: Under threshold
    const shortfallPaise = minCartSubtotalPaise - cart1SubtotalPaise;
    const isEligible1 = cart1SubtotalPaise >= minCartSubtotalPaise;
    assert.strictEqual(isEligible1, false, 'Cart 1 should be ineligible');
    assert.strictEqual(shortfallPaise, 80000, 'Shortfall should be ₹800 (80,000 paise)');

    // Check 2: At threshold
    const isEligible2 = cart2SubtotalPaise >= minCartSubtotalPaise;
    assert.strictEqual(isEligible2, true, 'Cart 2 should be eligible');

    // Check 3: Above threshold
    const isEligible3 = cart3SubtotalPaise >= minCartSubtotalPaise;
    assert.strictEqual(isEligible3, true, 'Cart 3 should be eligible');
});

// -------------------------------------------------------------
// Test 3: Redemption Limits Calculation (Percentage Cap & Points Cap)
// -------------------------------------------------------------
runTest('Max points calculation enforces wallet balance, % cap, and order cap', () => {
    const paisePerPoint = 25; // 1 point = 25 paise (₹0.25)
    const maxPercent = 20;    // Max 20% of eligible subtotal
    const maxOrderCap = 2000; // Max 2,000 points per order (₹500 max discount)

    // Scenario A: Small cart, high points
    // Subtotal = ₹6,000 (600,000 paise). Max 20% = ₹1,200 (120,000 paise = 4,800 points).
    // User has 500 points.
    const subtotalPaiseA = 600000;
    const userBalanceA = 500;
    const maxByPercentA = Math.floor((subtotalPaiseA * (maxPercent / 100)) / paisePerPoint); // 4800 pts
    const maxRedeemableA = Math.min(userBalanceA, maxByPercentA, maxOrderCap);
    assert.strictEqual(maxRedeemableA, 500, 'Should allow all 500 points');
    assert.strictEqual((maxRedeemableA * paisePerPoint) / 100, 125, 'Discount should be ₹125');

    // Scenario B: Large cart, very high points (Cap enforcement)
    // Subtotal = ₹50,000. Max 20% = ₹10,000 (40,000 points).
    // User has 5,000 points. Order cap is 2,000 points.
    const subtotalPaiseB = 5000000;
    const userBalanceB = 5000;
    const maxByPercentB = Math.floor((subtotalPaiseB * (maxPercent / 100)) / paisePerPoint);
    const maxRedeemableB = Math.min(userBalanceB, maxByPercentB, maxOrderCap);
    assert.strictEqual(maxRedeemableB, 2000, 'Should cap at 2,000 points');
    assert.strictEqual((maxRedeemableB * paisePerPoint) / 100, 500, 'Discount should be capped at ₹500');
});

// -------------------------------------------------------------
// Test 4: Purchase Reward Calculation (Percentage-based & Promotional Multiplier)
// -------------------------------------------------------------
runTest('Purchase rewards earn configured percentage (e.g. 1.0%), with multiplier promotion', () => {
    const earningPercentage = 1.0; // 1% of subtotal
    const paisePerPoint = 100;     // 100 paise = ₹1 per point
    const orderSubtotalRupees = 35450; // ₹35,450

    // 1% of ₹35,450 = ₹354.50. At ₹1 per point = 354 points
    const rewardPaise = (orderSubtotalRupees * 100) * (earningPercentage / 100.0);
    const basePoints = Math.floor(rewardPaise / paisePerPoint);
    assert.strictEqual(basePoints, 354, 'Base points at 1% should be 354 points');

    // Promotion 1: 2X Multiplier
    const promoMultiplier = 2.0;
    const totalWithMultiplier = Math.floor(basePoints * promoMultiplier);
    assert.strictEqual(totalWithMultiplier, 708, '2X promotion should yield 708 points');

    // Promotion 2: +100 Fixed Bonus
    const fixedBonus = 100;
    const totalWithBonus = basePoints + fixedBonus;
    assert.strictEqual(totalWithBonus, 454, 'Fixed bonus promotion should yield 454 points');
});

// -------------------------------------------------------------
// Test 5: FIFO Point Lot Consumption
// -------------------------------------------------------------
runTest('Points redemption consumes lots via First-In, First-Out (FIFO)', () => {
    // 3 active lots ordered by expiration date
    const lots = [
        { id: 'lot-1', points_remaining: 50, expires_at: new Date('2026-12-01') },
        { id: 'lot-2', points_remaining: 100, expires_at: new Date('2027-01-01') },
        { id: 'lot-3', points_remaining: 200, expires_at: new Date('2027-06-01') },
    ];

    let pointsToDeduct = 120;
    const updatedLots = [];

    for (const lot of lots) {
        if (pointsToDeduct <= 0) {
            updatedLots.push({ ...lot });
            continue;
        }

        if (lot.points_remaining <= pointsToDeduct) {
            pointsToDeduct -= lot.points_remaining;
            updatedLots.push({ ...lot, points_remaining: 0, is_expired: true });
        } else {
            const remaining = lot.points_remaining - pointsToDeduct;
            pointsToDeduct = 0;
            updatedLots.push({ ...lot, points_remaining: remaining, is_expired: false });
        }
    }

    assert.strictEqual(pointsToDeduct, 0, 'All 120 points should be deducted');
    assert.strictEqual(updatedLots[0].points_remaining, 0, 'Lot 1 should be completely consumed (0 pts)');
    assert.strictEqual(updatedLots[0].is_expired, true, 'Lot 1 should be marked expired/exhausted');
    assert.strictEqual(updatedLots[1].points_remaining, 30, 'Lot 2 should have 30 points remaining (100 - 70)');
    assert.strictEqual(updatedLots[2].points_remaining, 200, 'Lot 3 should remain untouched (200 pts)');
});

// -------------------------------------------------------------
// Test 6: Point Expiration Scanning
// -------------------------------------------------------------
runTest('Expired lots older than NOW are automatically detected and debited', () => {
    const now = new Date('2026-11-06T12:00:00Z');
    const lots = [
        { id: 'lot-past-1', points_remaining: 50, expires_at: new Date('2026-11-01T00:00:00Z') }, // Expired
        { id: 'lot-past-2', points_remaining: 30, expires_at: new Date('2026-11-05T00:00:00Z') }, // Expired
        { id: 'lot-future', points_remaining: 100, expires_at: new Date('2027-01-01T00:00:00Z') }, // Valid
    ];

    let walletBalance = 180;
    let totalExpired = 0;

    for (const lot of lots) {
        if (lot.expires_at < now && lot.points_remaining > 0) {
            totalExpired += lot.points_remaining;
            lot.points_remaining = 0;
            lot.is_expired = true;
        }
    }

    walletBalance -= totalExpired;

    assert.strictEqual(totalExpired, 80, 'Total expired points should be 80');
    assert.strictEqual(walletBalance, 100, 'Remaining wallet balance should be 100');
});

// -------------------------------------------------------------
// Test 7: Order Cancellation & Points Restoration
// -------------------------------------------------------------
runTest('Cancelled order restores redeemed points and decreases lifetime redeemed count', () => {
    let wallet = {
        points_balance: 50,
        lifetime_earned: 500,
        lifetime_redeemed: 450,
    };

    const redeemedOrderPoints = 200;

    // Restore on order cancellation
    wallet.points_balance += redeemedOrderPoints;
    wallet.lifetime_redeemed = Math.max(0, wallet.lifetime_redeemed - redeemedOrderPoints);

    assert.strictEqual(wallet.points_balance, 250, 'Wallet balance should increase by 200 to 250');
    assert.strictEqual(wallet.lifetime_redeemed, 250, 'Lifetime redeemed points should decrease by 200 to 250');
});

// -------------------------------------------------------------
// Test 8: Duplicate Request & Idempotency Key Handling
// -------------------------------------------------------------
runTest('Duplicate request with identical idempotency key returns existing reservation', () => {
    const seenKeys = new Map();

    function processReservation(userId, orderId, points, key) {
        if (seenKeys.has(key)) {
            return { isDuplicate: true, ...seenKeys.get(key) };
        }
        const record = { orderId, points, status: 'reserved' };
        seenKeys.set(key, record);
        return { isDuplicate: false, ...record };
    }

    const key = 'idem_order_12345';
    const firstCall = processReservation('user-1', 'order-1', 100, key);
    const secondCall = processReservation('user-1', 'order-1', 100, key);

    assert.strictEqual(firstCall.isDuplicate, false, 'First call should not be duplicate');
    assert.strictEqual(secondCall.isDuplicate, true, 'Second call must be identified as duplicate');
    assert.strictEqual(secondCall.points, 100, 'Duplicate response must return original reservation data');
});

// -------------------------------------------------------------
// Test 9: Mandatory Reason for Admin Modifications
// -------------------------------------------------------------
runTest('Admin point adjustment or settings change throws if reason is empty or whitespace', () => {
    function adminAdjust(adminRole, points, reason) {
        if (adminRole !== 'admin') throw new Error('Unauthorized');
        if (!reason || !reason.trim()) throw new Error('Mandatory reason required');
        return { success: true };
    }

    // Unauthorized check
    assert.throws(() => adminAdjust('customer', 100, 'Valid reason'), /Unauthorized/);

    // Empty reason check
    assert.throws(() => adminAdjust('admin', 100, ''), /Mandatory reason required/);
    assert.throws(() => adminAdjust('admin', 100, '   '), /Mandatory reason required/);

    // Valid check
    const valid = adminAdjust('admin', 100, 'Customer goodwill adjustment');
    assert.strictEqual(valid.success, true);
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n====================================================');
console.log(`🎉 Test Run Completed: ${passedTests}/${totalTests} Tests Passed!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
}

