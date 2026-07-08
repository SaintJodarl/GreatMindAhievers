import { PrismaClient, Prisma } from '@prisma/client';
import {
  getOrCreateWallet,
  creditWallet,
  distributeMultiLevelCommission,
  recordCommission,
} from '../src/lib/wallet/service';

const prisma = new PrismaClient();

const FINANCIAL_TEST_EMAILS = [
  'fin_test_buyer@gma.test',
  'fin_test_sponsor@gma.test',
  'fin_test_grand@gma.test',
];
const TX_OPTIONS = { maxWait: 10000, timeout: 30000 };

async function cleanupKnownFinancialTestRecords() {
  const existingTestUsers = await prisma.user.findMany({
    where: { email: { in: FINANCIAL_TEST_EMAILS } },
    select: { id: true },
  });
  const testUserIds = existingTestUsers.map((u) => u.id);

  const wallets =
    testUserIds.length > 0
      ? await prisma.wallet.findMany({
          where: { userId: { in: testUserIds } },
          select: { id: true },
        })
      : [];
  const walletIds = wallets.map((wallet) => wallet.id);

  await prisma.$transaction(async (tx) => {
    await tx.financialEvent.deleteMany({
      where: {
        OR: [
          { eventId: 'test_order_100_buyer' },
          { eventId: { startsWith: 'self_ref_check' } },
          ...(testUserIds.length > 0 ? [{ userId: { in: testUserIds } }] : []),
        ],
      },
    });

    if (testUserIds.length === 0) return;

    await tx.outboxEvent.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.commissionLog.deleteMany({
      where: {
        OR: [{ userId: { in: testUserIds } }, { fromUserId: { in: testUserIds } }],
      },
    });

    if (walletIds.length > 0) {
      await tx.walletTransaction.deleteMany({
        where: {
          OR: [{ userId: { in: testUserIds } }, { walletId: { in: walletIds } }],
        },
      });
    }

    await tx.wallet.deleteMany({ where: { userId: { in: testUserIds } } });
    await tx.user.updateMany({
      where: { id: { in: testUserIds } },
      data: { sponsorId: null, placementId: null },
    });
    await tx.user.deleteMany({ where: { id: { in: testUserIds } } });
  }, TX_OPTIONS);
}

async function runValidation() {
  console.log('=== GMA FINANCIAL AUDIT RUNTIME TEST SYSTEM ===\n');

  // Clean up any test users and their financial events
  await cleanupKnownFinancialTestRecords();

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
  await prisma.$transaction(async (tx) => {
    return creditWallet(tx, {
      walletId: buyerWallet.id,
      amount: new Prisma.Decimal(100),
      type: 'DEPOSIT',
      description: 'Test deposit 1',
      reference: eventId,
    });
  }, TX_OPTIONS);

  const walletAfterTx1 = await prisma.wallet.findUnique({ where: { id: buyerWallet.id } });
  console.log(`  First execution: Credit 100. New balance = ${walletAfterTx1?.balance}`);
  if (!walletAfterTx1?.balance?.equals(new Prisma.Decimal(100))) {
    throw new Error('Test Case A Failed: Initial balance should be 100');
  }

  // Second execution of the exact same eventId
  await prisma.$transaction(async (tx) => {
    return creditWallet(tx, {
      walletId: buyerWallet.id,
      amount: new Prisma.Decimal(100),
      type: 'DEPOSIT',
      description: 'Test deposit 2 (duplicate)',
      reference: eventId,
    });
  }, TX_OPTIONS);

  const walletAfterTx2 = await prisma.wallet.findUnique({ where: { id: buyerWallet.id } });
  console.log(`  Second execution: Credit 100. New balance = ${walletAfterTx2?.balance}`);
  if (!walletAfterTx2?.balance?.equals(new Prisma.Decimal(100))) {
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
        amount: new Prisma.Decimal(20),
        commissionType: 'REFERRAL_BONUS',
        description: 'Self commission check',
        reference: `self_ref_check_${Date.now()}`,
        metadata: { buyerId: buyer.id },
      });
    }, TX_OPTIONS);
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
  }, TX_OPTIONS);

  console.log(`  Distributed payouts. Total transactions created: ${commTxns.length}`);
  if (commTxns.length !== 2) {
    throw new Error(`Test Case C Failed: Expected 2 payouts but got ${commTxns.length}`);
  }

  const updatedSponsorWallet = await prisma.wallet.findUnique({ where: { id: sponsorWallet.id } });
  const updatedGrandWallet = await prisma.wallet.findUnique({ where: { id: grandWallet.id } });

  console.log(`  Sponsor (Level 1) balance (Expected 50): ${updatedSponsorWallet?.balance}`);
  console.log(`  Grand Sponsor (Level 2) balance (Expected 25): ${updatedGrandWallet?.balance}`);

  if (
    !updatedSponsorWallet?.balance?.equals(new Prisma.Decimal(50)) ||
    !updatedGrandWallet?.balance?.equals(new Prisma.Decimal(25))
  ) {
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
  }, TX_OPTIONS);

  console.log(`  Redistributed. Duplicate transactions created: ${duplicateCommTxns.length}`);
  if (duplicateCommTxns.length !== 2) {
    throw new Error(`Test Case C Failed: Expected 2 return transactions for duplicate run`);
  }

  const reCheckedSponsorWallet = await prisma.wallet.findUnique({
    where: { id: sponsorWallet.id },
  });
  const reCheckedGrandWallet = await prisma.wallet.findUnique({ where: { id: grandWallet.id } });

  console.log(
    `  Sponsor balance after duplicate (Expected 50): ${reCheckedSponsorWallet?.balance}`
  );
  console.log(
    `  Grand Sponsor balance after duplicate (Expected 25): ${reCheckedGrandWallet?.balance}`
  );

  if (
    !reCheckedSponsorWallet?.balance?.equals(new Prisma.Decimal(50)) ||
    !reCheckedGrandWallet?.balance?.equals(new Prisma.Decimal(25))
  ) {
    throw new Error(
      'Test Case C Failed: Wallet balances changed on duplicate commission execution!'
    );
  }
  console.log('  ✔ PASS: Multi-level commission successfully distributed and idempotent.');
  console.log('\n=== ALL GMA FINANCIAL CORE SANITY CHECKS PASSED ===\n');
}

runValidation()
  .catch((e) => {
    console.error('\n❌ VALIDATION SYSTEM DETECTED FAILURE:\n', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanupKnownFinancialTestRecords().catch((cleanupError) => {
      console.error('Financial test cleanup failed:', cleanupError);
      process.exitCode = 1;
    });
    await prisma.$disconnect();
  });
