import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runCheckpoint() {
  console.log("=== WALLET RECONCILIATION CHECKPOINT ===");
  const users = await prisma.user.findMany({
    include: { wallet: true }
  });

  let mismatches = 0;

  for (const user of users) {
    if (!user.wallet) continue;

    // 1. Get legacy balance
    const legacyBalance = user.wallet.balance;

    // 2. Calculate pure ledger balance dynamically
    const credits = await prisma.walletTransaction.aggregate({
      where: { walletId: user.wallet.id, type: { in: ['CREDIT', 'COMMISSION'] }, status: 'COMPLETED' },
      _sum: { amount: true }
    });
    
    const debits = await prisma.walletTransaction.aggregate({
      where: { walletId: user.wallet.id, type: { in: ['DEBIT', 'WITHDRAWAL'] }, status: 'COMPLETED' },
      _sum: { amount: true }
    });

    const totalCredits = credits._sum.amount || 0;
    const totalDebits = debits._sum.amount || 0;
    const ledgerBalance = totalCredits - totalDebits;

    if (legacyBalance !== ledgerBalance) {
      console.error(`🚨 MISMATCH [User: ${user.id}]: Legacy=₦${legacyBalance} | Ledger=₦${ledgerBalance}`);
      mismatches++;
    }
  }

  if (mismatches > 0) {
    console.error(`\n❌ RECONCILIATION FAILED: ${mismatches} mismatches detected. DO NOT FLIP FLAG.`);
    process.exit(1);
  } else {
    console.log(`\n✅ RECONCILIATION SUCCESSFUL. Safe to switch MLM_EVENT_MODE = true`);
    process.exit(0);
  }
}

runCheckpoint()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
