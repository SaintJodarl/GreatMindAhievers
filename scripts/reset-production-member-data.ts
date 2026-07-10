import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIRM_RESET_FLAG = '--confirm-reset-member-data';
const CONFIRM_PRODUCTION_TARGET_FLAG = '--confirm-production-target';
const STARTUP_ACTIVATION_CODE = 'GMA-000001';
const BOOTSTRAP_REFERRAL_CODE = 'ROOT-PARENT-001';

const APPROVED_SUPER_ADMINS = [
  { name: 'Blessing Makata', email: 'makatablessing2026@gmail.com' },
  { name: 'Great-Mind Achievers', email: 'gmanetworkng@gmail.com' },
  { name: 'Stellar Media', email: 'stellarmediang@gmail.com' },
] as const;

const APPROVED_SUPER_ADMIN_EMAILS: string[] = APPROVED_SUPER_ADMINS.map((admin) => admin.email);

type DbClient = PrismaClient | Prisma.TransactionClient;

type UserIdentity = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  adminRole: string | null;
  status: string;
};

type CleanupCounts = {
  usersTotal: number;
  approvedSuperAdmins: number;
  usersToDelete: number;
  activationCodes: number;
  adminCodes: number;
  memberProfiles: number;
  kycSubmissions: number;
  wallets: number;
  walletTransactions: number;
  binaryTreeRows: number;
  commissionLogs: number;
  commissionCycles: number;
  withdrawals: number;
  tickets: number;
  ticketMessages: number;
  stageProgress: number;
  rewards: number;
  rewardClaims: number;
  financialEvents: number;
  outboxEvents: number;
  activationAttempts: number;
  refreshTokens: number;
  passwordResetRequests: number;
  loginAttempts: number;
  auditLogs: number;
};

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function getDatabaseTarget() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return '[DATABASE_URL is not set]';

  try {
    const url = new URL(rawUrl);
    const port = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${url.hostname}${port}${url.pathname}`;
  } catch {
    return '[DATABASE_URL is set but could not be parsed]';
  }
}

function targetLooksRemoteOrProduction() {
  const rawUrl = process.env.DATABASE_URL;
  if (process.env.NODE_ENV === 'production') return true;
  if (!rawUrl) return false;

  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    return !['localhost', '127.0.0.1', '::1'].includes(hostname);
  } catch {
    return true;
  }
}

function printSafetyHeader() {
  console.info('GMA production member data reset');
  console.info(`NODE_ENV: ${process.env.NODE_ENV || '[not set]'}`);
  console.info(`Database target: ${getDatabaseTarget()}`);
  console.info('');
  console.info('This script deletes member/user-owned operational data and preserves only:');
  for (const admin of APPROVED_SUPER_ADMINS) {
    console.info(`  - ${admin.name} <${admin.email}>`);
  }
  console.info('');
  console.info('Backup/export warning: create a database snapshot or pg_dump before running this.');
  console.info('No passwords or secrets are printed by this script.');
  console.info('');
}

function printCounts(title: string, counts: CleanupCounts) {
  console.info(title);
  for (const [key, value] of Object.entries(counts)) {
    console.info(`  ${key}: ${value}`);
  }
}

async function getCounts(db: DbClient): Promise<CleanupCounts> {
  const usersToDeleteWhere = {
    OR: [{ email: null }, { email: { notIn: APPROVED_SUPER_ADMIN_EMAILS } }],
  };

  const [
    usersTotal,
    approvedSuperAdmins,
    usersToDelete,
    activationCodes,
    adminCodes,
    memberProfiles,
    kycSubmissions,
    wallets,
    walletTransactions,
    binaryTreeRows,
    commissionLogs,
    commissionCycles,
    withdrawals,
    tickets,
    ticketMessages,
    stageProgress,
    rewards,
    rewardClaims,
    financialEvents,
    outboxEvents,
    activationAttempts,
    refreshTokens,
    passwordResetRequests,
    loginAttempts,
    auditLogs,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({
      where: {
        email: { in: APPROVED_SUPER_ADMIN_EMAILS },
        role: 'SUPER_ADMIN',
      },
    }),
    db.user.count({ where: usersToDeleteWhere }),
    db.activationCode.count(),
    db.adminCode.count(),
    db.memberProfile.count(),
    db.kYCSubmission.count(),
    db.wallet.count(),
    db.walletTransaction.count(),
    db.binaryTree.count(),
    db.commissionLog.count(),
    db.commissionCycle.count(),
    db.withdrawal.count(),
    db.ticket.count(),
    db.ticketMessage.count(),
    db.stageProgress.count(),
    db.reward.count(),
    db.rewardClaim.count(),
    db.financialEvent.count(),
    db.outboxEvent.count(),
    db.activationAttempt.count(),
    db.refreshToken.count(),
    db.passwordResetRequest.count(),
    db.loginAttempt.count(),
    db.auditLog.count(),
  ]);

  return {
    usersTotal,
    approvedSuperAdmins,
    usersToDelete,
    activationCodes,
    adminCodes,
    memberProfiles,
    kycSubmissions,
    wallets,
    walletTransactions,
    binaryTreeRows,
    commissionLogs,
    commissionCycles,
    withdrawals,
    tickets,
    ticketMessages,
    stageProgress,
    rewards,
    rewardClaims,
    financialEvents,
    outboxEvents,
    activationAttempts,
    refreshTokens,
    passwordResetRequests,
    loginAttempts,
    auditLogs,
  };
}

async function getApprovedSuperAdmins(db: DbClient) {
  return db.user.findMany({
    where: { email: { in: APPROVED_SUPER_ADMIN_EMAILS } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      adminRole: true,
      status: true,
    },
    orderBy: { email: 'asc' },
  });
}

function assertApprovedSuperAdmins(admins: UserIdentity[]) {
  for (const expected of APPROVED_SUPER_ADMINS) {
    const admin = admins.find((row) => row.email === expected.email);
    if (!admin) {
      throw new Error(`Refusing reset: approved super admin is missing: ${expected.email}`);
    }
    if (admin.role !== 'SUPER_ADMIN') {
      throw new Error(
        `Refusing reset: approved account ${expected.email} is role ${admin.role}, not SUPER_ADMIN.`
      );
    }
  }
}

async function resetData() {
  await prisma.$transaction(
    async (tx) => {
      const approvedAdmins = await getApprovedSuperAdmins(tx);
      assertApprovedSuperAdmins(approvedAdmins);

      await tx.activationCode.deleteMany({});
      await tx.adminCode.deleteMany({});

      await tx.rewardClaim.deleteMany({});
      await tx.reward.deleteMany({});
      await tx.stageProgress.deleteMany({});
      await tx.withdrawal.deleteMany({});

      await tx.ticketMessage.deleteMany({});
      await tx.ticket.deleteMany({});

      await tx.commissionLog.deleteMany({});
      await tx.commissionCycle.deleteMany({});
      await tx.walletTransaction.deleteMany({});
      await tx.wallet.deleteMany({});
      await tx.financialEvent.deleteMany({});
      await tx.outboxEvent.deleteMany({});

      await tx.activationAttempt.deleteMany({});
      await tx.refreshToken.deleteMany({});
      await tx.passwordResetRequest.deleteMany({});
      await tx.loginAttempt.deleteMany({});
      await tx.auditLog.deleteMany({});

      await tx.kYCSubmission.deleteMany({});
      await tx.memberProfile.deleteMany({});
      await tx.binaryTree.deleteMany({});

      await tx.user.updateMany({
        data: {
          sponsorId: null,
          placementId: null,
        },
      });

      await tx.user.updateMany({
        where: { email: { in: APPROVED_SUPER_ADMIN_EMAILS } },
        data: {
          referralCode: null,
          referralLink: null,
          sponsorId: null,
          placementId: null,
          binaryPosition: null,
          currentStage: 'STARTER',
          kycStatus: 'PENDING',
          kycSubmittedAt: null,
          kycApprovedAt: null,
          kycRejectedAt: null,
          kycRejectionReason: null,
          resetToken: null,
          resetTokenExpiry: null,
          leftLegCount: 0,
          rightLegCount: 0,
          totalDownlines: 0,
          depth: 0,
          path: null,
        },
      });

      await tx.user.deleteMany({
        where: {
          OR: [{ email: null }, { email: { notIn: APPROVED_SUPER_ADMIN_EMAILS } }],
        },
      });

      await tx.activationCode.create({
        data: {
          code: STARTUP_ACTIVATION_CODE,
          status: 'UNUSED',
          createdBy: 'SYSTEM_RESET',
          redeemedBy: null,
          redeemedDate: null,
          expirationDate: null,
        },
      });
    },
    { maxWait: 15000, timeout: 120000 }
  );
}

async function assertResetResult() {
  const [users, activationCodes, normalMemberCount, rootCodeUser] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, adminRole: true, status: true },
      orderBy: { email: 'asc' },
    }),
    prisma.activationCode.findMany({
      select: { code: true, status: true, redeemedBy: true, expirationDate: true },
      orderBy: { code: 'asc' },
    }),
    prisma.user.count({
      where: {
        role: 'MEMBER',
        NOT: { email: { in: APPROVED_SUPER_ADMIN_EMAILS } },
      },
    }),
    prisma.user.findUnique({
      where: { referralCode: BOOTSTRAP_REFERRAL_CODE },
      select: { id: true },
    }),
  ]);

  const remainingEmails = users.map((user) => user.email);
  const unexpectedUser = users.find(
    (user) => !user.email || !APPROVED_SUPER_ADMIN_EMAILS.includes(user.email)
  );
  if (unexpectedUser) {
    throw new Error(`Reset verification failed: unexpected user remains: ${unexpectedUser.email}`);
  }

  if (users.length !== APPROVED_SUPER_ADMIN_EMAILS.length) {
    throw new Error(
      `Reset verification failed: expected ${APPROVED_SUPER_ADMIN_EMAILS.length} users, found ${users.length}.`
    );
  }

  if (activationCodes.length !== 1 || activationCodes[0]?.code !== STARTUP_ACTIVATION_CODE) {
    throw new Error(
      'Reset verification failed: activation code table does not contain only GMA-000001.'
    );
  }

  const startupCode = activationCodes[0];
  if (startupCode.status !== 'UNUSED' || startupCode.redeemedBy || startupCode.expirationDate) {
    throw new Error(
      'Reset verification failed: GMA-000001 is not fresh, unused, and non-expiring.'
    );
  }

  if (normalMemberCount !== 0) {
    throw new Error(`Reset verification failed: ${normalMemberCount} normal members remain.`);
  }

  if (rootCodeUser) {
    throw new Error(
      'Reset verification failed: ROOT-PARENT-001 exists as a real user referral code.'
    );
  }

  for (const email of APPROVED_SUPER_ADMIN_EMAILS) {
    if (!remainingEmails.includes(email)) {
      throw new Error(`Reset verification failed: approved super admin missing: ${email}`);
    }
  }
}

async function main() {
  printSafetyHeader();

  if (!hasFlag(CONFIRM_RESET_FLAG)) {
    console.error(`Refusing to run: missing required ${CONFIRM_RESET_FLAG} flag.`);
    console.error(`Command: npx tsx scripts/reset-production-member-data.ts ${CONFIRM_RESET_FLAG}`);
    process.exitCode = 1;
    return;
  }

  if (targetLooksRemoteOrProduction() && !hasFlag(CONFIRM_PRODUCTION_TARGET_FLAG)) {
    console.error(
      `Refusing to run against a remote/production-like target without ${CONFIRM_PRODUCTION_TARGET_FLAG}.`
    );
    console.error('Create a backup/export, confirm the target, then rerun with both flags.');
    process.exitCode = 1;
    return;
  }

  const beforeCounts = await getCounts(prisma);
  printCounts('Rows before reset:', beforeCounts);

  await resetData();
  await assertResetResult();

  const afterCounts = await getCounts(prisma);
  console.info('');
  printCounts('Rows after reset:', afterCounts);
  console.info('');
  console.info('Reset complete.');
  console.info(`Fresh activation code: ${STARTUP_ACTIVATION_CODE}`);
  console.info(
    `One-time bootstrap referral code expected by registration: ${BOOTSTRAP_REFERRAL_CODE}`
  );
}

main()
  .catch((error) => {
    console.error('Reset failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
