import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET = {
  name: 'Adebayo Okafor',
  email: 'adebayo.okafor@gma.network',
  role: 'MEMBER',
  status: 'INACTIVE',
  referralCode: 'GMA-MBR1',
} as const;

const PROTECTED_SUPER_ADMINS = [
  {
    name: 'Blessing Makata',
    email: 'makatablessing2026@gmail.com',
    referralCode: 'OWNER-SUPER-001',
  },
  {
    name: 'Great-Mind Achievers',
    email: 'gmanetworkng@gmail.com',
    referralCode: 'GMA-SUPER-001',
  },
  {
    name: 'Stellar Media',
    email: 'stellarmediang@gmail.com',
    referralCode: null,
  },
] as const;

const execute = process.argv.includes('--execute');

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  referralCode: true,
  adminRole: true,
} satisfies Prisma.UserSelect;

type DbClient = PrismaClient | Prisma.TransactionClient;
type TargetUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;
type WalletRow = Awaited<ReturnType<typeof getWalletRows>>[number];

type RelatedCount = {
  record: string;
  count: number;
  allowedToDelete: boolean;
};

function printHeader(title: string) {
  console.log('');
  console.log(title);
  console.log('-'.repeat(title.length));
}

function assertTargetUser(user: TargetUser | null): asserts user is TargetUser {
  if (!user) {
    throw new Error(`Target user was not found by email ${TARGET.email}. Nothing will be deleted.`);
  }

  const protectedEmails = new Set<string>(PROTECTED_SUPER_ADMINS.map((admin) => admin.email));
  if (user.email && protectedEmails.has(user.email)) {
    throw new Error(
      'Refusing to delete because the matched user is a protected Super Admin email.'
    );
  }

  if (user.role === 'SUPER_ADMIN' || user.adminRole === 'SUPER_ADMIN') {
    throw new Error('Refusing to delete because the matched user is a Super Admin.');
  }

  const mismatches = [
    ['name', user.name, TARGET.name],
    ['email', user.email, TARGET.email],
    ['role', user.role, TARGET.role],
    ['status', user.status, TARGET.status],
    ['referralCode', user.referralCode, TARGET.referralCode],
  ].filter(([, actual, expected]) => actual !== expected);

  if (mismatches.length > 0) {
    const details = mismatches
      .map(([field, actual, expected]) => `${field}: expected ${expected}, got ${actual}`)
      .join('; ');
    throw new Error(
      `Refusing to delete because the matched user is not exactly Adebayo. ${details}`
    );
  }
}

async function assertProtectedSuperAdmins(db: DbClient) {
  const protectedAdmins = await db.user.findMany({
    where: {
      email: {
        in: PROTECTED_SUPER_ADMINS.map((admin) => admin.email),
      },
    },
    select: userSelect,
    orderBy: { email: 'asc' },
  });

  for (const expected of PROTECTED_SUPER_ADMINS) {
    const admin = protectedAdmins.find((row) => row.email === expected.email);

    if (!admin) {
      throw new Error(`Protected Super Admin missing: ${expected.email}`);
    }

    if (admin.role !== 'SUPER_ADMIN') {
      throw new Error(`Protected account ${expected.email} is not role SUPER_ADMIN.`);
    }

    if (expected.referralCode && admin.referralCode !== expected.referralCode) {
      throw new Error(
        `Protected account ${expected.email} referral code changed: expected ${expected.referralCode}, got ${admin.referralCode}`
      );
    }
  }

  return protectedAdmins;
}

async function getWalletRows(db: DbClient, userId: string) {
  return db.wallet.findMany({
    where: { userId },
    select: {
      id: true,
      userId: true,
      balance: true,
    },
    orderBy: { id: 'asc' },
  });
}

async function getRelatedCounts(db: DbClient, user: TargetUser, wallets: WalletRow[]) {
  const walletIds = wallets.map((wallet) => wallet.id);
  const walletTransactionWhere =
    walletIds.length > 0
      ? { OR: [{ userId: user.id }, { walletId: { in: walletIds } }] }
      : { userId: user.id };

  const [
    memberProfiles,
    kycSubmissions,
    walletTransactions,
    binaryTreeRows,
    binaryTreeLinks,
    binaryTreePathReferences,
    sponsoredUsers,
    placedUsers,
    userPathReferences,
    commissionLogs,
    rewards,
    rewardClaims,
    stageProgress,
    withdrawals,
    activationCodes,
    adminCodes,
    auditLogs,
    financialEvents,
    outboxEvents,
    passwordResetRequests,
    tickets,
    ticketMessages,
    refreshTokens,
    activationAttempts,
    loginAttempts,
  ] = await Promise.all([
    db.memberProfile.count({ where: { userId: user.id } }),
    db.kYCSubmission.count({ where: { userId: user.id } }),
    db.walletTransaction.count({ where: walletTransactionWhere }),
    db.binaryTree.count({ where: { userId: user.id } }),
    db.binaryTree.count({
      where: {
        OR: [{ parentId: user.id }, { leftChildId: user.id }, { rightChildId: user.id }],
      },
    }),
    db.binaryTree.count({ where: { path: { contains: user.id } } }),
    db.user.count({ where: { sponsorId: user.id } }),
    db.user.count({ where: { placementId: user.id } }),
    db.user.count({
      where: {
        id: { not: user.id },
        path: { contains: user.id },
      },
    }),
    db.commissionLog.count({
      where: { OR: [{ userId: user.id }, { fromUserId: user.id }] },
    }),
    db.reward.count({ where: { userId: user.id } }),
    db.rewardClaim.count({ where: { userId: user.id } }),
    db.stageProgress.count({ where: { userId: user.id } }),
    db.withdrawal.count({ where: { userId: user.id } }),
    db.activationCode.count({
      where: { OR: [{ redeemedBy: user.id }, { createdBy: user.id }] },
    }),
    db.adminCode.count({
      where: { OR: [{ regUserId: user.id }, { kycUserId: user.id }] },
    }),
    db.auditLog.count({
      where: {
        OR: [
          { adminId: user.id },
          { targetId: user.id },
          { details: { contains: user.id } },
          { details: { contains: TARGET.email } },
          { details: { contains: TARGET.referralCode } },
        ],
      },
    }),
    db.financialEvent.count({ where: { userId: user.id } }),
    db.outboxEvent.count({ where: { userId: user.id } }),
    db.passwordResetRequest.count({
      where: { OR: [{ userId: user.id }, { email: TARGET.email }] },
    }),
    db.ticket.count({ where: { userId: user.id } }),
    db.ticketMessage.count({ where: { senderId: user.id } }),
    db.refreshToken.count({ where: { userId: user.id } }),
    db.activationAttempt.count({ where: { userId: user.id } }),
    db.loginAttempt.count({ where: { email: TARGET.email } }),
  ]);

  return [
    { record: 'wallet rows', count: wallets.length, allowedToDelete: wallets.length <= 1 },
    { record: 'member profile rows', count: memberProfiles, allowedToDelete: false },
    { record: 'KYC submission rows', count: kycSubmissions, allowedToDelete: false },
    { record: 'wallet transaction rows', count: walletTransactions, allowedToDelete: false },
    { record: 'binary tree own rows', count: binaryTreeRows, allowedToDelete: false },
    { record: 'binary tree parent/child links', count: binaryTreeLinks, allowedToDelete: false },
    {
      record: 'binary tree path references',
      count: binaryTreePathReferences,
      allowedToDelete: false,
    },
    { record: 'sponsored users', count: sponsoredUsers, allowedToDelete: false },
    { record: 'placed users', count: placedUsers, allowedToDelete: false },
    { record: 'user path references', count: userPathReferences, allowedToDelete: false },
    { record: 'commission log rows', count: commissionLogs, allowedToDelete: false },
    { record: 'reward rows', count: rewards, allowedToDelete: false },
    { record: 'reward claim rows', count: rewardClaims, allowedToDelete: false },
    { record: 'stage progress rows', count: stageProgress, allowedToDelete: false },
    { record: 'withdrawal rows', count: withdrawals, allowedToDelete: false },
    { record: 'activation code rows', count: activationCodes, allowedToDelete: false },
    { record: 'admin code rows', count: adminCodes, allowedToDelete: false },
    { record: 'audit log rows', count: auditLogs, allowedToDelete: false },
    { record: 'financial event rows', count: financialEvents, allowedToDelete: false },
    { record: 'outbox event rows', count: outboxEvents, allowedToDelete: false },
    { record: 'password reset request rows', count: passwordResetRequests, allowedToDelete: false },
    { record: 'ticket rows', count: tickets, allowedToDelete: false },
    { record: 'ticket message rows', count: ticketMessages, allowedToDelete: false },
    { record: 'refresh token rows', count: refreshTokens, allowedToDelete: false },
    { record: 'activation attempt rows', count: activationAttempts, allowedToDelete: false },
    { record: 'login attempt rows', count: loginAttempts, allowedToDelete: false },
  ] satisfies RelatedCount[];
}

function assertRelatedCounts(counts: RelatedCount[]) {
  const blockers = counts.filter((item) => {
    if (item.record === 'wallet rows') {
      return item.count > 1;
    }

    return item.count > 0;
  });

  if (blockers.length > 0) {
    const details = blockers.map((item) => `${item.record}: ${item.count}`).join('; ');
    throw new Error(`Refusing to delete because unexpected related records were found. ${details}`);
  }
}

function printPlan(user: TargetUser, wallets: WalletRow[], counts: RelatedCount[]) {
  printHeader(execute ? 'EXECUTE MODE PRECHECK' : 'DRY RUN');
  console.log('Matched target user exactly:');
  console.table([
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      referralCode: user.referralCode,
    },
  ]);

  printHeader('Related Record Counts');
  console.table(
    counts.map((item) => ({
      record: item.record,
      count: item.count,
      allowedToDelete: item.allowedToDelete ? 'yes' : 'no',
    }))
  );

  printHeader('Will Delete Exactly');
  if (wallets.length === 0) {
    console.log('- wallet rows: none');
  } else {
    for (const wallet of wallets) {
      console.log(
        `- wallet row: id=${wallet.id}, userId=${wallet.userId}, balance=${wallet.balance.toString()}`
      );
    }
  }
  console.log(`- user row: id=${user.id}, email=${user.email}, role=${user.role}`);

  if (!execute) {
    console.log('');
    console.log('Dry run only. Re-run with --execute to delete exactly the rows listed above.');
  }
}

async function collectAndAssertState(db: DbClient) {
  const protectedAdmins = await assertProtectedSuperAdmins(db);
  const user = await db.user.findUnique({
    where: { email: TARGET.email },
    select: userSelect,
  });

  assertTargetUser(user);

  const wallets = await getWalletRows(db, user.id);
  const counts = await getRelatedCounts(db, user, wallets);
  assertRelatedCounts(counts);

  return { protectedAdmins, user, wallets, counts };
}

async function main() {
  console.log(`delete-old-test-user mode: ${execute ? 'EXECUTE' : 'DRY RUN'}`);
  console.log(`Target email: ${TARGET.email}`);

  const state = await collectAndAssertState(prisma);

  printHeader('Protected Super Admins Verified');
  console.table(
    state.protectedAdmins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      referralCode: admin.referralCode,
    }))
  );

  printPlan(state.user, state.wallets, state.counts);

  if (!execute) {
    return;
  }

  const deleted = await prisma.$transaction(
    async (tx) => {
      const txState = await collectAndAssertState(tx);

      const walletDelete = await tx.wallet.deleteMany({
        where: { userId: txState.user.id },
      });

      await tx.user.delete({
        where: { id: txState.user.id },
      });

      return {
        userId: txState.user.id,
        email: txState.user.email,
        walletRows: walletDelete.count,
        userRows: 1,
      };
    },
    { timeout: 30000 }
  );

  printHeader('Deleted');
  console.table([deleted]);

  const postDeleteUser = await prisma.user.findUnique({
    where: { email: TARGET.email },
    select: { id: true },
  });

  if (postDeleteUser) {
    throw new Error('Post-delete verification failed: target user still exists.');
  }

  await assertProtectedSuperAdmins(prisma);
  console.log(
    'Post-delete verification passed: target user is gone and protected Super Admins remain.'
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
