import { PrismaClient } from '@prisma/client';
import { getOrCreateWallet, creditWallet, debitWallet, adjustBalance, distributeMultiLevelCommission, recordCommission } from '../src/lib/wallet/service';

const prisma = new PrismaClient();

async function runValidation() {
  console.log('=== GMA FINANCIAL AUDIT RUNTIME TEST SYSTEM ===\n');

  // Clean up any test users and their financial events
  const testEmails = ['fin_test_buyer@gma.test', 'fin_test_sponsor@gma.test', 'fin_test_grand@gma.test'];
  const existingTestUsers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true },
  });
  const testUserIds = existingTestUsers.map((u) => u.id);
  if (testUserIds.length > 0) {
    await prisma.financialEvent.deleteMany({
      where: { userId: { in: testUserIds } },
    });
  }
  await prisma.financialEvent.deleteMany({
    where: { eventId: 'test_order_100_buyer' },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });
  await prisma.financialEvent.deleteMany({
    where: {
      OR: [
        { eventId: { startsWith: 'test_order_100' } },
        { eventId: { startsWith: 'self_ref_check' } },
        { eventId: { startsWith: 'ref:order_' } }
      ]
    }
  });

  // 1. Create a chain of test users: grand -> sponsor -> buyer
  const grand = await prisma.user.create({
    data: {
      name: 'Grand Sponsor',
      email: 'fin_test_grand@gma.test',
      role: 'MEMBER',
      status: 'ACTIVE',
      path: 'root/grand_id', // placeholder, will update
      depth: 0,
    },
  });

  const sponsor = await prisma.user.create({
    data: {
      name: 'Sponsor',
      email: 'fin_test_sponsor@gma.test',
      role: 'MEMBER',
      status: 'ACTIVE',
      sponsorId: grand.id,
      path: `root/${grand.id}`,
      depth: 1,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      name: 'Buyer',
      email: 'fin_test_buyer@gma.test',
      role: 'MEMBER',
      status: 'ACTIVE',
      sponsorId: sponsor.id,
      path: `root/${grand.id}/${sponsor.id}`,
      depth: 2,
    },
  });

  // Update grand's path correctly
  await prisma.user.update({
    where: { id: grand.id },
    data: { path: `root/${grand.id}` },
  });
  // Update sponsor's path correctly
  await prisma.user.update({
    where: { id: sponsor.id },
    data: { path: `root/${grand.id}/${sponsor.id}` },
  });
  // Update buyer's path correctly
  await prisma.user.update({
    where: { id: buyer.id },
    data: { path: `root/${grand.id}/${sponsor.id}/${buyer.id}` },
  });

  console.log('1. User sponsor path structures successfully created.');

  // Create wallets
  const grandWallet = await getOrCreateWallet(grand.id);
  const sponsorWallet = await getOrCreateWallet(sponsor.id);
  const buyerWallet = await getOrCreateWallet(buyer.id);

  console.log('2. Wallets successfully retrieved/created.');

  // ==========================================
  // TEST CASE A: EventId Uniqueness & Idempotency Gate
  // ==========================================
  console.log('\n--- TEST CASE A: EventId Idempotency Gate ---');
  const eventId = `test_order_100_buyer`;

  // First credit execution
  const txn1 = await prisma.$transaction(async (tx) => {
    return creditWallet(tx, {
      walletId: buyerWallet.id,
      amount: 100,
      type: 'DEPOSIT',
      description: 'Test deposit 1',
      reference: eventId,
    });
  }, { timeout: 30000 });

  const walletAfterTx1 = await prisma.wallet.findUnique({ where: { id: buyerWallet.id } });
  console.log(`  First execution: Credit 100. New balance = ${walletAfterTx1?.balance}`);
  if (walletAfterTx1?.balance !== 100) {
    throw new Error('Test Case A Failed: Initial balance should be 100');
  }

  // Second execution of the exact same eventId
  const txn2 = await prisma.$transaction(async (tx) => {
    return creditWallet(tx, {
      walletId: buyerWallet.id,
      amount: 100,
      type: 'DEPOSIT',
      description: 'Test deposit 2 (duplicate)',
      reference: eventId,
    });
  }, { timeout: 30000 });

  const walletAfterTx2 = await prisma.wallet.findUnique({ where: { id: buyerWallet.id } });
  console.log(`  Second execution: Credit 100. New balance = ${walletAfterTx2?.balance}`);
  if (walletAfterTx2?.balance !== 100) {
    throw new Error('Test Case A Failed: Idempotency Gate did not block duplicate transaction!');
  }
  console.log('  ✔ PASS: Idempotency Gate blocked duplicate eventId.');

  // ==========================================
  // TEST CASE B: Self-Commission Prevention
  // ==========================================
  console.log('\n--- TEST CASE B: Self-Commission Prevention ---');
  try {
    await prisma.$transaction(async (tx) => {
      return recordCommission(tx, {
        userId: buyer.id,
        amount: 20,
        commissionType: 'REFERRAL_BONUS',
        description: 'Self commission check',
        reference: `self_ref_check_${Date.now()}`,
        metadata: { buyerId: buyer.id },
      });
    }, { timeout: 30000 });
    throw new Error('Test Case B Failed: Allowed self-referral commission!');
  } catch (error: any) {
    if (error.message.includes('Self-referral commission payout is forbidden')) {
      console.log('  ✔ PASS: Successfully blocked self-commission payout.');
    } else {
      throw error;
    }
  }

  // ==========================================
  // TEST CASE C: Materialized Path Multi-Level Commission
  // ==========================================
  console.log('\n--- TEST CASE C: Materialized Path Upline Commission Payout ---');
  const orderId = `order_${Date.now()}`;
  const amountPerLevel = [50, 25]; // Level 1 = 50, Level 2 = 25

  const commTxns = await prisma.$transaction(async (tx) => {
    return distributeMultiLevelCommission(tx, {
      buyerId: buyer.id,
      amountPerLevel,
      orderId,
      description: 'Materialized path payout test',
    });
  }, { timeout: 30000 });

  console.log(`  Distributed payouts. Total transactions created: ${commTxns.length}`);
  if (commTxns.length !== 2) {
    throw new Error(`Test Case C Failed: Expected 2 payouts but got ${commTxns.length}`);
  }

  const updatedSponsorWallet = await prisma.wallet.findUnique({ where: { id: sponsorWallet.id } });
  const updatedGrandWallet = await prisma.wallet.findUnique({ where: { id: grandWallet.id } });

  console.log(`  Sponsor (Level 1) balance (Expected 50): ${updatedSponsorWallet?.balance}`);
  console.log(`  Grand Sponsor (Level 2) balance (Expected 25): ${updatedGrandWallet?.balance}`);

  if (updatedSponsorWallet?.balance !== 50 || updatedGrandWallet?.balance !== 25) {
    throw new Error('Test Case C Failed: Commission amounts did not match level definitions');
  }

  // Run commission distributor again on same order
  const duplicateCommTxns = await prisma.$transaction(async (tx) => {
    return distributeMultiLevelCommission(tx, {
      buyerId: buyer.id,
      amountPerLevel,
      orderId,
      description: 'Duplicate path payout test',
    });
  }, { timeout: 30000 });

  console.log(`  Redistributed. Duplicate transactions created: ${duplicateCommTxns.length}`);
  if (duplicateCommTxns.length !== 2) {
    throw new Error(`Test Case C Failed: Expected 2 return transactions for duplicate run`);
  }

  const reCheckedSponsorWallet = await prisma.wallet.findUnique({ where: { id: sponsorWallet.id } });
  const reCheckedGrandWallet = await prisma.wallet.findUnique({ where: { id: grandWallet.id } });

  console.log(`  Sponsor balance after duplicate (Expected 50): ${reCheckedSponsorWallet?.balance}`);
  console.log(`  Grand Sponsor balance after duplicate (Expected 25): ${reCheckedGrandWallet?.balance}`);

  if (reCheckedSponsorWallet?.balance !== 50 || reCheckedGrandWallet?.balance !== 25) {
    throw new Error('Test Case C Failed: Wallet balances changed on duplicate commission execution!');
  }
  console.log('  ✔ PASS: Multi-level commission successfully distributed and idempotent.');

  // Clean up
  const finalTestUsers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true },
  });
  const finalUserIds = finalTestUsers.map((u) => u.id);
  if (finalUserIds.length > 0) {
    await prisma.financialEvent.deleteMany({
      where: { userId: { in: finalUserIds } },
    });
  }
  await prisma.financialEvent.deleteMany({
    where: { eventId: 'test_order_100_buyer' },
  });
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });
  await prisma.financialEvent.deleteMany({
    where: {
      OR: [
        { eventId: { startsWith: 'test_order_100' } },
        { eventId: { startsWith: 'self_ref_check' } },
        { eventId: { startsWith: 'ref:order_' } }
      ]
    }
  });

  console.log('\n=== ALL GMA FINANCIAL CORE SANITY CHECKS PASSED ===\n');
}

runValidation()
  .catch((e) => {
    console.error('\n❌ VALIDATION SYSTEM DETECTED FAILURE:\n', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
