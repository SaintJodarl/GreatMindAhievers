import type { Prisma } from '@prisma/client';

export const FIRST_PARENT_BOOTSTRAP_LOCK_NAME = 'gma:first-parent-bootstrap';

type AdvisoryLockClient = Pick<Prisma.TransactionClient, '$queryRaw'>;

export interface AdvisoryLockResult {
  acquired: number;
}

export async function acquireFirstParentBootstrapLock(
  tx: AdvisoryLockClient
): Promise<AdvisoryLockResult> {
  const rows = await tx.$queryRaw<AdvisoryLockResult[]>`
    SELECT 1::int AS acquired
    FROM pg_advisory_xact_lock(hashtext(${FIRST_PARENT_BOOTSTRAP_LOCK_NAME}))
  `;

  const acquired = Number(rows[0]?.acquired);
  if (acquired !== 1) {
    throw new Error('Failed to acquire the first-parent bootstrap advisory lock.');
  }

  return { acquired };
}
