import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { STAGE_IDS, type StageId, getStageDisplayName } from '../src/lib/qualification/constants';
import { getMemberBinaryLegCounts, resolveRelativeBinaryLeg } from '../src/lib/network/genealogy';

type Leg = 'LEFT' | 'RIGHT';

type FixtureMember = {
  id: string;
  sponsorId: string | null;
  placementId: string | null;
  parentId: string | null;
  binaryPosition: Leg | null;
  leftChildId: string | null;
  rightChildId: string | null;
  path: string;
  depth: number;
  status: string;
  activationStatus: string;
  stage: StageId;
  history: StageId[];
  contributors: string[];
};

const tests: string[] = [];

function test(name: string, fn: () => void) {
  fn();
  tests.push(name);
}

function makeMember(
  id: string,
  parent: FixtureMember | null,
  side: Leg | null,
  sponsorId: string | null,
  stage: StageId = STAGE_IDS.STARTER_ENTRY_STAGE,
  status = 'ACTIVE'
): FixtureMember {
  return {
    id,
    sponsorId,
    placementId: parent?.id ?? null,
    parentId: parent?.id ?? null,
    binaryPosition: side,
    leftChildId: null,
    rightChildId: null,
    path: parent ? `${parent.path}/${id}` : id,
    depth: parent ? parent.depth + 1 : 0,
    status,
    activationStatus: status === 'ACTIVE' ? 'USED' : 'UNUSED',
    stage,
    history: [stage],
    contributors: [],
  };
}

function addChild(
  members: Map<string, FixtureMember>,
  parent: FixtureMember,
  id: string,
  side: Leg,
  sponsorId: string | null = parent.id,
  stage: StageId = STAGE_IDS.STARTER_ENTRY_STAGE,
  status = 'ACTIVE'
) {
  const child = makeMember(id, parent, side, sponsorId, stage, status);
  const childKey = side === 'LEFT' ? 'leftChildId' : 'rightChildId';
  assert.equal(parent[childKey], null, `${parent.id} already has a ${side} child`);
  parent[childKey] = child.id;
  members.set(child.id, child);
  return child;
}

function makeFixture() {
  const members = new Map<string, FixtureMember>();
  const root = makeMember('platform-root', null, null, null);
  members.set(root.id, root);

  const left = addChild(members, root, 'root-left', 'LEFT', root.id);
  const right = addChild(members, root, 'root-right', 'RIGHT', root.id);
  const leftLeft = addChild(members, left, 'left-left', 'LEFT', left.id);
  const leftRightSponsoredByRoot = addChild(members, left, 'root-sponsored-deep', 'RIGHT', root.id);
  const rightLeft = addChild(members, right, 'right-left', 'LEFT', right.id);
  const inactive = addChild(
    members,
    leftLeft,
    'inactive-descendant',
    'LEFT',
    left.id,
    STAGE_IDS.STARTER_ENTRY_STAGE,
    'INACTIVE'
  );

  return {
    members,
    root,
    left,
    right,
    leftLeft,
    leftRightSponsoredByRoot,
    rightLeft,
    inactive,
  };
}

function directReferralsOf(members: Map<string, FixtureMember>, sponsor: FixtureMember) {
  return [...members.values()].filter((member) => member.sponsorId === sponsor.id);
}

function descendantsOf(members: Map<string, FixtureMember>, viewer: FixtureMember) {
  return [...members.values()].filter((member) => member.path.startsWith(`${viewer.path}/`));
}

function canViewTree(viewer: FixtureMember, target: FixtureMember) {
  return target.id === viewer.id || target.path.startsWith(`${viewer.path}/`);
}

function relativeLeg(viewer: FixtureMember, member: FixtureMember): Leg | null {
  if (!member.path.startsWith(`${viewer.path}/`)) return null;
  const [firstDescendantId] = member.path.slice(viewer.path.length + 1).split('/');
  if (firstDescendantId === viewer.leftChildId) return 'LEFT';
  if (firstDescendantId === viewer.rightChildId) return 'RIGHT';
  return null;
}

function legCounts(members: Map<string, FixtureMember>, viewer: FixtureMember) {
  const descendants = descendantsOf(members, viewer);
  return {
    total: descendants.length,
    left: descendants.filter((member) => relativeLeg(viewer, member) === 'LEFT').length,
    right: descendants.filter((member) => relativeLeg(viewer, member) === 'RIGHT').length,
  };
}

function promote(member: FixtureMember, toStage: StageId, contributors: FixtureMember[] = []) {
  if (!member.history.includes(toStage)) member.history.push(toStage);
  member.stage = toStage;
  member.contributors = [...new Set([...member.contributors, ...contributors.map((c) => c.id)])];
}

function genealogySnapshot(members: Map<string, FixtureMember>) {
  return [...members.values()]
    .map((member) => ({
      id: member.id,
      sponsorId: member.sponsorId,
      placementId: member.placementId,
      parentId: member.parentId,
      binaryPosition: member.binaryPosition,
      leftChildId: member.leftChildId,
      rightChildId: member.rightChildId,
      path: member.path,
      depth: member.depth,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function runVisibilityAssertions() {
  test('1. A Starter member sees both qualifying direct referrals', () => {
    const { members, root, left, right } = makeFixture();
    assert.deepEqual(
      directReferralsOf(members, root)
        .map((member) => member.id)
        .sort(),
      [left.id, right.id, 'root-sponsored-deep'].sort()
    );
  });

  test('2. After promotion to Emerald, the same two direct referrals remain visible', () => {
    const { members, root, left, right } = makeFixture();
    const before = directReferralsOf(members, root)
      .map((member) => member.id)
      .sort();
    promote(root, STAGE_IDS.EMERALD_STAGE_1, [left, right]);
    assert.deepEqual(
      directReferralsOf(members, root)
        .map((member) => member.id)
        .sort(),
      before
    );
  });

  test('3. After promotion to Silver, earlier descendants and contributors remain visible', () => {
    const { members, root, left, right, leftLeft } = makeFixture();
    promote(root, STAGE_IDS.EMERALD_STAGE_1, [left, right]);
    const earlierContributors = [...root.contributors];
    promote(root, STAGE_IDS.SILVER_STAGE_2, [leftLeft]);
    const visibleIds = descendantsOf(members, root).map((member) => member.id);
    for (const contributorId of earlierContributors) {
      assert.ok(visibleIds.includes(contributorId));
    }
  });

  test('4. A direct referral remains in the direct-referral list after the sponsor advances', () => {
    const { members, root, left } = makeFixture();
    promote(root, STAGE_IDS.GOLD_STAGE_3);
    assert.ok(directReferralsOf(members, root).some((member) => member.id === left.id));
  });

  test('5. Indirect binary descendants remain visible after promotion', () => {
    const { members, root, leftLeft } = makeFixture();
    promote(root, STAGE_IDS.SILVER_STAGE_2);
    assert.ok(descendantsOf(members, root).some((member) => member.id === leftLeft.id));
  });

  test('6. Left-leg and right-leg descendant counts do not reset after promotion', () => {
    const { members, root } = makeFixture();
    const before = legCounts(members, root);
    promote(root, STAGE_IDS.EMERALD_STAGE_1);
    promote(root, STAGE_IDS.SILVER_STAGE_2);
    assert.deepEqual(legCounts(members, root), before);
  });

  test('7. A lower-stage downline remains visible to a higher-stage upline', () => {
    const { members, root, left } = makeFixture();
    promote(root, STAGE_IDS.GOLD_STAGE_3);
    assert.equal(left.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
    assert.ok(descendantsOf(members, root).some((member) => member.id === left.id));
  });

  test('8. A higher-stage downline remains visible to a lower-stage upline', () => {
    const { members, root, right } = makeFixture();
    promote(right, STAGE_IDS.DIAMOND_STAGE_6_FINAL);
    assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
    assert.ok(descendantsOf(members, root).some((member) => member.id === right.id));
  });

  test('9. A downline may outrank their sponsor without disappearing', () => {
    const { members, root, right } = makeFixture();
    promote(right, STAGE_IDS.SAPPHIRE_STAGE_5);
    assert.ok(directReferralsOf(members, root).some((member) => member.id === right.id));
    assert.ok(descendantsOf(members, root).some((member) => member.id === right.id));
  });

  test('10. An inactive descendant remains visible with the correct status', () => {
    const { members, root, inactive } = makeFixture();
    const visibleInactive = descendantsOf(members, root).find(
      (member) => member.id === inactive.id
    );
    assert.equal(visibleInactive?.status, 'INACTIVE');
  });

  test('11. Stage filtering changes only the displayed subset and not stored genealogy', () => {
    const { members, root, right } = makeFixture();
    promote(right, STAGE_IDS.EMERALD_STAGE_1);
    const before = genealogySnapshot(members);
    const emeraldSubset = descendantsOf(members, root).filter(
      (member) => member.stage === STAGE_IDS.EMERALD_STAGE_1
    );
    assert.deepEqual(
      emeraldSubset.map((member) => member.id),
      [right.id]
    );
    assert.deepEqual(genealogySnapshot(members), before);
  });

  test('12. The binary tree is calculated relative to the logged-in member', () => {
    const { members, left, leftLeft, leftRightSponsoredByRoot } = makeFixture();
    const leftVisibleIds = descendantsOf(members, left)
      .map((member) => member.id)
      .sort();
    assert.deepEqual(
      leftVisibleIds,
      [leftLeft.id, leftRightSponsoredByRoot.id, 'inactive-descendant'].sort()
    );
  });

  test('13. One branch cannot expose unrelated members from another branch', () => {
    const { left, right, root } = makeFixture();
    assert.equal(canViewTree(left, right), false);
    assert.equal(canViewTree(right, left), false);
    assert.equal(canViewTree(root, right), true);
  });

  test('14. Promotion processing does not mutate genealogy fields', () => {
    const { members, root } = makeFixture();
    const before = genealogySnapshot(members);
    promote(root, STAGE_IDS.EMERALD_STAGE_1);
    promote(root, STAGE_IDS.SILVER_STAGE_2);
    assert.deepEqual(genealogySnapshot(members), before);
  });

  test('15. Re-running promotion processing does not change downline visibility', () => {
    const { members, root } = makeFixture();
    promote(root, STAGE_IDS.EMERALD_STAGE_1);
    const first = descendantsOf(members, root)
      .map((member) => member.id)
      .sort();
    promote(root, STAGE_IDS.EMERALD_STAGE_1);
    assert.deepEqual(
      descendantsOf(members, root)
        .map((member) => member.id)
        .sort(),
      first
    );
  });

  test('16. The single platform root continues to see the entire legitimate network', () => {
    const { members, root } = makeFixture();
    assert.equal(descendantsOf(members, root).length, members.size - 1);
  });

  test('17. A non-root member sees only legitimate descendants below their own position', () => {
    const { members, root, left, leftLeft } = makeFixture();
    const visibleIds = descendantsOf(members, left).map((member) => member.id);
    assert.ok(visibleIds.includes(leftLeft.id));
    assert.ok(!visibleIds.includes(root.id));
    assert.ok(!visibleIds.includes('root-right'));
  });

  test('18. Sponsor and placement parent may differ without either relationship disappearing', () => {
    const { members, root, left, leftRightSponsoredByRoot } = makeFixture();
    assert.equal(leftRightSponsoredByRoot.sponsorId, root.id);
    assert.equal(leftRightSponsoredByRoot.placementId, left.id);
    assert.ok(
      directReferralsOf(members, root).some((member) => member.id === leftRightSponsoredByRoot.id)
    );
    assert.ok(
      descendantsOf(members, left).some((member) => member.id === leftRightSponsoredByRoot.id)
    );
  });

  test('19. A member advancing beyond their sponsor does not affect either network view', () => {
    const { members, left, leftLeft } = makeFixture();
    promote(leftLeft, STAGE_IDS.DIAMOND_STAGE_6_FINAL);
    assert.equal(left.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
    assert.ok(directReferralsOf(members, left).some((member) => member.id === leftLeft.id));
    assert.ok(descendantsOf(members, left).some((member) => member.id === leftLeft.id));
  });

  test('20. Mobile dashboard has static overflow containment for common phone widths', () => {
    const files = [
      'src/app/user-dashboard/network/tree/page.tsx',
      'src/app/user-dashboard/network/downline/page.tsx',
      'src/app/user-dashboard/network/referrals/page.tsx',
      'src/app/user-dashboard/components/BinaryTreeSection.tsx',
    ];
    const combined = files.map((file) => readFileSync(resolve(file), 'utf8')).join('\n');
    assert.match(combined, /overflow-x-auto/);
    assert.match(combined, /max-w-full/);
    assert.match(combined, /break-all|truncate/);
    assert.match(combined, /min-h-1[01]/);
  });
}

function shortId(id: string | null | undefined) {
  return id ? `${id.slice(0, 8)}...` : null;
}

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

function maskCode(code: string | null | undefined) {
  if (!code) return null;
  if (code.length <= 4) return '****';
  return `${code.slice(0, 4)}***${code.slice(-2)}`;
}

function sanitizeUser(user: any) {
  if (!user) return null;
  return {
    id: shortId(user.id),
    name: maskName(user.name),
    email: maskEmail(user.email),
    referralCode: maskCode(user.referralCode),
    status: user.status ?? null,
    currentStage: user.currentStage ?? null,
    currentStageName: user.currentStage ? getStageDisplayName(user.currentStage) : null,
  };
}

function collectPointerDescendantIds(
  userId: string,
  treeByUserId: Map<string, any>,
  seen = new Set<string>()
) {
  const tree = treeByUserId.get(userId);
  if (!tree) return seen;

  for (const childId of [tree.leftChildId, tree.rightChildId].filter(Boolean) as string[]) {
    if (seen.has(childId)) continue;
    seen.add(childId);
    collectPointerDescendantIds(childId, treeByUserId, seen);
  }

  return seen;
}

function buildGlobalIntegrityIssues(users: any[], treeByUserId: Map<string, any>) {
  const issues: any[] = [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const rootNodes = users.filter((user) => !user.binaryTree?.parentId);

  if (rootNodes.length !== 1) {
    issues.push({
      type: 'ROOT_COUNT_INVALID',
      expected: 1,
      actual: rootNodes.length,
      roots: rootNodes.map((user) => shortId(user.id)),
    });
  }

  const pathCounts = new Map<string, string[]>();
  for (const user of users) {
    const path = user.binaryTree?.path;
    if (!path) continue;
    pathCounts.set(path, [...(pathCounts.get(path) ?? []), user.id]);
  }
  for (const [path, ids] of pathCounts.entries()) {
    if (ids.length > 1) {
      issues.push({ type: 'DUPLICATE_BINARY_PATH', path, members: ids.map(shortId) });
    }
  }

  for (const user of users) {
    if (user.sponsorId && !userById.has(user.sponsorId)) {
      issues.push({
        type: 'BROKEN_SPONSOR_REFERENCE',
        member: shortId(user.id),
        sponsorId: shortId(user.sponsorId),
      });
    }
    if (user.placementId && !userById.has(user.placementId)) {
      issues.push({
        type: 'BROKEN_PLACEMENT_REFERENCE',
        member: shortId(user.id),
        placementId: shortId(user.placementId),
      });
    }

    const tree = user.binaryTree;
    if (!tree) {
      issues.push({ type: 'MISSING_BINARY_TREE', member: shortId(user.id) });
      continue;
    }

    if ((tree.parentId ?? null) !== (user.placementId ?? null)) {
      issues.push({
        type: 'PLACEMENT_PARENT_MISMATCH',
        member: shortId(user.id),
        userPlacementId: shortId(user.placementId),
        binaryParentId: shortId(tree.parentId),
      });
    }

    const parentTree = tree.parentId ? treeByUserId.get(tree.parentId) : null;
    if (tree.parentId && !parentTree) {
      issues.push({
        type: 'BROKEN_BINARY_PARENT',
        member: shortId(user.id),
        binaryParentId: shortId(tree.parentId),
      });
    }

    if (parentTree) {
      const pointerSide =
        parentTree.leftChildId === user.id
          ? 'LEFT'
          : parentTree.rightChildId === user.id
            ? 'RIGHT'
            : null;
      if (!pointerSide) {
        issues.push({
          type: 'PARENT_CHILD_POINTER_MISSING',
          member: shortId(user.id),
          parent: shortId(tree.parentId),
        });
      }
      if (user.binaryPosition && pointerSide && user.binaryPosition !== pointerSide) {
        issues.push({
          type: 'BINARY_POSITION_MISMATCH',
          member: shortId(user.id),
          binaryPosition: user.binaryPosition,
          pointerSide,
        });
      }
      if (!tree.path.startsWith(`${parentTree.path}/`)) {
        issues.push({
          type: 'PATH_NOT_UNDER_PARENT',
          member: shortId(user.id),
          parent: shortId(tree.parentId),
        });
      }
      if (tree.depth !== parentTree.depth + 1) {
        issues.push({
          type: 'DEPTH_NOT_PARENT_PLUS_ONE',
          member: shortId(user.id),
          depth: tree.depth,
          parentDepth: parentTree.depth,
        });
      }
    }
  }

  return issues;
}

async function buildDatabaseReport(prisma: PrismaClient) {
  const users = await prisma.user.findMany({
    where: {
      role: 'MEMBER',
      binaryTree: { isNot: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      currentStage: true,
      referralCode: true,
      sponsorId: true,
      placementId: true,
      binaryPosition: true,
      createdAt: true,
      activationCode: {
        select: {
          status: true,
        },
      },
      sponsor: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          currentStage: true,
          referralCode: true,
        },
      },
      placement: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          currentStage: true,
          referralCode: true,
        },
      },
      binaryTree: {
        select: {
          userId: true,
          parentId: true,
          leftChildId: true,
          rightChildId: true,
          path: true,
          depth: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  type DatabaseTree = NonNullable<(typeof users)[number]['binaryTree']>;
  const userById = new Map(users.map((user) => [user.id, user]));
  const treeByUserId = new Map<string, DatabaseTree>();
  for (const user of users) {
    if (user.binaryTree) {
      treeByUserId.set(user.id, user.binaryTree);
    }
  }
  const rootNodes = users.filter((user) => !user.binaryTree?.parentId);
  const platformRoot = rootNodes[0] ?? null;
  const platformRootTree = platformRoot?.binaryTree ?? null;
  const globalIntegrityIssues = buildGlobalIntegrityIssues(users, treeByUserId);

  const memberReports = await Promise.all(
    users.map(async (user) => {
      const tree = user.binaryTree;
      const pathDescendants = users.filter(
        (candidate) =>
          candidate.id !== user.id &&
          Boolean(tree?.path) &&
          candidate.binaryTree?.path.startsWith(`${tree!.path}/`)
      );
      const directReferrals = users.filter((candidate) => candidate.sponsorId === user.id);
      const pointerDescendantIds = collectPointerDescendantIds(user.id, treeByUserId);
      const pathDescendantIds = new Set(pathDescendants.map((candidate) => candidate.id));
      const missingExpectedDescendants = [...pointerDescendantIds]
        .filter((id) => !pathDescendantIds.has(id))
        .map((id) => sanitizeUser(userById.get(id)));
      const unexpectedUnrelatedMembers = pathDescendants
        .filter((candidate) => !pointerDescendantIds.has(candidate.id))
        .map(sanitizeUser);
      const legCounts = await getMemberBinaryLegCounts(prisma, user.id);

      return {
        member: sanitizeUser(user),
        isPlatformRoot: platformRoot?.id === user.id,
        sponsorId: shortId(user.sponsorId),
        sponsor: sanitizeUser(user.sponsor),
        placementParentId: shortId(user.placementId),
        placementParent: sanitizeUser(user.placement),
        binaryParentId: shortId(tree?.parentId),
        binaryPosition: user.binaryPosition,
        directReferralCount: directReferrals.length,
        totalBinaryDescendantCount: legCounts.totalDescendantCount,
        activeBinaryDescendantCount: legCounts.activeDescendantCount,
        leftLegDescendantCount: legCounts.leftLegCount,
        rightLegDescendantCount: legCounts.rightLegCount,
        currentStage: user.currentStage,
        currentStageName: getStageDisplayName(user.currentStage),
        activationStatus: user.activationCode?.status ?? null,
        visibleDirectReferrals: directReferrals.map((referral) => ({
          ...sanitizeUser(referral),
          binaryLegRelativeToSponsor: resolveRelativeBinaryLeg(tree, referral.binaryTree),
          placementParentId: shortId(referral.placementId),
          binaryParentId: shortId(referral.binaryTree?.parentId),
          binaryPosition: referral.binaryPosition,
        })),
        visibleBinaryDescendants: pathDescendants.map((descendant) => ({
          ...sanitizeUser(descendant),
          binaryLegRelativeToMember: resolveRelativeBinaryLeg(tree, descendant.binaryTree),
          sponsorId: shortId(descendant.sponsorId),
          placementParentId: shortId(descendant.placementId),
          binaryParentId: shortId(descendant.binaryTree?.parentId),
          binaryPosition: descendant.binaryPosition,
          depthRelativeToMember:
            tree && descendant.binaryTree ? descendant.binaryTree.depth - tree.depth : null,
        })),
        missingExpectedDescendants,
        unexpectedUnrelatedMembers,
        genealogyIntegrityIssues: globalIntegrityIssues.filter(
          (issue) => issue.member === shortId(user.id)
        ),
      };
    })
  );

  const rootDescendants = platformRootTree
    ? users.filter(
        (user) =>
          user.id !== platformRoot.id &&
          user.binaryTree?.path.startsWith(`${platformRootTree.path}/`)
      )
    : [];

  const productionThreeMemberCheck = {
    status:
      rootNodes.length === 1 && users.length === 3 && rootDescendants.length === 2
        ? 'PASS'
        : 'FAIL',
    genuineMemberCount: users.length,
    rootCount: rootNodes.length,
    root: sanitizeUser(platformRoot),
    additionalMembersBeneathRoot: rootDescendants.map((member) => ({
      member: sanitizeUser(member),
      personallySponsoredByRoot: member.sponsorId === platformRoot?.id,
      sponsorId: shortId(member.sponsorId),
      sponsor: sanitizeUser(member.sponsor),
      placementParentId: shortId(member.placementId),
      placementParent: sanitizeUser(member.placement),
      binaryParentId: shortId(member.binaryTree?.parentId),
      binaryPosition: member.binaryPosition,
      legRelativeToRoot: resolveRelativeBinaryLeg(platformRootTree, member.binaryTree),
    })),
    rootCanSeeAllAdditionalMembers:
      Boolean(platformRootTree) &&
      rootDescendants.every((member) =>
        member.binaryTree?.path.startsWith(`${platformRootTree!.path}/`)
      ),
    additionalMembersIncorrectlyTreatedAsRoots: rootDescendants
      .filter((member) => !member.binaryTree?.parentId)
      .map(sanitizeUser),
  };

  const hardFailures = [
    ...globalIntegrityIssues,
    ...(productionThreeMemberCheck.status === 'PASS'
      ? []
      : [{ type: 'PRODUCTION_THREE_MEMBER_SHAPE_MISMATCH', productionThreeMemberCheck }]),
    ...memberReports.flatMap((report) => [
      ...report.missingExpectedDescendants.map((member) => ({
        type: 'MISSING_EXPECTED_DESCENDANT',
        viewer: report.member?.id,
        member,
      })),
      ...report.unexpectedUnrelatedMembers.map((member) => ({
        type: 'UNEXPECTED_UNRELATED_MEMBER_IN_PATH_SCOPE',
        viewer: report.member?.id,
        member,
      })),
    ]),
  ];

  return {
    generatedAt: new Date().toISOString(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    memberCount: users.length,
    platformRootCount: rootNodes.length,
    globalIntegrityIssues,
    productionThreeMemberCheck,
    members: memberReports,
    hardFailures,
  };
}

async function main() {
  runVisibilityAssertions();

  const prisma = new PrismaClient();
  try {
    const databaseReport = await buildDatabaseReport(prisma);
    const report = {
      generatedAt: new Date().toISOString(),
      assertionCount: tests.length,
      assertions: tests,
      mobileStaticWidthsChecked: [360, 390, 414],
      database: databaseReport,
      verdict: databaseReport.hardFailures.length === 0 ? 'PASS' : 'FAIL',
    };

    console.log(JSON.stringify(report, null, 2));

    if (databaseReport.hardFailures.length > 0) {
      console.error(
        `Downline visibility verification failed with ${databaseReport.hardFailures.length} hard issue(s).`
      );
      process.exitCode = 1;
      return;
    }

    console.log(`Downline visibility verification passed (${tests.length} assertions).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Downline visibility verification failed:', error);
  process.exitCode = 1;
});
