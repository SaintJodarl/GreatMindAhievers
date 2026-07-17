import { Prisma, PrismaClient } from '@prisma/client';

type TxClient =
  | Prisma.TransactionClient
  | PrismaClient
  | Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export type BinaryLeg = 'LEFT' | 'RIGHT';

export interface BinaryTreeScope {
  userId: string;
  path: string;
  depth: number;
  leftChildId: string | null;
  rightChildId: string | null;
}

export interface BinaryLegCounts {
  totalDescendantCount: number;
  activeDescendantCount: number;
  leftLegCount: number;
  rightLegCount: number;
  leftChildId: string | null;
  rightChildId: string | null;
}

export async function getBinaryTreeScope(
  tx: TxClient,
  userId: string
): Promise<BinaryTreeScope | null> {
  return tx.binaryTree.findUnique({
    where: { userId },
    select: {
      userId: true,
      path: true,
      depth: true,
      leftChildId: true,
      rightChildId: true,
    },
  });
}

export function isWithinBinaryScope(
  ancestor: BinaryTreeScope,
  candidate: Pick<BinaryTreeScope, 'userId' | 'path'>
) {
  return candidate.userId === ancestor.userId || candidate.path.startsWith(`${ancestor.path}/`);
}

export function resolveRelativeBinaryLeg(
  rootTree: Pick<BinaryTreeScope, 'path' | 'leftChildId' | 'rightChildId'> | null,
  memberTree: Pick<BinaryTreeScope, 'path'> | null | undefined
): BinaryLeg | null {
  if (!rootTree || !memberTree?.path || !memberTree.path.startsWith(`${rootTree.path}/`)) {
    return null;
  }

  const [firstDescendantId] = memberTree.path.slice(rootTree.path.length + 1).split('/');
  if (firstDescendantId === rootTree.leftChildId) return 'LEFT';
  if (firstDescendantId === rootTree.rightChildId) return 'RIGHT';
  return null;
}

async function countSubtree(tx: TxClient, rootPath: string | null | undefined) {
  if (!rootPath) return { total: 0, active: 0 };

  const subtreeWhere: Prisma.BinaryTreeWhereInput = {
    OR: [{ path: rootPath }, { path: { startsWith: `${rootPath}/` } }],
  };

  const [total, active] = await Promise.all([
    tx.binaryTree.count({ where: subtreeWhere }),
    tx.binaryTree.count({
      where: {
        ...subtreeWhere,
        user: {
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      },
    }),
  ]);

  return { total, active };
}

export async function getMemberBinaryLegCounts(
  tx: TxClient,
  userId: string
): Promise<BinaryLegCounts> {
  const rootTree = await getBinaryTreeScope(tx, userId);

  if (!rootTree) {
    return {
      totalDescendantCount: 0,
      activeDescendantCount: 0,
      leftLegCount: 0,
      rightLegCount: 0,
      leftChildId: null,
      rightChildId: null,
    };
  }

  const descendantWhere: Prisma.BinaryTreeWhereInput = {
    path: { startsWith: `${rootTree.path}/` },
  };

  const [leftChildTree, rightChildTree, totalDescendantCount, activeDescendantCount] =
    await Promise.all([
      rootTree.leftChildId
        ? tx.binaryTree.findUnique({
            where: { userId: rootTree.leftChildId },
            select: { path: true },
          })
        : Promise.resolve(null),
      rootTree.rightChildId
        ? tx.binaryTree.findUnique({
            where: { userId: rootTree.rightChildId },
            select: { path: true },
          })
        : Promise.resolve(null),
      tx.binaryTree.count({
        where: descendantWhere,
      }),
      tx.binaryTree.count({
        where: {
          ...descendantWhere,
          user: {
            role: 'MEMBER',
            status: 'ACTIVE',
          },
        },
      }),
    ]);

  const [left, right] = await Promise.all([
    countSubtree(tx, leftChildTree?.path),
    countSubtree(tx, rightChildTree?.path),
  ]);

  return {
    totalDescendantCount,
    activeDescendantCount,
    leftLegCount: left.total,
    rightLegCount: right.total,
    leftChildId: rootTree.leftChildId,
    rightChildId: rootTree.rightChildId,
  };
}
