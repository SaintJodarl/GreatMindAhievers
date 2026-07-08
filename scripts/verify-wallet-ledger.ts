import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CREDIT_TYPES = [
  'CREDIT',
  'REFERRAL_BONUS',
  'PAIRING_BONUS',
  'LEADERSHIP_BONUS',
  'DEPOSIT',
  'ADJUSTMENT',
];
const DEBIT_TYPES = ['DEBIT', 'WITHDRAWAL', 'FEE'];

async function runCheckpoint() {
  console.log('=== WALLET RECONCILIATION CHECKPOINT ===');
  const users = await prisma.user.findMany({
    include: { wallet: true },
  });

  let mismatches = 0;

  for (const user of users) {
    if (!user.wallet) continue;

    // 1. Get legacy balance
    const legacyBalance = user.wallet.balance;

    // 2. Calculate pure ledger balance dynamically
    const credits = await prisma.walletTransaction.aggregate({
      where: {
        walletId: user.wallet.id,
        type: { in: CREDIT_TYPES },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const debits = await prisma.walletTransaction.aggregate({
      where: {
        walletId: user.wallet.id,
        type: { in: DEBIT_TYPES },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const totalCredits = credits._sum.amount ?? new Prisma.Decimal(0);
    const totalDebits = debits._sum.amount ?? new Prisma.Decimal(0);
    const ledgerBalance = totalCredits.minus(totalDebits);

    if (!legacyBalance.equals(ledgerBalance)) {
      console.error(
        `🚨 MISMATCH [User: ${user.id}]: Legacy=₦${legacyBalance} | Ledger=₦${ledgerBalance}`
      );
      mismatches++;
    }
  }

  if (mismatches > 0) {
    console.error(
      `\n❌ RECONCILIATION FAILED: ${mismatches} mismatches detected. DO NOT FLIP FLAG.`
    );
    process.exitCode = 1;
    return;
  } else {
    console.log(`\n✅ RECONCILIATION SUCCESSFUL. Safe to switch MLM_EVENT_MODE = true`);
  }
}

runCheckpoint()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
