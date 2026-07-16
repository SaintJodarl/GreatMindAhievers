import { PrismaClient } from '@prisma/client';
import { calculateQualificationProgress } from '../../src/lib/qualification/engine';
import {
  STAGE_IDS,
  STAGE_RANK,
  getNextStage,
  getStageDisplayName,
  isStageAtLeast,
  normalizeStageId,
  type StageId,
} from '../../src/lib/qualification/constants';

export const APPROVED_SUPER_ADMIN_EMAILS = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com',
] as const;

export const BOOTSTRAP_REFERRAL_CODE = 'ROOT-PARENT-001';
export const STARTUP_ACTIVATION_CODE = 'GMA-000001';

const APPROVED_SUPER_ADMIN_EMAIL_SET = new Set<string>(APPROVED_SUPER_ADMIN_EMAILS);

type SlotSide = 'LEFT' | 'RIGHT';

function maskEmail(email: string | null | undefined) {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return 'masked-email';
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskName(name: string | null | undefined) {
  if (!name) return null;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0] ?? ''}.`)
    .join(' ');
}

function shortId(id: string | null | undefined) {
  return id ? `${id.slice(0, 8)}...` : null;
}

function sanitizeMember(user: any) {
  if (!user) return null;
  return {
    id: shortId(user.id),
    name: maskName(user.name),
    email: maskEmail(user.email),
    role: user.role,
    status: user.status,
    currentStage: normalizeStageId(user.currentStage),
    highestStage: normalizeStageId(user.highestStage),
    referralCode: user.referralCode,
    sponsorId: shortId(user.sponsorId),
    placementId: shortId(user.placementId),
    binaryPosition: user.binaryPosition,
    binaryParentId: shortId(user.binaryTree?.parentId),
    binaryDepth: user.binaryTree?.depth ?? null,
    activationStatus: user.activationCode?.status ?? null,
    createdAt: user.createdAt,
  };
}

function duplicateGroups<T>(items: T[], keyOf: (item: T) => string | null | undefined) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, count: group.length, records: group }));
}

function collectFirstThreeLevelSlots(
  rootUserId: string,
  requiredStage: StageId,
  userById: Map<string, any>,
  treeByUserId: Map<string, any>
) {
  const slots: any[] = [];
  const seenMembers = new Set<string>();

  function addMissingSubtree(slot: string, leg: SlotSide, level: number) {
    slots.push({
      slot,
      leg,
      level,
      member: null,
      stage: null,
      qualifies: false,
      reason: 'MISSING_POSITION',
    });

    if (level < 3) {
      addMissingSubtree(`${slot}L`, leg, level + 1);
      addMissingSubtree(`${slot}R`, leg, level + 1);
    }
  }

  function visit(parentUserId: string, side: SlotSide, slot: string, leg: SlotSide, level: number) {
    const parentTree = treeByUserId.get(parentUserId);
    const childId = side === 'LEFT' ? parentTree?.leftChildId : parentTree?.rightChildId;

    if (!childId) {
      addMissingSubtree(slot, leg, level);
      return;
    }

    const child = userById.get(childId);
    const duplicateSlotMember = seenMembers.has(childId);
    seenMembers.add(childId);

    const qualifies =
      Boolean(child) &&
      child.role === 'MEMBER' &&
      child.status === 'ACTIVE' &&
      isStageAtLeast(child.currentStage, requiredStage) &&
      !duplicateSlotMember;

    slots.push({
      slot,
      leg,
      level,
      member: child ? sanitizeMember(child) : { id: shortId(childId), missingUser: true },
      stage: child ? normalizeStageId(child.currentStage) : null,
      qualifies,
      reason: qualifies
        ? 'QUALIFIES'
        : duplicateSlotMember
          ? 'DUPLICATE_SLOT_MEMBER'
          : 'NOT_AT_REQUIRED_STAGE_OR_NOT_ACTIVE_MEMBER',
    });

    if (level < 3) {
      visit(childId, 'LEFT', `${slot}L`, leg, level + 1);
      visit(childId, 'RIGHT', `${slot}R`, leg, level + 1);
    }
  }

  visit(rootUserId, 'LEFT', 'L', 'LEFT', 1);
  visit(rootUserId, 'RIGHT', 'R', 'RIGHT', 1);
  return slots;
}

function getEligibleDirectSponsoredMembers(userId: string, users: any[]) {
  return users
    .filter(
      (user) =>
        user.sponsorId === userId &&
        user.role === 'MEMBER' &&
        user.status === 'ACTIVE' &&
        user.activationCode?.status === 'USED'
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
    .map(sanitizeMember);
}

function resolveRelativeBinaryLeg(
  rootTree: { path: string; leftChildId: string | null; rightChildId: string | null } | null,
  memberTree: { path: string | null } | null | undefined
) {
  if (!rootTree || !memberTree?.path || !memberTree.path.startsWith(`${rootTree.path}/`)) {
    return null;
  }

  const [firstDescendantId] = memberTree.path.slice(rootTree.path.length + 1).split('/');
  if (firstDescendantId === rootTree.leftChildId) return 'LEFT';
  if (firstDescendantId === rootTree.rightChildId) return 'RIGHT';
  return null;
}

function getEligibleDirectSponsoredMembersByLeg(
  userId: string,
  users: any[],
  treeByUserId: Map<string, any>
) {
  const rootTree = treeByUserId.get(userId) ?? null;
  return users
    .filter(
      (user) =>
        user.sponsorId === userId &&
        user.role === 'MEMBER' &&
        user.status === 'ACTIVE' &&
        user.activationCode?.status === 'USED'
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))
    .map((user) => ({
      ...sanitizeMember(user),
      starterBinaryLeg: resolveRelativeBinaryLeg(rootTree, user.binaryTree),
    }));
}

export async function buildRootRegistrationReadinessReport(prisma: PrismaClient) {
  const generatedAt = new Date();
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  const [users, binaryTrees, activationCode, activationCodeCount] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        currentStage: true,
        highestStage: true,
        sponsorId: true,
        placementId: true,
        binaryPosition: true,
        referralCode: true,
        createdAt: true,
        activationCode: {
          select: {
            status: true,
            redeemedDate: true,
            expirationDate: true,
          },
        },
        binaryTree: {
          select: {
            parentId: true,
            leftChildId: true,
            rightChildId: true,
            path: true,
            depth: true,
          },
        },
        stageHistory: {
          select: {
            toStage: true,
            qualifiedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.binaryTree.findMany({
      select: {
        userId: true,
        parentId: true,
        leftChildId: true,
        rightChildId: true,
        path: true,
        depth: true,
      },
      orderBy: [{ depth: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.activationCode.findUnique({
      where: { code: STARTUP_ACTIVATION_CODE },
      select: {
        id: true,
        code: true,
        status: true,
        redeemedBy: true,
        redeemedDate: true,
        expirationDate: true,
        redeemedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    }),
    prisma.activationCode.count(),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const treeByUserId = new Map(binaryTrees.map((tree) => [tree.userId, tree]));
  const members = users.filter((user) => user.role === 'MEMBER');
  const genuineMembers = members.filter(
    (user) => !APPROVED_SUPER_ADMIN_EMAIL_SET.has((user.email ?? '').toLowerCase())
  );
  const approvedAdmins = users.filter((user) =>
    APPROVED_SUPER_ADMIN_EMAIL_SET.has((user.email ?? '').toLowerCase())
  );
  const rootNodes = binaryTrees
    .filter((tree) => tree.parentId === null)
    .map((tree) => userById.get(tree.userId))
    .filter((user) => user?.role === 'MEMBER');
  const bootstrapReferralOwner = users.find(
    (user) => user.referralCode === BOOTSTRAP_REFERRAL_CODE
  );

  const duplicateReferralCodes = duplicateGroups(users, (user) => user.referralCode).map(
    (group) => ({
      referralCode: group.key,
      count: group.count,
      owners: group.records.map(sanitizeMember),
    })
  );

  const duplicateUserPlacementSlots = duplicateGroups(
    users.filter((user) => user.placementId && user.binaryPosition),
    (user) => `${user.placementId}:${user.binaryPosition}`
  ).map((group) => ({
    slot: `${shortId(group.key.split(':')[0])}:${group.key.split(':')[1]}`,
    count: group.count,
    occupants: group.records.map(sanitizeMember),
  }));

  const childPointerOccurrences = new Map<string, Array<{ parentId: string; side: SlotSide }>>();
  for (const tree of binaryTrees) {
    if (tree.leftChildId) {
      childPointerOccurrences.set(tree.leftChildId, [
        ...(childPointerOccurrences.get(tree.leftChildId) ?? []),
        { parentId: tree.userId, side: 'LEFT' },
      ]);
    }
    if (tree.rightChildId) {
      childPointerOccurrences.set(tree.rightChildId, [
        ...(childPointerOccurrences.get(tree.rightChildId) ?? []),
        { parentId: tree.userId, side: 'RIGHT' },
      ]);
    }
  }

  const childPointerDuplicates = [...childPointerOccurrences.entries()]
    .filter(([, occurrences]) => occurrences.length > 1)
    .map(([childId, occurrences]) => ({
      childId: shortId(childId),
      occurrences: occurrences.map((occurrence) => ({
        parentId: shortId(occurrence.parentId),
        side: occurrence.side,
      })),
    }));

  const brokenSponsorReferences = users
    .filter((user) => user.sponsorId && !userById.has(user.sponsorId))
    .map(sanitizeMember);
  const brokenPlacementReferences = users
    .filter((user) => user.placementId && !userById.has(user.placementId))
    .map(sanitizeMember);
  const brokenBinaryParentReferences = binaryTrees
    .filter((tree) => tree.parentId && !treeByUserId.has(tree.parentId))
    .map((tree) => ({
      userId: shortId(tree.userId),
      parentId: shortId(tree.parentId),
    }));

  const parentChildMismatches: any[] = [];
  for (const tree of binaryTrees) {
    if (!tree.parentId) continue;
    const parentTree = treeByUserId.get(tree.parentId);
    const user = userById.get(tree.userId);
    const pointerSide =
      parentTree?.leftChildId === tree.userId
        ? 'LEFT'
        : parentTree?.rightChildId === tree.userId
          ? 'RIGHT'
          : null;

    if (
      !pointerSide ||
      user?.placementId !== tree.parentId ||
      user?.binaryPosition !== pointerSide
    ) {
      parentChildMismatches.push({
        user: sanitizeMember(user),
        treeParentId: shortId(tree.parentId),
        parentPointerSide: pointerSide,
        userPlacementId: shortId(user?.placementId),
        userBinaryPosition: user?.binaryPosition ?? null,
      });
    }
  }

  const activationExpired =
    Boolean(activationCode?.expirationDate) && activationCode!.expirationDate! < generatedAt;
  const activationVerdict = !activationCode
    ? 'MISSING'
    : activationCode.status !== 'UNUSED'
      ? 'NOT_UNUSED'
      : activationExpired
        ? 'EXPIRED'
        : 'UNUSED_AND_ACTIVE';

  const qualificationProgress = [];
  for (const member of genuineMembers) {
    const currentStage = normalizeStageId(member.currentStage);
    const nextStage = getNextStage(currentStage);
    const progress = await calculateQualificationProgress(prisma, member.id, nextStage);
    const requiredStage = progress.requirementStage;

    qualificationProgress.push({
      member: sanitizeMember(member),
      currentStage,
      currentStageName: getStageDisplayName(currentStage),
      nextStage,
      nextStageName: nextStage ? getStageDisplayName(nextStage) : null,
      requirementStage: requiredStage,
      requiredContributorCount: progress.requiredContributorCount,
      qualifiedContributorCount: progress.qualifiedContributorCount,
      remainingContributorCount: progress.remainingContributorCount,
      leftQualifiedCount: progress.leftQualifiedCount ?? null,
      rightQualifiedCount: progress.rightQualifiedCount ?? null,
      selectedContributorIds: progress.selectedContributors.map((item) => shortId(item.memberId)),
      directSponsoredEligibleMembers:
        nextStage === STAGE_IDS.EMERALD_STAGE_1
          ? getEligibleDirectSponsoredMembers(member.id, users)
          : undefined,
      starterDirectReferralLegs:
        nextStage === STAGE_IDS.EMERALD_STAGE_1
          ? getEligibleDirectSponsoredMembersByLeg(member.id, users, treeByUserId)
          : undefined,
      firstThreeLevelPositions:
        nextStage &&
        requiredStage &&
        nextStage !== STAGE_IDS.STARTER_ENTRY_STAGE &&
        nextStage !== STAGE_IDS.EMERALD_STAGE_1
          ? collectFirstThreeLevelSlots(member.id, requiredStage, userById, treeByUserId)
          : undefined,
      appearsReadyForNextStage:
        Boolean(nextStage) &&
        progress.requiredContributorCount > 0 &&
        progress.qualifiedContributorCount >= progress.requiredContributorCount,
    });
  }

  const promotedWithoutHistory = genuineMembers
    .filter((member) => {
      const stage = normalizeStageId(member.currentStage);
      if (STAGE_RANK[stage] <= STAGE_RANK[STAGE_IDS.STARTER_ENTRY_STAGE]) return false;
      return !member.stageHistory.some((history) => normalizeStageId(history.toStage) === stage);
    })
    .map(sanitizeMember);

  const integrity = {
    duplicateReferralCodes,
    duplicateUserPlacementSlots,
    childPointerDuplicates,
    brokenSponsorReferences,
    brokenPlacementReferences,
    brokenBinaryParentReferences,
    parentChildMismatches,
    rootNodeCount: rootNodes.length,
    rootNodes: rootNodes.map(sanitizeMember),
    promotedWithoutMatchingStageHistory: promotedWithoutHistory,
  };

  const bootstrap = {
    bootstrapReferralCode: BOOTSTRAP_REFERRAL_CODE,
    bootstrapReferralOwner: bootstrapReferralOwner ? sanitizeMember(bootstrapReferralOwner) : null,
    normalMemberCountExcludingApprovedAdmins: genuineMembers.length,
    existingMemberRows: genuineMembers.map(sanitizeMember),
    approvedAdminRows: approvedAdmins.map(sanitizeMember),
    existingRootMember: rootNodes[0] ? sanitizeMember(rootNodes[0]) : null,
    rootSponsorId: rootNodes[0]?.sponsorId ? shortId(rootNodes[0].sponsorId) : null,
    rootBinaryParentId: rootNodes[0]?.binaryTree?.parentId
      ? shortId(rootNodes[0].binaryTree.parentId)
      : null,
  };

  const activation = {
    code: STARTUP_ACTIVATION_CODE,
    verdict: activationVerdict,
    exists: Boolean(activationCode),
    status: activationCode?.status ?? null,
    redeemed: Boolean(activationCode?.redeemedBy),
    redeemedBy: activationCode?.redeemedUser ? sanitizeMember(activationCode.redeemedUser) : null,
    redeemedDate: activationCode?.redeemedDate ?? null,
    expirationDate: activationCode?.expirationDate ?? null,
    expired: activationExpired,
    activationCodeCount,
    appearsDedicatedToBootstrap: activationCodeCount === 1 && Boolean(activationCode),
  };

  const readinessFailures = [
    genuineMembers.length > 0 ? 'MEMBER_RECORDS_ALREADY_EXIST' : null,
    rootNodes.length > 0 ? 'ROOT_BINARY_NODE_ALREADY_EXISTS' : null,
    bootstrapReferralOwner ? 'BOOTSTRAP_CODE_STORED_AS_USER_REFERRAL_CODE' : null,
    activationVerdict !== 'UNUSED_AND_ACTIVE' ? 'STARTUP_ACTIVATION_CODE_NOT_READY' : null,
    duplicateReferralCodes.length > 0 ? 'DUPLICATE_REFERRAL_CODES' : null,
    duplicateUserPlacementSlots.length > 0 ? 'DUPLICATE_USER_PLACEMENT_SLOTS' : null,
    childPointerDuplicates.length > 0 ? 'DUPLICATE_CHILD_POINTERS' : null,
    brokenSponsorReferences.length > 0 ? 'BROKEN_SPONSOR_REFERENCES' : null,
    brokenPlacementReferences.length > 0 ? 'BROKEN_PLACEMENT_REFERENCES' : null,
    brokenBinaryParentReferences.length > 0 ? 'BROKEN_BINARY_PARENT_REFERENCES' : null,
    parentChildMismatches.length > 0 ? 'PARENT_CHILD_POINTER_MISMATCHES' : null,
  ].filter(Boolean);

  return {
    generatedAt,
    database: {
      configured: databaseConfigured,
      urlMasked: databaseConfigured
        ? 'DATABASE_URL present (full value intentionally hidden)'
        : null,
    },
    verdict: readinessFailures.length === 0 ? 'READY_FROM_DATABASE_STATE' : 'NOT_READY',
    readinessFailures,
    bootstrap,
    activation,
    integrity,
    qualification: {
      modelExpected:
        'Activated members start at Starter. Starter completes only with at least one active direct sponsored member in each binary leg, advancing to Emerald. Silver through Diamond use the same fixed first 14 binary positions in the first three levels, with the required contributor stage increasing one stage at a time.',
      memberProgress: qualificationProgress,
    },
  };
}

export async function printReadinessReport(
  section?: keyof Awaited<ReturnType<typeof buildRootRegistrationReadinessReport>>
) {
  const prisma = new PrismaClient();
  try {
    const report = await buildRootRegistrationReadinessReport(prisma);
    console.log(JSON.stringify(section ? report[section] : report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
