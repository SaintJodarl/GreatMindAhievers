import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MEMBER_ROLE = 'MEMBER';
const PROTECTED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'];
const PROTECTED_ADMIN_EMAILS = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com',
];
const CONFIRM_ENV = 'CONFIRM_CLEAN_HANDOVER_DATA';
const EXECUTE_FLAG = '--execute';

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

type CleanupPlan = Awaited<ReturnType<typeof buildCleanupPlan>>;

const isExecuteMode = () =>
  process.argv.includes(EXECUTE_FLAG) || process.env.CLEAN_HANDOVER_EXECUTE === 'true';

const isConfirmed = () => process.env[CONFIRM_ENV]?.toLowerCase() === 'true';

const inIds = (ids: string[]) => ({ in: ids });

const orByIds = (ids: string[], fields: string[]) =>
  ids.length === 0 ? [] : fields.map((field) => ({ [field]: inIds(ids) }));

const printBackupRecommendation = () => {
  console.log('');
  console.log('Backup recommendation before destructive handover cleanup:');
  console.log(
    '  Create a PostgreSQL backup/snapshot first, for example with pg_dump or your database provider snapshot tool.'
  );
  console.log('  This script does not delete Cloudinary assets.');
  console.log('');
};

const printUsers = (
  title: string,
  users: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    adminRole?: string | null;
    status: string;
  }[]
) => {
  console.log(title);
  if (users.length === 0) {
    console.log('  None');
    return;
  }

  console.table(
    users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      adminRole: user.adminRole ?? '',
      status: user.status,
    }))
  );
};

async function buildCleanupPlan(db: PrismaClientOrTx) {
  const protectedUsers = await db.user.findMany({
    where: {
      OR: [
        { role: { in: PROTECTED_ROLES } },
        { email: { in: PROTECTED_ADMIN_EMAILS } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      adminRole: true,
      status: true,
    },
    orderBy: [{ role: 'asc' }, { email: 'asc' }],
  });

  const memberUsers = await db.user.findMany({
    where: {
      role: MEMBER_ROLE,
      NOT: { email: { in: PROTECTED_ADMIN_EMAILS } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      adminRole: true,
      status: true,
    },
    orderBy: [{ email: 'asc' }],
  });

  const otherUsers = await db.user.findMany({
    where: {
      role: {
        notIn: [...PROTECTED_ROLES, MEMBER_ROLE],
      },
      NOT: { email: { in: PROTECTED_ADMIN_EMAILS } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      adminRole: true,
      status: true,
    },
    orderBy: [{ role: 'asc' }, { email: 'asc' }],
  });

  const memberIds = memberUsers.map((user) => user.id);
  const memberEmails = memberUsers
    .map((user) => user.email)
    .filter((email): email is string => Boolean(email));

  const [wallets, tickets] = await Promise.all([
    db.wallet.findMany({
      where: { userId: inIds(memberIds) },
      select: { id: true },
    }),
    db.ticket.findMany({
      where: { userId: inIds(memberIds) },
      select: { id: true },
    }),
  ]);

  const walletIds = wallets.map((wallet) => wallet.id);
  const ticketIds = tickets.map((ticket) => ticket.id);

  const walletTransactionOr = [
    ...orByIds(memberIds, ['userId']),
    ...orByIds(walletIds, ['walletId']),
  ];
  const passwordResetOr = [
    ...orByIds(memberIds, ['userId']),
    ...(memberEmails.length > 0 ? [{ email: { in: memberEmails } }] : []),
  ];
  const auditLogOr = orByIds(memberIds, ['adminId', 'targetId']);
  const commissionLogOr = orByIds(memberIds, ['userId', 'fromUserId']);
  const binaryTreeLinkOr = orByIds(memberIds, ['parentId', 'leftChildId', 'rightChildId']);

  const counts = {
    protectedUsers: protectedUsers.length,
    memberUsers: memberUsers.length,
    otherUsersPreservedForManualReview: otherUsers.length,
    activationCodes: await db.activationCode.count(),
    adminCodes: await db.adminCode.count(),
    kycSubmissions: await db.kYCSubmission.count({ where: { userId: inIds(memberIds) } }),
    memberProfiles: await db.memberProfile.count({ where: { userId: inIds(memberIds) } }),
    wallets: wallets.length,
    walletTransactions:
      walletTransactionOr.length === 0
        ? 0
        : await db.walletTransaction.count({ where: { OR: walletTransactionOr } }),
    binaryTreeRows: await db.binaryTree.count({ where: { userId: inIds(memberIds) } }),
    binaryTreeLinksToClear:
      binaryTreeLinkOr.length === 0
        ? 0
        : await db.binaryTree.count({ where: { OR: binaryTreeLinkOr } }),
    commissionLogs:
      commissionLogOr.length === 0
        ? 0
        : await db.commissionLog.count({ where: { OR: commissionLogOr } }),
    tickets: tickets.length,
    ticketMessages:
      ticketIds.length === 0
        ? 0
        : await db.ticketMessage.count({ where: { ticketId: inIds(ticketIds) } }),
    withdrawals: await db.withdrawal.count({ where: { userId: inIds(memberIds) } }),
    refreshTokens: await db.refreshToken.count({ where: { userId: inIds(memberIds) } }),
    passwordResetRequests:
      passwordResetOr.length === 0
        ? 0
        : await db.passwordResetRequest.count({ where: { OR: passwordResetOr } }),
    activationAttempts: await db.activationAttempt.count({ where: { userId: inIds(memberIds) } }),
    financialEvents: await db.financialEvent.count({ where: { userId: inIds(memberIds) } }),
    outboxEvents: await db.outboxEvent.count({ where: { userId: inIds(memberIds) } }),
    loginAttempts:
      memberEmails.length === 0
        ? 0
        : await db.loginAttempt.count({ where: { email: { in: memberEmails } } }),
    auditLogs:
      auditLogOr.length === 0 ? 0 : await db.auditLog.count({ where: { OR: auditLogOr } }),
    usersReferencingMembersAsSponsor: await db.user.count({
      where: { sponsorId: inIds(memberIds) },
    }),
    usersReferencingMembersAsPlacement: await db.user.count({
      where: { placementId: inIds(memberIds) },
    }),
  };

  return {
    protectedUsers,
    memberUsers,
    otherUsers,
    memberIds,
    memberEmails,
    walletIds,
    ticketIds,
    counts,
  };
}

const printPlan = (plan: CleanupPlan, execute: boolean) => {
  console.log('GMA handover cleanup');
  console.log(`Mode: ${execute ? 'EXECUTE' : 'DRY RUN'}`);
  console.log(`Protected roles: ${PROTECTED_ROLES.join(', ')}`);
  console.log(`Deletable user role: ${MEMBER_ROLE}`);

  printBackupRecommendation();
  printUsers('Admin/staff users preserved:', plan.protectedUsers);
  printUsers('Member users identified for deletion:', plan.memberUsers);

  if (plan.otherUsers.length > 0) {
    printUsers(
      'Other non-member/non-admin roles preserved for manual review:',
      plan.otherUsers
    );
  }

  console.log('Cleanup counts:');
  console.table(plan.counts);

  if (!execute) {
    console.log('');
    console.log('Dry run only. No database rows were deleted or updated.');
    console.log(
      `To execute: set ${CONFIRM_ENV}=true and run npm run clean:handover.`
    );
  }
};

async function deleteHandoverData(plan: CleanupPlan) {
  if (plan.protectedUsers.length === 0) {
    throw new Error(
      'Refusing destructive cleanup: no protected admin/staff users were found.'
    );
  }

  if (!isConfirmed()) {
    throw new Error(
      `Refusing destructive cleanup: set ${CONFIRM_ENV}=true to confirm.`
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const memberIds = plan.memberIds;
      const memberEmails = plan.memberEmails;
      const walletIds = plan.walletIds;
      const ticketIds = plan.ticketIds;

      await tx.activationCode.deleteMany({});
      await tx.adminCode.deleteMany({});

      if (memberEmails.length > 0) {
        await tx.loginAttempt.deleteMany({ where: { email: { in: memberEmails } } });
      }

      await tx.auditLog.deleteMany({
        where: { OR: orByIds(memberIds, ['adminId', 'targetId']) },
      });
      await tx.passwordResetRequest.deleteMany({
        where: {
          OR: [
            ...orByIds(memberIds, ['userId']),
            ...(memberEmails.length > 0 ? [{ email: { in: memberEmails } }] : []),
          ],
        },
      });
      await tx.activationAttempt.deleteMany({ where: { userId: inIds(memberIds) } });
      await tx.refreshToken.deleteMany({ where: { userId: inIds(memberIds) } });
      await tx.outboxEvent.deleteMany({ where: { userId: inIds(memberIds) } });
      await tx.financialEvent.deleteMany({ where: { userId: inIds(memberIds) } });
      await tx.kYCSubmission.deleteMany({ where: { userId: inIds(memberIds) } });

      if (ticketIds.length > 0) {
        await tx.ticketMessage.deleteMany({ where: { ticketId: inIds(ticketIds) } });
      }
      await tx.ticket.deleteMany({ where: { userId: inIds(memberIds) } });
      await tx.withdrawal.deleteMany({ where: { userId: inIds(memberIds) } });
      await tx.commissionLog.deleteMany({
        where: { OR: orByIds(memberIds, ['userId', 'fromUserId']) },
      });

      const walletTransactionOr = [
        ...orByIds(memberIds, ['userId']),
        ...orByIds(walletIds, ['walletId']),
      ];
      if (walletTransactionOr.length > 0) {
        await tx.walletTransaction.deleteMany({ where: { OR: walletTransactionOr } });
      }
      await tx.wallet.deleteMany({ where: { userId: inIds(memberIds) } });

      await tx.binaryTree.updateMany({
        where: { parentId: inIds(memberIds) },
        data: { parentId: null },
      });
      await tx.binaryTree.updateMany({
        where: { leftChildId: inIds(memberIds) },
        data: { leftChildId: null },
      });
      await tx.binaryTree.updateMany({
        where: { rightChildId: inIds(memberIds) },
        data: { rightChildId: null },
      });
      await tx.binaryTree.deleteMany({ where: { userId: inIds(memberIds) } });

      await tx.memberProfile.deleteMany({ where: { userId: inIds(memberIds) } });

      await tx.user.updateMany({
        where: { sponsorId: inIds(memberIds) },
        data: { sponsorId: null },
      });
      await tx.user.updateMany({
        where: { placementId: inIds(memberIds) },
        data: { placementId: null },
      });

      await tx.user.deleteMany({
        where: {
          id: inIds(memberIds),
          role: MEMBER_ROLE,
          NOT: { email: { in: PROTECTED_ADMIN_EMAILS } },
        },
      });
    },
    {
      maxWait: 15000,
      timeout: 120000,
    }
  );
}

async function main() {
  const execute = isExecuteMode();
  const plan = await buildCleanupPlan(prisma);
  printPlan(plan, execute);

  if (!execute) {
    return;
  }

  await deleteHandoverData(plan);

  const afterPlan = await buildCleanupPlan(prisma);
  console.log('');
  console.log('Cleanup completed.');
  console.table({
    protectedUsersRemaining: afterPlan.counts.protectedUsers,
    memberUsersRemaining: afterPlan.counts.memberUsers,
    activationCodesRemaining: afterPlan.counts.activationCodes,
    adminCodesRemaining: afterPlan.counts.adminCodes,
  });
}

main()
  .catch((error) => {
    console.error('Handover cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
