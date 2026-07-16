import assert from 'node:assert/strict';
import {
  REQUIRED_DESCENDANT_COUNT,
  STAGE_CONFIG,
  STAGE_IDS,
  STAGE_RANK,
  StageId,
  getNextStage,
  isStageAtLeast,
  normalizeStageId,
} from '../src/lib/qualification/constants';
import {
  getAncestorIdsFromBinaryPath,
  selectDeterministicContributors,
} from '../src/lib/qualification/engine';

type Leg = 'left' | 'right';

type Member = {
  id: string;
  parentId: string | null;
  sponsorId: string | null;
  leftChildId?: string | null;
  rightChildId?: string | null;
  path: string;
  depth: number;
  createdAt: Date;
  role: string;
  status: string;
  activated: boolean;
  stage: StageId;
  history: StageId[];
  contributorsByStage: Partial<Record<StageId, string[]>>;
  rewards: StageId[];
  loans: { stage: StageId; principal: number; interestAmount: number; totalRepayable: number }[];
};

const tests: string[] = [];

function test(name: string, fn: () => void) {
  fn();
  tests.push(name);
}

function buildMember(
  id: string,
  parent: Member | null,
  createdAt: Date,
  sponsorId: string | null = parent?.id ?? null,
  stage: StageId = STAGE_IDS.STARTER_ENTRY_STAGE
): Member {
  return {
    id,
    parentId: parent?.id ?? null,
    sponsorId,
    path: parent ? `${parent.path}/${id}` : `root/${id}`,
    depth: parent ? parent.depth + 1 : 0,
    createdAt,
    role: 'MEMBER',
    status: 'ACTIVE',
    activated: true,
    stage,
    history: [],
    contributorsByStage: {},
    rewards: [],
    loans: [],
  };
}

function addChild(
  members: Map<string, Member>,
  parent: Member,
  id: string,
  side: Leg,
  sponsorId: string | null = parent.id,
  stage: StageId = STAGE_IDS.STARTER_ENTRY_STAGE
) {
  const key = side === 'left' ? 'leftChildId' : 'rightChildId';
  if (parent[key]) {
    throw new Error(`${parent.id} already has a ${side} child`);
  }

  const child = buildMember(
    id,
    parent,
    new Date(Date.UTC(2026, 0, members.size + 1)),
    sponsorId,
    stage
  );
  members.set(child.id, child);
  parent[key] = child.id;
  return child;
}

function addSponsoredMember(
  members: Map<string, Member>,
  sponsor: Member,
  id: string,
  placementParent: Member,
  side: Leg,
  stage: StageId = STAGE_IDS.STARTER_ENTRY_STAGE
) {
  return addChild(members, placementParent, id, side, sponsor.id, stage);
}

function makeRoot(stage: StageId = STAGE_IDS.STARTER_ENTRY_STAGE) {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)), null, stage);
  members.set(root.id, root);
  return { members, root };
}

function descendantsOf(members: Map<string, Member>, member: Member) {
  return [...members.values()].filter((candidate) => candidate.path.startsWith(`${member.path}/`));
}

function resolveRelativeLeg(root: Member, member: Member): Leg | null {
  if (!member.path.startsWith(`${root.path}/`)) return null;
  const [firstDescendantId] = member.path.slice(root.path.length + 1).split('/');
  if (firstDescendantId === root.leftChildId) return 'left';
  if (firstDescendantId === root.rightChildId) return 'right';
  return null;
}

function isEligibleActiveStarterReferral(member: Member) {
  return (
    member.role === 'MEMBER' &&
    member.status === 'ACTIVE' &&
    member.activated &&
    isStageAtLeast(member.stage, STAGE_IDS.STARTER_ENTRY_STAGE)
  );
}

function countStarterDirectReferralsByLeg(members: Map<string, Member>, sponsor: Member) {
  const byLeg: Record<Leg, Member[]> = { left: [], right: [] };
  const ignored: Member[] = [];

  for (const member of members.values()) {
    if (member.id === sponsor.id || member.sponsorId !== sponsor.id) continue;
    if (!isEligibleActiveStarterReferral(member)) continue;

    const leg = resolveRelativeLeg(sponsor, member);
    if (leg) {
      byLeg[leg].push(member);
    } else {
      ignored.push(member);
    }
  }

  return { ...byLeg, ignored };
}

function countEligibleDescendants(
  members: Map<string, Member>,
  member: Member,
  requiredStage: StageId
) {
  const unique = new Map<string, Member>();
  for (const descendant of descendantsOf(members, member)) {
    if (
      descendant.role === 'MEMBER' &&
      descendant.status === 'ACTIVE' &&
      isStageAtLeast(descendant.stage, requiredStage)
    ) {
      unique.set(descendant.id, descendant);
    }
  }
  return [...unique.values()];
}

function countEligibleFirstThreeLevelTree(
  members: Map<string, Member>,
  member: Member,
  requiredStage: StageId
) {
  const requiredPerLeg = REQUIRED_DESCENDANT_COUNT / 2;
  const byLeg: Record<Leg, Map<string, Member>> = {
    left: new Map<string, Member>(),
    right: new Map<string, Member>(),
  };
  let frontier: Array<{ id: string; leg: Leg; depth: number }> = [
    ...(member.leftChildId ? [{ id: member.leftChildId, leg: 'left' as const, depth: 1 }] : []),
    ...(member.rightChildId ? [{ id: member.rightChildId, leg: 'right' as const, depth: 1 }] : []),
  ];

  for (let level = 1; level <= 3 && frontier.length > 0; level++) {
    const positionById = new Map(frontier.map((position) => [position.id, position]));
    const nextFrontier: typeof frontier = [];

    for (const position of positionById.values()) {
      const descendant = members.get(position.id);
      if (!descendant) continue;

      if (
        descendant.role === 'MEMBER' &&
        descendant.status === 'ACTIVE' &&
        isStageAtLeast(descendant.stage, requiredStage)
      ) {
        byLeg[position.leg].set(descendant.id, descendant);
      }

      if (level < 3) {
        if (descendant.leftChildId) {
          nextFrontier.push({
            id: descendant.leftChildId,
            leg: position.leg,
            depth: position.depth + 1,
          });
        }
        if (descendant.rightChildId) {
          nextFrontier.push({
            id: descendant.rightChildId,
            leg: position.leg,
            depth: position.depth + 1,
          });
        }
      }
    }

    frontier = nextFrontier;
  }

  return {
    left: [...byLeg.left.values()],
    right: [...byLeg.right.values()],
    qualifiedCount:
      Math.min(byLeg.left.size, requiredPerLeg) + Math.min(byLeg.right.size, requiredPerLeg),
  };
}

function promoteOne(members: Map<string, Member>, member: Member) {
  const nextStage = getNextStage(member.stage);
  if (!nextStage) return false;
  let selectedContributors: Member[] = [];

  if (nextStage === STAGE_IDS.STARTER_ENTRY_STAGE) {
    selectedContributors = [];
  } else if (nextStage === STAGE_IDS.EMERALD_STAGE_1) {
    const progress = countStarterDirectReferralsByLeg(members, member);
    if (progress.left.length < 1 || progress.right.length < 1) return false;
    selectedContributors = [progress.left[0], progress.right[0]];
  } else {
    const requiredStage = STAGE_CONFIG[nextStage].requiredContributorStage!;
    const progress = countEligibleFirstThreeLevelTree(members, member, requiredStage);
    if (progress.qualifiedCount < REQUIRED_DESCENDANT_COUNT) return false;
    selectedContributors = [
      ...progress.left.slice(0, REQUIRED_DESCENDANT_COUNT / 2),
      ...progress.right.slice(0, REQUIRED_DESCENDANT_COUNT / 2),
    ];
  }

  if (!member.history.includes(nextStage)) member.history.push(nextStage);
  if (!member.contributorsByStage[nextStage]) {
    member.contributorsByStage[nextStage] = selectedContributors.map(
      (contributor) => contributor.id
    );
  }
  if (STAGE_CONFIG[nextStage].hasReward && !member.rewards.includes(nextStage)) {
    member.rewards.push(nextStage);
  }
  if (STAGE_CONFIG[nextStage].loan && !member.loans.some((loan) => loan.stage === nextStage)) {
    const principal = STAGE_CONFIG[nextStage].loan!.principal;
    const interestAmount = principal * STAGE_CONFIG[nextStage].loan!.interestRate;
    member.loans.push({
      stage: nextStage,
      principal,
      interestAmount,
      totalRepayable: principal + interestAmount,
    });
  }
  member.stage = nextStage;
  return true;
}

function evaluate(members: Map<string, Member>, member: Member) {
  let promoted = false;
  while (promoteOne(members, member)) {
    promoted = true;
  }
  return promoted;
}

function cascade(members: Map<string, Member>, member: Member) {
  const didPromote = evaluate(members, member);
  if (!didPromote) return;
  for (const ancestorId of getAncestorIdsFromBinaryPath(member.path, member.id)) {
    evaluate(members, members.get(ancestorId)!);
  }
}

function cascadeWithTrace(members: Map<string, Member>, member: Member) {
  const didPromote = evaluate(members, member);
  const reevaluatedAncestors: string[] = [];
  if (!didPromote) return reevaluatedAncestors;

  for (const ancestorId of getAncestorIdsFromBinaryPath(member.path, member.id)) {
    reevaluatedAncestors.push(ancestorId);
    evaluate(members, members.get(ancestorId)!);
  }

  return reevaluatedAncestors;
}

function addQualifiedFirstThreeLevelTree(
  members: Map<string, Member>,
  root: Member,
  stage: StageId
) {
  const left = addChild(members, root, `${stage}-left`, 'left', root.id, stage);
  const right = addChild(members, root, `${stage}-right`, 'right', root.id, stage);
  const level1 = [left, right];
  const level2: Member[] = [];

  for (const parent of level1) {
    level2.push(addChild(members, parent, `${stage}-${parent.id}-left`, 'left', parent.id, stage));
    level2.push(
      addChild(members, parent, `${stage}-${parent.id}-right`, 'right', parent.id, stage)
    );
  }

  for (const parent of level2) {
    addChild(members, parent, `${stage}-${parent.id}-left`, 'left', parent.id, stage);
    addChild(members, parent, `${stage}-${parent.id}-right`, 'right', parent.id, stage);
  }
}

test('Stage order: active members enter Starter before Emerald', () => {
  assert.deepEqual(
    [
      getNextStage(STAGE_IDS.REGISTERED_ACTIVE),
      getNextStage(STAGE_IDS.STARTER_ENTRY_STAGE),
      getNextStage(STAGE_IDS.EMERALD_STAGE_1),
      getNextStage(STAGE_IDS.SILVER_STAGE_2),
      getNextStage(STAGE_IDS.GOLD_STAGE_3),
      getNextStage(STAGE_IDS.JASPER_STAGE_4),
      getNextStage(STAGE_IDS.SAPPHIRE_STAGE_5),
      getNextStage(STAGE_IDS.DIAMOND_STAGE_6_FINAL),
    ],
    [
      STAGE_IDS.STARTER_ENTRY_STAGE,
      STAGE_IDS.EMERALD_STAGE_1,
      STAGE_IDS.SILVER_STAGE_2,
      STAGE_IDS.GOLD_STAGE_3,
      STAGE_IDS.JASPER_STAGE_4,
      STAGE_IDS.SAPPHIRE_STAGE_5,
      STAGE_IDS.DIAMOND_STAGE_6_FINAL,
      null,
    ]
  );
});

test('Stage labels: Starter is entry stage and Emerald is Stage 1', () => {
  assert.equal(STAGE_RANK[STAGE_IDS.REGISTERED_ACTIVE], 0);
  assert.equal(STAGE_CONFIG[STAGE_IDS.STARTER_ENTRY_STAGE].stageNumber, null);
  assert.equal(STAGE_CONFIG[STAGE_IDS.STARTER_ENTRY_STAGE].requiredCount, 0);
  assert.match(STAGE_CONFIG[STAGE_IDS.STARTER_ENTRY_STAGE].displayName, /Entry Stage/);
  assert.equal(STAGE_CONFIG[STAGE_IDS.EMERALD_STAGE_1].stageNumber, 1);
  assert.equal(STAGE_CONFIG[STAGE_IDS.EMERALD_STAGE_1].requiredCount, 2);
  assert.equal(STAGE_CONFIG[STAGE_IDS.SILVER_STAGE_2].requiredCount, REQUIRED_DESCENDANT_COUNT);
});

test('Legacy labels map to the same current-stage meaning as dashboard labels', () => {
  assert.equal(normalizeStageId('STARTER'), STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(normalizeStageId('EMERALD'), STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(normalizeStageId('DIAMOND'), STAGE_IDS.DIAMOND_STAGE_6_FINAL);
});

test('Starter requirement: zero referrals does not complete Starter', () => {
  const { members, root } = makeRoot();
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 0);
  assert.equal(progress.right.length, 0);
  assert.equal(promoteOne(members, root), false);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
});

test('Starter requirement: one active referral on the left does not complete Starter', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 1);
  assert.equal(progress.right.length, 0);
  assert.equal(promoteOne(members, root), false);
});

test('Starter requirement: one active referral on the right does not complete Starter', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'right-direct', root, 'right');
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 0);
  assert.equal(progress.right.length, 1);
  assert.equal(promoteOne(members, root), false);
});

test('Starter requirement: two active referrals both in the left leg do not complete Starter', () => {
  const { members, root } = makeRoot();
  const left = addSponsoredMember(members, root, 'left-direct-1', root, 'left');
  addSponsoredMember(members, root, 'left-direct-2', left, 'left');
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 2);
  assert.equal(progress.right.length, 0);
  assert.equal(promoteOne(members, root), false);
});

test('Starter requirement: two active referrals both in the right leg do not complete Starter', () => {
  const { members, root } = makeRoot();
  const right = addSponsoredMember(members, root, 'right-direct-1', root, 'right');
  addSponsoredMember(members, root, 'right-direct-2', right, 'right');
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 0);
  assert.equal(progress.right.length, 2);
  assert.equal(promoteOne(members, root), false);
});

test('Starter requirement: one active direct referral in each leg completes Starter', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  addSponsoredMember(members, root, 'right-direct', root, 'right');
  assert.equal(promoteOne(members, root), true);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
});

test('Starter requirement: inactive referral does not count', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  const inactiveRight = addSponsoredMember(members, root, 'right-inactive', root, 'right');
  inactiveRight.status = 'INACTIVE';
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 1);
  assert.equal(progress.right.length, 0);
  assert.equal(promoteOne(members, root), false);
});

test('Starter requirement: a placed member sponsored by someone else does not count', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  addChild(members, root, 'right-placed-other-sponsor', 'right', 'external-sponsor');
  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 1);
  assert.equal(progress.right.length, 0);
  assert.equal(promoteOne(members, root), false);
});

test('Starter requirement: a directly sponsored member placed deeper in the correct leg counts when inside the sponsor subtree', () => {
  const { members, root } = makeRoot();
  const leftHolder = addChild(members, root, 'left-placement-holder', 'left', 'external-sponsor');
  addSponsoredMember(members, root, 'left-direct-deeper', leftHolder, 'left');
  addSponsoredMember(members, root, 'right-direct', root, 'right');
  const outside = buildMember('outside-sponsored', null, new Date(Date.UTC(2026, 1, 1)), root.id);
  members.set(outside.id, outside);

  const progress = countStarterDirectReferralsByLeg(members, root);
  assert.equal(progress.left.length, 1);
  assert.equal(progress.right.length, 1);
  assert.equal(progress.ignored.length, 1);
  assert.equal(promoteOne(members, root), true);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
});

test('Starter requirement: completing Starter advances to Emerald exactly once', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  addSponsoredMember(members, root, 'right-direct', root, 'right');
  promoteOne(members, root);
  promoteOne(members, root);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(root.history.filter((stage) => stage === STAGE_IDS.EMERALD_STAGE_1).length, 1);
});

test('Starter requirement: promotion and reward process remains idempotent', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  addSponsoredMember(members, root, 'right-direct', root, 'right');
  evaluate(members, root);
  evaluate(members, root);
  assert.equal(root.history.filter((stage) => stage === STAGE_IDS.EMERALD_STAGE_1).length, 1);
  assert.equal(root.rewards.filter((stage) => stage === STAGE_IDS.EMERALD_STAGE_1).length, 1);
  assert.deepEqual(root.contributorsByStage[STAGE_IDS.EMERALD_STAGE_1], [
    'left-direct',
    'right-direct',
  ]);
});

const fixedStageRequirements: [string, StageId, StageId][] = [
  [
    'Emerald to Silver requires the fixed first 14 positions to have completed Starter',
    STAGE_IDS.SILVER_STAGE_2,
    STAGE_IDS.EMERALD_STAGE_1,
  ],
  [
    'Silver to Gold requires the fixed first 14 positions to have completed Emerald',
    STAGE_IDS.GOLD_STAGE_3,
    STAGE_IDS.SILVER_STAGE_2,
  ],
  [
    'Gold to Jasper requires the fixed first 14 positions to have completed Silver',
    STAGE_IDS.JASPER_STAGE_4,
    STAGE_IDS.GOLD_STAGE_3,
  ],
  [
    'Jasper to Sapphire requires the fixed first 14 positions to have completed Gold',
    STAGE_IDS.SAPPHIRE_STAGE_5,
    STAGE_IDS.JASPER_STAGE_4,
  ],
  [
    'Sapphire to Diamond requires the fixed first 14 positions to have completed Jasper',
    STAGE_IDS.DIAMOND_STAGE_6_FINAL,
    STAGE_IDS.SAPPHIRE_STAGE_5,
  ],
];

for (const [name, targetStage, contributorStage] of fixedStageRequirements) {
  test(name, () => {
    const { members, root } = makeRoot(STAGE_CONFIG[targetStage].previousStage!);
    addQualifiedFirstThreeLevelTree(members, root, contributorStage);
    const progress = countEligibleFirstThreeLevelTree(members, root, contributorStage);
    assert.equal(progress.left.length, 7);
    assert.equal(progress.right.length, 7);
    assert.equal(progress.qualifiedCount, REQUIRED_DESCENDANT_COUNT);
    assert.equal(promoteOne(members, root), true);
    assert.equal(root.stage, targetStage);
  });

  test(`${STAGE_CONFIG[targetStage].shortName}: 13 fixed positions does not qualify`, () => {
    const { members, root } = makeRoot(STAGE_CONFIG[targetStage].previousStage!);
    addQualifiedFirstThreeLevelTree(members, root, contributorStage);
    members.get(members.get(root.rightChildId!)!.rightChildId!)!.stage =
      STAGE_IDS.STARTER_ENTRY_STAGE;
    assert.equal(
      countEligibleFirstThreeLevelTree(members, root, contributorStage).qualifiedCount,
      13
    );
    assert.equal(promoteOne(members, root), false);
    assert.equal(root.stage, STAGE_CONFIG[targetStage].previousStage);
  });

  test(`${STAGE_CONFIG[targetStage].shortName}: deeper descendants do not replace fixed missing positions`, () => {
    const { members, root } = makeRoot(STAGE_CONFIG[targetStage].previousStage!);
    addQualifiedFirstThreeLevelTree(members, root, contributorStage);
    members.get(members.get(root.leftChildId!)!.leftChildId!)!.stage =
      STAGE_IDS.STARTER_ENTRY_STAGE;
    let parent = members.get(
      members.get(members.get(root.rightChildId!)!.rightChildId!)!.rightChildId!
    )!;
    for (let index = 0; index < REQUIRED_DESCENDANT_COUNT; index++) {
      const child = buildMember(
        `${targetStage}-deep-${index}`,
        parent,
        new Date(Date.UTC(2026, 6, index + 1)),
        parent.id,
        contributorStage
      );
      members.set(child.id, child);
      parent.leftChildId = child.id;
      parent = child;
    }
    assert.equal(countEligibleDescendants(members, root, contributorStage).length, 27);
    assert.equal(
      countEligibleFirstThreeLevelTree(members, root, contributorStage).qualifiedCount,
      13
    );
    assert.equal(promoteOne(members, root), false);
  });

  test(`${STAGE_CONFIG[targetStage].shortName}: repeated fixed-position qualification is idempotent`, () => {
    const { members, root } = makeRoot(STAGE_CONFIG[targetStage].previousStage!);
    addQualifiedFirstThreeLevelTree(members, root, contributorStage);
    promoteOne(members, root);
    promoteOne(members, root);
    assert.equal(root.stage, targetStage);
    assert.equal(root.history.filter((stage) => stage === targetStage).length, 1);
    assert.equal(root.rewards.filter((stage) => stage === targetStage).length, 1);
  });
}

test('Multi-stage promotion records Emerald through Diamond without treating Starter as a reward stage', () => {
  const { members, root } = makeRoot();
  addQualifiedFirstThreeLevelTree(members, root, STAGE_IDS.SAPPHIRE_STAGE_5);
  evaluate(members, root);
  assert.deepEqual(root.history, [
    STAGE_IDS.EMERALD_STAGE_1,
    STAGE_IDS.SILVER_STAGE_2,
    STAGE_IDS.GOLD_STAGE_3,
    STAGE_IDS.JASPER_STAGE_4,
    STAGE_IDS.SAPPHIRE_STAGE_5,
    STAGE_IDS.DIAMOND_STAGE_6_FINAL,
  ]);
  assert.equal(root.rewards.includes(STAGE_IDS.STARTER_ENTRY_STAGE), false);
});

test('Independent qualification: a downline can reach Emerald while their sponsor remains Starter', () => {
  const { members, root: sponsor } = makeRoot();
  const downline = addChild(members, sponsor, 'downline-member', 'left', sponsor.id);
  addSponsoredMember(members, downline, 'downline-left-direct', downline, 'left');
  addSponsoredMember(members, downline, 'downline-right-direct', downline, 'right');

  assert.equal(evaluate(members, downline), true);
  assert.equal(downline.stage, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(sponsor.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(sponsor.history.length, 0);
});

test('Independent qualification: a downline can reach Silver while their sponsor remains Emerald', () => {
  const { members, root: sponsor } = makeRoot(STAGE_IDS.EMERALD_STAGE_1);
  const downline = addChild(
    members,
    sponsor,
    'silver-ready-downline',
    'left',
    sponsor.id,
    STAGE_IDS.EMERALD_STAGE_1
  );
  addQualifiedFirstThreeLevelTree(members, downline, STAGE_IDS.EMERALD_STAGE_1);

  const reevaluatedAncestors = cascadeWithTrace(members, downline);

  assert.deepEqual(reevaluatedAncestors, [sponsor.id]);
  assert.equal(downline.stage, STAGE_IDS.SILVER_STAGE_2);
  assert.equal(sponsor.stage, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(sponsor.history.includes(STAGE_IDS.SILVER_STAGE_2), false);
});

test('Independent qualification: a binary child can outrank their placement parent', () => {
  const { members, root: placementParent } = makeRoot();
  const child = addChild(
    members,
    placementParent,
    'binary-child',
    'left',
    'external-sponsor',
    STAGE_IDS.EMERALD_STAGE_1
  );
  addQualifiedFirstThreeLevelTree(members, child, STAGE_IDS.EMERALD_STAGE_1);

  assert.equal(evaluate(members, child), true);
  assert.equal(child.parentId, placementParent.id);
  assert.equal(child.sponsorId, 'external-sponsor');
  assert.equal(child.stage, STAGE_IDS.SILVER_STAGE_2);
  assert.equal(placementParent.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
});

test('Independent qualification: 14 positions are calculated relative to the evaluated member, not the root', () => {
  const { members, root } = makeRoot(STAGE_IDS.EMERALD_STAGE_1);
  const member = addChild(
    members,
    root,
    'member-relative-root',
    'left',
    root.id,
    STAGE_IDS.EMERALD_STAGE_1
  );
  addQualifiedFirstThreeLevelTree(members, member, STAGE_IDS.EMERALD_STAGE_1);

  const rootProgress = countEligibleFirstThreeLevelTree(members, root, STAGE_IDS.EMERALD_STAGE_1);
  const memberProgress = countEligibleFirstThreeLevelTree(
    members,
    member,
    STAGE_IDS.EMERALD_STAGE_1
  );

  assert.equal(rootProgress.qualifiedCount, 7);
  assert.equal(memberProgress.qualifiedCount, REQUIRED_DESCENDANT_COUNT);
  assert.equal(promoteOne(members, member), true);
  assert.equal(member.stage, STAGE_IDS.SILVER_STAGE_2);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
});

test('Independent qualification: downline promotion triggers ancestor reevaluation but does not require ancestor promotion', () => {
  const { members, root: ancestor } = makeRoot();
  const downline = addChild(members, ancestor, 'triggering-downline', 'left', ancestor.id);
  addSponsoredMember(members, downline, 'trigger-left-direct', downline, 'left');
  addSponsoredMember(members, downline, 'trigger-right-direct', downline, 'right');

  const reevaluatedAncestors = cascadeWithTrace(members, downline);

  assert.deepEqual(reevaluatedAncestors, [ancestor.id]);
  assert.equal(downline.stage, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(ancestor.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(ancestor.history.length, 0);
});

test('Independent qualification: no ancestor stage caps a member stage', () => {
  const { members, root } = makeRoot();
  const placementParent = addChild(members, root, 'starter-placement-parent', 'left');
  const member = addChild(members, placementParent, 'uncapped-member', 'left', 'external-sponsor');
  addQualifiedFirstThreeLevelTree(members, member, STAGE_IDS.SAPPHIRE_STAGE_5);

  evaluate(members, member);

  assert.equal(member.stage, STAGE_IDS.DIAMOND_STAGE_6_FINAL);
  assert.equal(placementParent.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
});

test('Independent qualification: members in different branches qualify independently', () => {
  const { members, root } = makeRoot();
  const leftBranch = addChild(members, root, 'left-branch-member', 'left', 'external-sponsor');
  const rightBranch = addChild(members, root, 'right-branch-member', 'right', 'external-sponsor');
  addSponsoredMember(members, leftBranch, 'left-branch-left-direct', leftBranch, 'left');
  addSponsoredMember(members, leftBranch, 'left-branch-right-direct', leftBranch, 'right');
  addQualifiedFirstThreeLevelTree(members, rightBranch, STAGE_IDS.SAPPHIRE_STAGE_5);

  evaluate(members, leftBranch);
  assert.equal(leftBranch.stage, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(rightBranch.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);

  evaluate(members, rightBranch);
  assert.equal(leftBranch.stage, STAGE_IDS.EMERALD_STAGE_1);
  assert.equal(rightBranch.stage, STAGE_IDS.DIAMOND_STAGE_6_FINAL);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
});

test('Independent qualification: re-running promotion processing preserves stages and reward idempotency', () => {
  const { members, root } = makeRoot();
  const member = addChild(members, root, 'rerun-member', 'left', 'external-sponsor');
  addQualifiedFirstThreeLevelTree(members, member, STAGE_IDS.SAPPHIRE_STAGE_5);
  const awardedStages = [
    STAGE_IDS.EMERALD_STAGE_1,
    STAGE_IDS.SILVER_STAGE_2,
    STAGE_IDS.GOLD_STAGE_3,
    STAGE_IDS.JASPER_STAGE_4,
    STAGE_IDS.SAPPHIRE_STAGE_5,
    STAGE_IDS.DIAMOND_STAGE_6_FINAL,
  ];

  evaluate(members, member);
  evaluate(members, member);

  assert.equal(member.stage, STAGE_IDS.DIAMOND_STAGE_6_FINAL);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  for (const stage of awardedStages) {
    assert.equal(member.history.filter((item) => item === stage).length, 1);
    assert.equal(member.rewards.filter((item) => item === stage).length, 1);
  }
});

test('Cascade promotion can advance an upline after a direct referral activates in the missing leg', () => {
  const { members, root } = makeRoot();
  addSponsoredMember(members, root, 'left-direct', root, 'left');
  const right = addSponsoredMember(
    members,
    root,
    'right-direct',
    root,
    'right',
    STAGE_IDS.REGISTERED_ACTIVE
  );
  cascade(members, right);
  assert.equal(right.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
});

test('Binary ancestor resolution keeps genealogy traversal stable', () => {
  const { members, root } = makeRoot();
  const left = addChild(members, root, 'left', 'left');
  const deep = addChild(members, left, 'deep', 'left');
  assert.deepEqual(getAncestorIdsFromBinaryPath(deep.path, deep.id), ['left', 'upline-root']);
});

test('Deterministic contributor selection is auditable', () => {
  const selected = selectDeterministicContributors(
    [
      {
        memberId: 'b',
        contributorStage: STAGE_IDS.SILVER_STAGE_2,
        genealogyDepth: 3,
        contributorQualifiedAt: new Date(Date.UTC(2026, 0, 1)),
        registeredAt: new Date(Date.UTC(2026, 0, 3)),
      },
      {
        memberId: 'a',
        contributorStage: STAGE_IDS.SILVER_STAGE_2,
        genealogyDepth: 2,
        contributorQualifiedAt: new Date(Date.UTC(2026, 0, 1)),
        registeredAt: new Date(Date.UTC(2026, 0, 3)),
      },
      {
        memberId: 'c',
        contributorStage: STAGE_IDS.SILVER_STAGE_2,
        genealogyDepth: 1,
        contributorQualifiedAt: new Date(Date.UTC(2026, 0, 2)),
        registeredAt: new Date(Date.UTC(2026, 0, 1)),
      },
    ],
    2
  );
  assert.deepEqual(
    selected.map((item) => item.memberId),
    ['a', 'b']
  );
});

console.log(`Dynamic stage qualification verification passed (${tests.length} assertions).`);
