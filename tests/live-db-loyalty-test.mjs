import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local if not already in process.env
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && fs.existsSync('.env.local')) {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log('====================================================');
console.log('🧪 Starting Live End-to-End Database Loyalty Tests');
console.log('Database URL:', supabaseUrl);
console.log('====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, fn) {
  try {
    process.stdout.write(`⏳ Testing: ${name}... `);
    await fn();
    console.log('✅ [PASS]');
    testsPassed++;
  } catch (err) {
    console.log(`❌ [FAIL]: ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  // Find or create test customer profile & admin profile
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, mobile, role')
    .eq('role', 'admin')
    .limit(1);

  if (!adminProfiles || adminProfiles.length === 0) {
    throw new Error('No admin profile found in database to test admin actions.');
  }
  const adminId = adminProfiles[0].id;
  console.log(`Using Admin Profile ID: ${adminId} (${adminProfiles[0].mobile})`);

  // Create a brand new unique test customer profile for this run
  const testPhoneSuffix = Date.now().toString().slice(-6);
  const testMobile = `+919999${testPhoneSuffix}`;
  const testEmail = `test${testPhoneSuffix}@karthiktraders.com`;
  let testUserId;

  const { data: newUser, error: uErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    email_confirm: true,
    password: 'TestPassword123!',
    user_metadata: {
      mobile: testMobile,
      full_name: 'Loyalty Automated Test User',
    },
  });
  if (uErr) throw new Error('Could not create test auth user: ' + uErr.message);
  testUserId = newUser.user.id;

  // Ensure profile exists (in case trigger was delayed)
  await supabase.from('profiles').upsert({
    id: testUserId,
    mobile: testMobile,
    full_name: 'Loyalty Automated Test User',
    role: 'customer',
  });
  console.log(`Using Test Customer ID: ${testUserId} (${testMobile})\n`);

  // 1. Test loyalty_settings table & reading settings
  await runTest('1. Fetch loyalty_settings and verify default configuration', async () => {
    const { data, error } = await supabase.from('loyalty_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    if (!data || data.signup_bonus_points !== 50) {
      throw new Error(`Unexpected settings: ${JSON.stringify(data)}`);
    }
  });

  // 2. Test loyalty_init_wallet & signup bonus
  await runTest('2. Automatically award signup bonus on signup & prevent duplicate bonuses', async () => {
    // Verify wallet was created with 50 points by signup trigger
    const { data: wallet } = await supabase.from('loyalty_wallets').select('*').eq('user_id', testUserId).single();
    if (!wallet || wallet.points_balance !== 50) {
      throw new Error(`Expected wallet points_balance=50 from signup trigger, got ${wallet?.points_balance}`);
    }

    // Verify calling loyalty_init_wallet a second time does not duplicate points
    const { data, error } = await supabase.rpc('loyalty_init_wallet', { p_user_id: testUserId });
    if (error) throw error;
    if (data.signup_bonus_awarded === true) {
      throw new Error(`Duplicate signup bonus should not be awarded: ${JSON.stringify(data)}`);
    }

    // Verify transaction recorded in ledger
    const { data: tx } = await supabase.from('loyalty_transactions').select('*').eq('user_id', testUserId);
    if (!tx || tx.length === 0 || tx[0].transaction_type !== 'signup_bonus') {
      throw new Error('Signup bonus transaction was not logged in ledger');
    }
  });

  // 3. Test loyalty_get_wallet_summary
  await runTest('3. Fetch customer wallet summary (loyalty_get_wallet_summary)', async () => {
    const { data, error } = await supabase.rpc('loyalty_get_wallet_summary', { p_user_id: testUserId });
    if (error) throw error;
    if (data.points_balance !== 50 || data.rupee_value !== 12.5) {
      throw new Error(`Unexpected summary: ${JSON.stringify(data)}`);
    }
  });

  // 4. Test loyalty_admin_adjust_points (Credit)
  await runTest('4. Admin manually credits points with mandatory reason', async () => {
    const { data, error } = await supabase.rpc('loyalty_admin_adjust_points', {
      p_admin_id: adminId,
      p_user_id: testUserId,
      p_points: 100,
      p_reason: 'Automated test goodwill credit',
    });
    if (error) throw error;
    if (data.new_balance !== 150) {
      throw new Error(`Expected balance 150 after +100 credit, got: ${data.new_balance}`);
    }

    // Verify audit entry
    const { data: audit } = await supabase
      .from('loyalty_admin_audit')
      .select('*')
      .eq('target_user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!audit || audit.length === 0 || audit[0].points_changed !== 100) {
      throw new Error('Audit record was not created properly');
    }
  });

  // 5. Test loyalty_admin_adjust_points (Debit)
  await runTest('5. Admin manually debits points with mandatory reason', async () => {
    const { data, error } = await supabase.rpc('loyalty_admin_adjust_points', {
      p_admin_id: adminId,
      p_user_id: testUserId,
      p_points: -30,
      p_reason: 'Automated test correction debit',
    });
    if (error) throw error;
    if (data.new_balance !== 120) {
      throw new Error(`Expected balance 120 after -30 debit, got: ${data.new_balance}`);
    }
  });

  // 6. Test loyalty_admin_adjust_points validation & bounds
  await runTest('6. Admin adjustment throws if reason is empty or debit exceeds balance', async () => {
    // Empty reason
    let emptyReasonThrew = false;
    try {
      await supabase.rpc('loyalty_admin_adjust_points', {
        p_admin_id: adminId,
        p_user_id: testUserId,
        p_points: 10,
        p_reason: '   ',
      });
    } catch (e) {
      emptyReasonThrew = true;
    }
    const { error: emptyErr } = await supabase.rpc('loyalty_admin_adjust_points', {
      p_admin_id: adminId,
      p_user_id: testUserId,
      p_points: 10,
      p_reason: '   ',
    });
    if (!emptyErr && !emptyReasonThrew) throw new Error('Expected failure on empty reason');

    // Debit more than balance (balance is 120, try -200)
    const { error: overDebitErr } = await supabase.rpc('loyalty_admin_adjust_points', {
      p_admin_id: adminId,
      p_user_id: testUserId,
      p_points: -500,
      p_reason: 'Should fail',
    });
    if (!overDebitErr) throw new Error('Expected failure on over-debit');
  });

  // 7. Test loyalty_preview_redemption
  await runTest('7. Preview redemption eligibility (loyalty_preview_redemption)', async () => {
    // Under minimum cart (₹2,000 when min is ₹5,000 = 500,000 paise)
    const { data: underMin } = await supabase.rpc('loyalty_preview_redemption', {
      p_user_id: testUserId,
      p_eligible_subtotal_paise: 200000,
      p_points_requested: null,
    });
    if (underMin.is_eligible !== false || !underMin.shortfall_rupees) {
      throw new Error(`Expected under-min to be ineligible: ${JSON.stringify(underMin)}`);
    }

    // Above minimum cart (₹10,000 = 1,000,000 paise)
    const { data: eligible } = await supabase.rpc('loyalty_preview_redemption', {
      p_user_id: testUserId,
      p_eligible_subtotal_paise: 1000000,
      p_points_requested: null,
    });
    if (eligible.is_eligible !== true || eligible.available_points !== 120) {
      throw new Error(`Expected eligible preview: ${JSON.stringify(eligible)}`);
    }
  });

  // 8. Test loyalty_reserve_points & idempotency
  let testOrderId = '00000000-0000-0000-0000-000000000099';
  await runTest('8. Reserve points during checkout & verify idempotency', async () => {
    // Ensure test order row exists in orders table
    await supabase.from('orders').upsert({
      id: testOrderId,
      user_id: testUserId,
      status: 'pending',
      total_amount: 10000,
      customer_name: 'Loyalty Test Customer',
      customer_mobile: testMobile,
    });

    // Clean up any old test redemptions
    await supabase.from('loyalty_redemptions').delete().eq('order_id', testOrderId);

    const idempotencyKey = `live_test_${Date.now()}`;
    const { data: res1, error: e1 } = await supabase.rpc('loyalty_reserve_points', {
      p_user_id: testUserId,
      p_order_id: testOrderId,
      p_points_to_redeem: 100,
      p_eligible_subtotal_paise: 1000000,
      p_idempotency_key: idempotencyKey,
    });
    if (e1) throw e1;
    if (!res1.success || res1.points_redeemed !== 100 || res1.remaining_balance !== 20) {
      throw new Error(`Unexpected reservation: ${JSON.stringify(res1)}`);
    }

    // Duplicate call with same idempotency key must return existing reservation
    const { data: res2, error: e2 } = await supabase.rpc('loyalty_reserve_points', {
      p_user_id: testUserId,
      p_order_id: testOrderId,
      p_points_to_redeem: 100,
      p_eligible_subtotal_paise: 1000000,
      p_idempotency_key: idempotencyKey,
    });
    if (e2) throw e2;
    if (!res2.is_duplicate || res2.points_redeemed !== 100) {
      throw new Error(`Idempotency failure: ${JSON.stringify(res2)}`);
    }
  });

  // 9. Test loyalty_release_points (Checkout Failure / Cancellation)
  await runTest('9. Release reserved points when order fails or cancelled', async () => {
    const { data, error } = await supabase.rpc('loyalty_release_points', {
      p_order_id: testOrderId,
      p_reason: 'Automated test release',
    });
    if (error) throw error;
    if (!data.success || data.points_restored !== 100) {
      throw new Error(`Expected 100 points restored, got: ${JSON.stringify(data)}`);
    }

    // Verify balance is restored back to 120
    const { data: wallet } = await supabase.from('loyalty_wallets').select('*').eq('user_id', testUserId).single();
    if (wallet.points_balance !== 120) {
      throw new Error(`Expected restored balance=120, got ${wallet.points_balance}`);
    }
  });

  // 10. Test Create Test Order & Confirm Redemption
  let testOrder2Id = '00000000-0000-0000-0000-000000000098';
  await runTest('10. Reserve, Confirm Redemption, and Complete Order', async () => {
    // 1. Create a dummy order in orders table
    const { error: oErr } = await supabase.from('orders').upsert({
      id: testOrder2Id,
      user_id: testUserId,
      status: 'pending',
      total_amount: 10000,
      customer_name: 'Loyalty Test Customer',
      customer_mobile: testMobile,
    });
    if (oErr) throw oErr;

    // 2. Reserve 50 points
    const { data: resData, error: rErr } = await supabase.rpc('loyalty_reserve_points', {
      p_user_id: testUserId,
      p_order_id: testOrder2Id,
      p_points_to_redeem: 50,
      p_eligible_subtotal_paise: 1000000,
      p_idempotency_key: `test_order_confirm_${Date.now()}`,
    });
    if (rErr) throw rErr;

    // 3. Confirm redemption
    const { data: confData, error: cErr } = await supabase.rpc('loyalty_confirm_redemption', {
      p_order_id: testOrder2Id,
    });
    if (cErr) throw cErr;
    if (!confData.success || confData.status !== 'applied') {
      throw new Error(`Expected applied status, got: ${JSON.stringify(confData)}`);
    }

    // Verify redemption record is marked applied
    const { data: red } = await supabase.from('loyalty_redemptions').select('*').eq('order_id', testOrder2Id).single();
    if (red.status !== 'applied') throw new Error(`Redemption status should be 'applied', got ${red.status}`);
  });

  // 11. Test loyalty_award_purchase_points
  await runTest('11. Award purchase reward points on order completion', async () => {
    // Mark order as delivered
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', testOrder2Id);

    const { data, error } = await supabase.rpc('loyalty_award_purchase_points', {
      p_order_id: testOrder2Id,
    });
    if (error) throw error;
    // Order total is ₹10,000, earning rate is 1% = ₹100 = 400 points at 25 paise/pt
    if (!data.success || data.points_awarded <= 0) {
      throw new Error(`Expected positive points awarded, got: ${JSON.stringify(data)}`);
    }
    console.log(`(Awarded: ${data.points_awarded} points) `);
  });

  // 12. Test loyalty_process_expired_points
  await runTest('12. Automatic expired points detection (loyalty_process_expired_points)', async () => {
    // Intentionally create an expired lot
    const { data: wallet } = await supabase.from('loyalty_wallets').select('*').eq('user_id', testUserId).single();
    await supabase.from('loyalty_point_lots').insert({
      wallet_id: wallet.id,
      points_initial: 25,
      points_remaining: 25,
      expires_at: new Date(Date.now() - 86400000).toISOString(), // Expired yesterday
      is_expired: false,
    });

    const { data, error } = await supabase.rpc('loyalty_process_expired_points');
    if (error) throw error;
    if (!data.success || data.total_points_expired < 25) {
      throw new Error(`Expected at least 25 points expired, got: ${JSON.stringify(data)}`);
    }
  });

  // Cleanup test order & records
  await supabase.from('loyalty_point_lots').delete().eq('wallet_id', (await supabase.from('loyalty_wallets').select('id').eq('user_id', testUserId).single()).data?.id);
  await supabase.from('loyalty_transactions').delete().eq('user_id', testUserId);
  await supabase.from('loyalty_redemptions').delete().eq('user_id', testUserId);
  await supabase.from('loyalty_admin_audit').delete().eq('target_user_id', testUserId);
  await supabase.from('orders').delete().in('id', [testOrderId, testOrder2Id]);
  await supabase.from('loyalty_wallets').delete().eq('user_id', testUserId);
  await supabase.from('profiles').delete().eq('id', testUserId);
  await supabase.auth.admin.deleteUser(testUserId);

  console.log('\n====================================================');
  console.log(`🎉 Live Database Test Summary: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
