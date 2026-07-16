import { Prisma, PrismaClient } from '@prisma/client';
import {
  FIRST_PARENT_BOOTSTRAP_LOCK_NAME,
  acquireFirstParentBootstrapLock,
} from '../src/lib/root-bootstrap-lock';
import { STAGE_IDS } from '../src/lib/qualification/constants';

const FIRST_PARENT_BOOTSTRAP_REFERRAL_CODE = 'ROOT-PARENT-001';
const STARTUP_ACTIVATION_CODE = 'GMA-000001';
const PROTECTED_ADMIN_EMAIL_LIST = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com',
] as const;

const normalMemberBootstrapWhere = {
  role: 'MEMBER',
  NOT: { email: { in: [...PROTECTED_ADMIN_EMAIL_LIST] } },
};

type TxClient = Prisma.TransactionClient | PrismaClient;

interface RootEligibilitySnapshot {
  normalMemberCount: number;
  existingRootNode: boolean;
  bootstrapReferralOwner: boolean;
  activationStatus: string | null;
  activationRedeemed: boolean;
}

interface TryLockResult {
  acquired: boolean;
}

class ExpectedRollbackProbe extends Error {
  constructor() {
    super('Expected rollback probe');
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function getRootEligibilitySnapshot(tx: TxClient): Promise<RootEligibilitySnapshot> {
  const [normalMemberCount, existingRootNode, bootstrapReferralOwner, activationCode] =
    await Promise.all([
      tx.user.count({ where: normalMemberBootstrapWhere }),
      tx.binaryTree.findFirst({
        where: {
          parentId: null,
          user: {
            role: 'MEMBER',
          },
        },
        select: { userId: true },
      }),
      tx.user.findUnique({
        where: { referralCode: FIRST_PARENT_BOOTSTRAP_REFERRAL_CODE },
        select: { id: true },
      }),
      tx.activationCode.findUnique({
        where: { code: STARTUP_ACTIVATION_CODE },
        select: { status: true, redeemedBy: true },
      }),
    ]);

  return {
    normalMemberCount,
    existingRootNode: Boolean(existingRootNode),
    bootstrapReferralOwner: Boolean(bootstrapReferralOwner),
    activationStatus: activationCode?.status ?? null,
    activationRedeemed: Boolean(activationCode?.redeemedBy),
  };
}

async function tryAcquireFirstParentBootstrapLock(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<TryLockResult[]>`
    SELECT pg_try_advisory_xact_lock(hashtext(${FIRST_PARENT_BOOTSTRAP_LOCK_NAME})) AS acquired
  `;

  return Boolean(rows[0]?.acquired);
}

async function verifyLockStatement(prisma: PrismaClient) {
  return prisma.$transaction(
    async (tx) => {
      const lockResult = await acquireFirstParentBootstrapLock(tx);
      assert(lockResult.acquired === 1, 'Advisory lock SQL did not return the expected integer.');
      assert(
        Object.keys(lockResult).join(',') === 'acquired',
        'Advisory lock result exposed an unexpected column.'
      );

      const eligibilityAfterLock = await getRootEligibilitySnapshot(tx);

      return {
        lockResult,
        returnedColumns: Object.keys(lockResult),
        scalarType: typeof lockResult.acquired,
        rootEligibilityCheckedAfterLock: true,
        eligibilityAfterLock,
      };
    },
    {
      timeout: 20000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

async function verifyConcurrentExclusion() {
  const lockHolder = new PrismaClient();
  const contender = new PrismaClient();
  let releaseLockHolder!: () => void;
  let lockHolderTransaction!: Promise<void>;

  try {
    const lockHolderReady = new Promise<void>((resolve, reject) => {
      lockHolderTransaction = lockHolder.$transaction(
        async (tx) => {
          try {
            await acquireFirstParentBootstrapLock(tx);
            resolve();
            await new Promise<void>((release) => {
              releaseLockHolder = release;
            });
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        {
          timeout: 20000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    });

    await lockHolderReady;

    const acquiredWhileHeld = await contender.$transaction(
      async (tx) => tryAcquireFirstParentBootstrapLock(tx),
      {
        timeout: 20000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    assert(
      acquiredWhileHeld === false,
      'A second transaction acquired the bootstrap lock while the first still held it.'
    );

    releaseLockHolder();
    await lockHolderTransaction;

    const acquiredAfterRelease = await contender.$transaction(
      async (tx) => tryAcquireFirstParentBootstrapLock(tx),
      {
        timeout: 20000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    assert(
      acquiredAfterRelease === true,
      'The transaction-scoped advisory lock was not released after the holder transaction ended.'
    );

    return {
      contenderAcquiredWhileHeld: acquiredWhileHeld,
      contenderAcquiredAfterRelease: acquiredAfterRelease,
    };
  } finally {
    await Promise.all([lockHolder.$disconnect(), contender.$disconnect()]);
  }
}

async function verifyRollbackProbe(prisma: PrismaClient) {
  const before = await getRootEligibilitySnapshot(prisma);
  assert(before.normalMemberCount === 0, 'Rollback probe requires no existing genuine members.');
  assert(before.existingRootNode === false, 'Rollback probe requires no existing root node.');
  assert(
    before.bootstrapReferralOwner === false,
    'Rollback probe requires ROOT-PARENT-001 to be unowned.'
  );
  assert(before.activationStatus === 'UNUSED', 'Rollback probe requires GMA-000001 to be unused.');
  assert(
    before.activationRedeemed === false,
    'Rollback probe requires GMA-000001 to be unredeemed.'
  );

  const probeId = `rollback-probe-${Date.now()}`;

  try {
    await prisma.$transaction(
      async (tx) => {
        await acquireFirstParentBootstrapLock(tx);

        const createdUser = await tx.user.create({
          data: {
            name: 'Rollback Probe',
            email: `${probeId}@example.invalid`,
            username: probeId,
            password: 'rollback-probe-not-a-login',
            role: 'MEMBER',
            status: 'ACTIVE',
            onboardingStatus: 'COMPLETE',
            onboardingStep: 4,
            kycStatus: 'COMPLETE',
            currentStage: STAGE_IDS.STARTER_ENTRY_STAGE,
            highestStage: STAGE_IDS.STARTER_ENTRY_STAGE,
            stageUpdatedAt: new Date(),
            autoPlacement: true,
            referralCode: `RB-${probeId}`,
            referralLink: `rollback-probe://${probeId}`,
          },
          select: { id: true },
        });

        const redeemResult = await tx.activationCode.updateMany({
          where: {
            code: STARTUP_ACTIVATION_CODE,
            status: 'UNUSED',
            redeemedBy: null,
          },
          data: {
            status: 'USED',
            redeemedBy: createdUser.id,
            redeemedDate: new Date(),
          },
        });

        assert(
          redeemResult.count === 1,
          'Rollback probe could not update the bootstrap activation code inside the transaction.'
        );

        throw new ExpectedRollbackProbe();
      },
      {
        timeout: 20000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    if (!(error instanceof ExpectedRollbackProbe)) {
      throw error;
    }
  }

  const after = await getRootEligibilitySnapshot(prisma);
  const probeUser = await prisma.user.findUnique({
    where: { username: probeId },
    select: { id: true },
  });

  assert(
    after.normalMemberCount === before.normalMemberCount,
    'Member creation was not rolled back.'
  );
  assert(
    after.activationStatus === before.activationStatus,
    'Activation status was not rolled back.'
  );
  assert(
    after.activationRedeemed === before.activationRedeemed,
    'Activation redemption was not rolled back.'
  );
  assert(probeUser === null, 'Rollback probe user persisted unexpectedly.');

  return {
    before,
    after,
    probeUserPersisted: Boolean(probeUser),
  };
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const lockStatement = await verifyLockStatement(prisma);
    const concurrency = await verifyConcurrentExclusion();
    const rollback = await verifyRollbackProbe(prisma);

    console.log(
      JSON.stringify(
        {
          verdict: 'ROOT_BOOTSTRAP_ADVISORY_LOCK_VERIFIED',
          lockStatement,
          concurrency,
          rollback,
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Root-bootstrap advisory-lock verification failed:', error);
  process.exitCode = 1;
});
