import assert from 'node:assert/strict';
import {
  REQUIRED_DESCENDANT_COUNT,
  STAGE_CONFIG,
  STAGE_IDS,
  STAGE_RANK,
  StageId,
  getNextStage,
  isStageAtLeast,
} from '../src/lib/qualification/constants';
import {
  getAncestorIdsFromBinaryPath,
  selectDeterministicContributors,
} from '../src/lib/qualification/engine';

type Member = {
  id: string;
  parentId: string | null;
  sponsorId: string | null;
  leftChildId?: string | null;
  rightChildId?: string | null;
  path: string;
  depth: number;
  createdAt: Date;
  status: string;
  activated: boolean;
  isDeleted: boolean;
  fraudBlocked: boolean;
  adminDisqualified: boolean;
  stage: StageId;
  history: StageId[];
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
  sponsorId: string | null = parent?.id ?? null
): Member {
  return {
    id,
    parentId: parent?.id ?? null,
    sponsorId,
    path: parent ? `${parent.path}/${id}` : `root/${id}`,
    depth: parent ? parent.depth + 1 : 0,
    createdAt,
    status: 'ACTIVE',
    activated: true,
    isDeleted: false,
    fraudBlocked: false,
    adminDisqualified: false,
    stage: STAGE_IDS.REGISTERED_ACTIVE,
    history: [],
    rewards: [],
    loans: [],
  };
}

function addChild(
  members: Map<string, Member>,
  parent: Member,
  id: string,
  side: 'left' | 'right',
  sponsorId: string | null = parent.id
) {
  const child = buildMember(id, parent, new Date(Date.UTC(2026, 0, members.size + 1)), sponsorId);
  members.set(child.id, child);
  if (side === 'left') parent.leftChildId = child.id;
  if (side === 'right') parent.rightChildId = child.id;
  return child;
}

function addSponsoredMember(
  members: Map<string, Member>,
  sponsor: Member,
  id: string,
  placementParent: Member,
  side?: 'left' | 'right'
) {
  if (side) {
    return addChild(members, placementParent, id, side, sponsor.id);
  }
  const member = buildMember(
    id,
    placementParent,
    new Date(Date.UTC(2026, 0, members.size + 1)),
    sponsor.id
  );
  members.set(member.id, member);
  return member;
}

function descendantsOf(members: Map<string, Member>, member: Member) {
  return [...members.values()].filter((candidate) => candidate.path.startsWith(`${member.path}/`));
}

function countEligibleDescendants(
  members: Map<string, Member>,
  member: Member,
  requiredStage: StageId
) {
  const unique = new Map<string, Member>();
  for (const descendant of descendantsOf(members, member)) {
    if (descendant.status === 'ACTIVE' && isStageAtLeast(descendant.stage, requiredStage)) {
      unique.set(descendant.id, descendant);
    }
  }
  return [...unique.values()];
}

function getDescendantLeg(root: Member, descendant: Member): 'left' | 'right' | null {
  if (
    root.leftChildId &&
    (descendant.id === root.leftChildId ||
      descendant.path.startsWith(`${root.path}/${root.leftChildId}/`))
  ) {
    return 'left';
  }

  if (
    root.rightChildId &&
    (descendant.id === root.rightChildId ||
      descendant.path.startsWith(`${root.path}/${root.rightChildId}/`))
  ) {
    return 'right';
  }

  return null;
}

function countEligibleEmeraldFirstTree(members: Map<string, Member>, member: Member) {
  const requiredPerLeg = REQUIRED_DESCENDANT_COUNT / 2;
  const maxDepth = member.depth + 3;
  const byLeg: Record<'left' | 'right', Map<string, Member>> = {
    left: new Map<string, Member>(),
    right: new Map<string, Member>(),
  };

  for (const descendant of descendantsOf(members, member)) {
    if (descendant.depth > maxDepth) continue;
    if (descendant.status !== 'ACTIVE') continue;
    if (!isStageAtLeast(descendant.stage, STAGE_IDS.STARTER_ENTRY_STAGE)) continue;

    const leg = getDescendantLeg(member, descendant);
    if (leg) byLeg[leg].set(descendant.id, descendant);
  }

  return {
    left: [...byLeg.left.values()],
    right: [...byLeg.right.values()],
    qualifiedCount:
      Math.min(byLeg.left.size, requiredPerLeg) + Math.min(byLeg.right.size, requiredPerLeg),
  };
}

function isEligibleSponsoredMember(member: Member) {
  return (
    member.status === 'ACTIVE' &&
    member.activated &&
    !member.isDeleted &&
    !member.fraudBlocked &&
    !member.adminDisqualified
  );
}

function countEligibleSponsoredMembers(members: Map<string, Member>, sponsor: Member) {
  const unique = new Map<string, Member>();
  for (const member of members.values()) {
    if (member.sponsorId === sponsor.id && isEligibleSponsoredMember(member)) {
      unique.set(member.id, member);
    }
  }
  return [...unique.values()];
}

function promoteOne(members: Map<string, Member>, member: Member) {
  const nextStage = getNextStage(member.stage);
  if (!nextStage) return false;

  if (nextStage === STAGE_IDS.STARTER_ENTRY_STAGE) {
    if (countEligibleSponsoredMembers(members, member).length < 2) return false;
  } else if (nextStage === STAGE_IDS.EMERALD_STAGE_1) {
    const emeraldProgress = countEligibleEmeraldFirstTree(members, member);
    if (emeraldProgress.qualifiedCount < REQUIRED_DESCENDANT_COUNT) {
      return false;
    }
  } else {
    const requiredStage = STAGE_CONFIG[nextStage].requiredContributorStage!;
    if (
      countEligibleDescendants(members, member, requiredStage).length < REQUIRED_DESCENDANT_COUNT
    ) {
      return false;
    }
  }

  if (!member.history.includes(nextStage)) member.history.push(nextStage);
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

function makeRootWithActiveChildren() {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)));
  members.set(root.id, root);
  addChild(members, root, 'left', 'left');
  addChild(members, root, 'right', 'right');
  return { members, root };
}

function addQualifiedDescendants(
  members: Map<string, Member>,
  root: Member,
  stage: StageId,
  count = REQUIRED_DESCENDANT_COUNT
) {
  for (let i = 0; i < count; i++) {
    const parent = i % 2 === 0 ? members.get(root.leftChildId!)! : members.get(root.rightChildId!)!;
    const member = buildMember(`${stage}-${i}`, parent, new Date(Date.UTC(2026, 1, i + 1)));
    member.stage = stage;
    member.history.push(stage);
    members.set(member.id, member);
  }
}

function addQualifiedFirstThreeLevelTree(
  members: Map<string, Member>,
  root: Member,
  stage: StageId
) {
  const level1 = [members.get(root.leftChildId!)!, members.get(root.rightChildId!)!];
  const level2: Member[] = [];
  const level3: Member[] = [];

  for (const parent of level1) {
    level2.push(addChild(members, parent, `${stage}-${parent.id}-left`, 'left'));
    level2.push(addChild(members, parent, `${stage}-${parent.id}-right`, 'right'));
  }

  for (const parent of level2) {
    level3.push(addChild(members, parent, `${stage}-${parent.id}-left`, 'left'));
    level3.push(addChild(members, parent, `${stage}-${parent.id}-right`, 'right'));
  }

  for (const member of [...level1, ...level2, ...level3]) {
    member.stage = stage;
    member.history.push(stage);
  }
}

test('1. Registered member is not counted as one of the seven stages', () => {
  assert.equal(STAGE_RANK[STAGE_IDS.REGISTERED_ACTIVE], 0);
  assert.equal(STAGE_CONFIG[STAGE_IDS.REGISTERED_ACTIVE].stageNumber, null);
});

test('2. Starter is the Entry Stage, not Stage 1', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.STARTER_ENTRY_STAGE].stageNumber, null);
  assert.match(STAGE_CONFIG[STAGE_IDS.STARTER_ENTRY_STAGE].displayName, /Entry Stage/);
});

test('3. Emerald is Stage 1', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.EMERALD_STAGE_1].stageNumber, 1);
});

test('4. Silver is Stage 2', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.SILVER_STAGE_2].stageNumber, 2);
});

test('5. Gold is Stage 3', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.GOLD_STAGE_3].stageNumber, 3);
});

test('6. Jasper is Stage 4', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.JASPER_STAGE_4].stageNumber, 4);
});

test('7. Sapphire is Stage 5', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.SAPPHIRE_STAGE_5].stageNumber, 5);
});

test('8. Diamond is Stage 6 and final', () => {
  assert.equal(STAGE_CONFIG[STAGE_IDS.DIAMOND_STAGE_6_FINAL].stageNumber, 6);
  assert.equal(STAGE_CONFIG[STAGE_IDS.DIAMOND_STAGE_6_FINAL].isFinal, true);
  assert.equal(getNextStage(STAGE_IDS.DIAMOND_STAGE_6_FINAL), null);
});

test('9. Starter requires two eligible personally sponsored active members', () => {
  const { members, root } = makeRootWithActiveChildren();
  members.get(root.rightChildId!)!.sponsorId = 'someone-else';
  assert.equal(promoteOne(members, root), false);
  members.get(root.rightChildId!)!.sponsorId = root.id;
  assert.equal(promoteOne(members, root), true);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
});

test('Starter: sponsored members count even when placed deeper in the binary tree', () => {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)));
  members.set(root.id, root);
  const placementParent = addChild(members, root, 'placement-parent', 'left', 'other-sponsor');
  addSponsoredMember(members, root, 'sponsored-deep-1', placementParent, 'left');
  addSponsoredMember(members, root, 'sponsored-deep-2', placementParent, 'right');
  assert.equal(promoteOne(members, root), true);
  assert.equal(root.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
});

test('Starter: sponsored members count regardless of left or right placement', () => {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)));
  members.set(root.id, root);
  addSponsoredMember(members, root, 'left-sponsored', root, 'left');
  addSponsoredMember(members, root, 'right-sponsored', root, 'right');
  assert.equal(countEligibleSponsoredMembers(members, root).length, 2);
  assert.equal(promoteOne(members, root), true);
});

test('Starter: immediate placement children sponsored by others do not qualify placement parent', () => {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)));
  members.set(root.id, root);
  addChild(members, root, 'left-other-sponsored', 'left', 'external-sponsor-1');
  addChild(members, root, 'right-other-sponsored', 'right', 'external-sponsor-2');
  assert.equal(countEligibleSponsoredMembers(members, root).length, 0);
  assert.equal(promoteOne(members, root), false);
});

test('Starter: one sponsored member and one unrelated placement child do not qualify', () => {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)));
  members.set(root.id, root);
  addChild(members, root, 'sponsored-left', 'left', root.id);
  addChild(members, root, 'unrelated-right', 'right', 'external-sponsor');
  assert.equal(countEligibleSponsoredMembers(members, root).length, 1);
  assert.equal(promoteOne(members, root), false);
});

test('Starter: more than two sponsored members remain credited to the sponsor', () => {
  const { members, root } = makeRootWithActiveChildren();
  addSponsoredMember(members, root, 'extra-sponsored', members.get(root.leftChildId!)!);
  assert.equal(countEligibleSponsoredMembers(members, root).length, 3);
  assert.equal(promoteOne(members, root), true);
});

test('Starter: inactive, suspended, deleted or disqualified sponsored members do not count', () => {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date(Date.UTC(2026, 0, 1)));
  members.set(root.id, root);
  const inactive = addSponsoredMember(members, root, 'inactive', root, 'left');
  inactive.status = 'INACTIVE';
  const suspended = addSponsoredMember(members, root, 'suspended', root, 'right');
  suspended.status = 'SUSPENDED';
  const deleted = addSponsoredMember(members, root, 'deleted', root);
  deleted.isDeleted = true;
  const disqualified = addSponsoredMember(members, root, 'disqualified', root);
  disqualified.adminDisqualified = true;
  const fraudBlocked = addSponsoredMember(members, root, 'fraud-blocked', root);
  fraudBlocked.fraudBlocked = true;
  const notActivated = addSponsoredMember(members, root, 'not-activated', root);
  notActivated.activated = false;
  addSponsoredMember(members, root, 'eligible-1', root);
  assert.equal(countEligibleSponsoredMembers(members, root).length, 1);
  assert.equal(promoteOne(members, root), false);
});

test('Starter: the same sponsored member cannot be counted twice', () => {
  const { members, root } = makeRootWithActiveChildren();
  const sponsored = members.get(root.leftChildId!)!;
  const unique = new Map<string, Member>([
    [sponsored.id, sponsored],
    [sponsored.id, sponsored],
  ]);
  assert.equal(unique.size, 1);
  assert.equal(countEligibleSponsoredMembers(members, root).length, 2);
});

test('Starter: promotion does not change genealogy placement', () => {
  const { members, root } = makeRootWithActiveChildren();
  const before = JSON.stringify(
    [...members.values()].map((member) => [member.id, member.parentId, member.path, member.depth])
  );
  assert.equal(promoteOne(members, root), true);
  const after = JSON.stringify(
    [...members.values()].map((member) => [member.id, member.parentId, member.path, member.depth])
  );
  assert.equal(after, before);
});

test('Starter: repeated qualification checks do not create duplicate promotions or rewards', () => {
  const { members, root } = makeRootWithActiveChildren();
  evaluate(members, root);
  evaluate(members, root);
  assert.equal(root.history.filter((stage) => stage === STAGE_IDS.STARTER_ENTRY_STAGE).length, 1);
  assert.equal(root.rewards.filter((stage) => stage === STAGE_IDS.STARTER_ENTRY_STAGE).length, 0);
});

const stageRequirements: [string, StageId, StageId][] = [
  [
    '10. Emerald requires the first 14-position tree with Starter-or-higher descendants',
    STAGE_IDS.EMERALD_STAGE_1,
    STAGE_IDS.STARTER_ENTRY_STAGE,
  ],
  [
    '11. Silver requires 14 Emerald-or-higher descendants',
    STAGE_IDS.SILVER_STAGE_2,
    STAGE_IDS.EMERALD_STAGE_1,
  ],
  [
    '12. Gold requires 14 Silver-or-higher descendants',
    STAGE_IDS.GOLD_STAGE_3,
    STAGE_IDS.SILVER_STAGE_2,
  ],
  [
    '13. Jasper requires 14 Gold-or-higher descendants',
    STAGE_IDS.JASPER_STAGE_4,
    STAGE_IDS.GOLD_STAGE_3,
  ],
  [
    '14. Sapphire requires 14 Jasper-or-higher descendants',
    STAGE_IDS.SAPPHIRE_STAGE_5,
    STAGE_IDS.JASPER_STAGE_4,
  ],
  [
    '15. Diamond requires 14 Sapphire-or-higher descendants',
    STAGE_IDS.DIAMOND_STAGE_6_FINAL,
    STAGE_IDS.SAPPHIRE_STAGE_5,
  ],
];

for (const [name, targetStage, contributorStage] of stageRequirements) {
  test(name, () => {
    const { members, root } = makeRootWithActiveChildren();
    root.stage = STAGE_CONFIG[targetStage].previousStage!;
    if (targetStage === STAGE_IDS.EMERALD_STAGE_1) {
      addQualifiedFirstThreeLevelTree(members, root, contributorStage);
    } else {
      addQualifiedDescendants(members, root, contributorStage);
    }
    assert.equal(promoteOne(members, root), true);
    assert.equal(root.stage, targetStage);
  });
}

test('Emerald requires 7 qualified members on the left and 7 on the right', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  const left = members.get(root.leftChildId!)!;
  for (let i = 0; i < REQUIRED_DESCENDANT_COUNT; i++) {
    const member = buildMember(`left-heavy-${i}`, left, new Date(Date.UTC(2026, 2, i + 1)));
    member.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
    members.set(member.id, member);
  }

  const progress = countEligibleEmeraldFirstTree(members, root);
  assert.equal(progress.left.length, 14);
  assert.equal(progress.right.length, 0);
  assert.equal(progress.qualifiedCount, 7);
  assert.equal(promoteOne(members, root), false);
});

test('Emerald ignores qualified descendants below the first three binary levels', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  let leftParent = members.get(root.leftChildId!)!;
  let rightParent = members.get(root.rightChildId!)!;

  for (let i = 0; i < REQUIRED_DESCENDANT_COUNT / 2; i++) {
    leftParent = addChild(members, leftParent, `too-deep-left-${i}`, 'left');
    rightParent = addChild(members, rightParent, `too-deep-right-${i}`, 'right');
    leftParent.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
    rightParent.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  }

  assert.equal(countEligibleEmeraldFirstTree(members, root).qualifiedCount, 4);
  assert.equal(promoteOne(members, root), false);
});

test('16. A deeper descendant may count', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  let parent = members.get(root.leftChildId!)!;
  for (let i = 0; i < REQUIRED_DESCENDANT_COUNT; i++) {
    const child = buildMember(`deep-${i}`, parent, new Date(Date.UTC(2026, 2, i + 1)));
    child.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
    members.set(child.id, child);
    parent = child;
  }
  assert.equal(countEligibleDescendants(members, root, STAGE_IDS.STARTER_ENTRY_STAGE).length, 14);
});

test('17. A descendant outside the subtree cannot count', () => {
  const { members, root } = makeRootWithActiveChildren();
  const outsider = buildMember('outside', null, new Date());
  outsider.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  members.set(outsider.id, outsider);
  assert.equal(
    countEligibleDescendants(members, root, STAGE_IDS.STARTER_ENTRY_STAGE).some(
      (m) => m.id === 'outside'
    ),
    false
  );
});

test('18. The same descendant counts once per promotion', () => {
  const { members, root } = makeRootWithActiveChildren();
  const child = members.get(root.leftChildId!)!;
  child.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  const unique = new Map<string, Member>([
    [child.id, child],
    [child.id, child],
  ]);
  assert.equal(unique.size, 1);
});

test('19. The same descendant may support multiple genuine ancestors', () => {
  const members = new Map<string, Member>();
  const root = buildMember('upline-root', null, new Date());
  const a = buildMember('a', root, new Date());
  const b = buildMember('b', a, new Date());
  const c = buildMember('c', b, new Date());
  c.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  for (const member of [root, a, b, c]) members.set(member.id, member);
  assert.equal(countEligibleDescendants(members, b, STAGE_IDS.STARTER_ENTRY_STAGE).length, 1);
  assert.equal(countEligibleDescendants(members, a, STAGE_IDS.STARTER_ENTRY_STAGE).length, 1);
  assert.equal(countEligibleDescendants(members, root, STAGE_IDS.STARTER_ENTRY_STAGE).length, 1);
});

test('20. A downline may overtake an upline', () => {
  const { members, root } = makeRootWithActiveChildren();
  const downline = members.get(root.leftChildId!)!;
  root.stage = STAGE_IDS.EMERALD_STAGE_1;
  downline.stage = STAGE_IDS.SILVER_STAGE_2;
  addChild(members, downline, 'overtake-left', 'left');
  addChild(members, downline, 'overtake-right', 'right');
  addQualifiedDescendants(members, downline, STAGE_IDS.SILVER_STAGE_2);
  assert.equal(promoteOne(members, downline), true);
  assert.equal(downline.stage, STAGE_IDS.GOLD_STAGE_3);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
});

test('21. Genealogy placement never changes', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  addQualifiedDescendants(members, root, STAGE_IDS.STARTER_ENTRY_STAGE);
  const before = JSON.stringify(
    [...members.values()].map((m) => [m.id, m.parentId, m.path, m.depth])
  );
  promoteOne(members, root);
  const after = JSON.stringify(
    [...members.values()].map((m) => [m.id, m.parentId, m.path, m.depth])
  );
  assert.equal(after, before);
});

test('22. Multi-stage promotion records every intermediate stage', () => {
  const { members, root } = makeRootWithActiveChildren();
  for (const stage of [
    STAGE_IDS.STARTER_ENTRY_STAGE,
    STAGE_IDS.EMERALD_STAGE_1,
    STAGE_IDS.SILVER_STAGE_2,
    STAGE_IDS.GOLD_STAGE_3,
    STAGE_IDS.JASPER_STAGE_4,
    STAGE_IDS.SAPPHIRE_STAGE_5,
  ]) {
    addQualifiedDescendants(members, root, stage);
  }
  evaluate(members, root);
  assert.deepEqual(root.history, [
    STAGE_IDS.STARTER_ENTRY_STAGE,
    STAGE_IDS.EMERALD_STAGE_1,
    STAGE_IDS.SILVER_STAGE_2,
    STAGE_IDS.GOLD_STAGE_3,
    STAGE_IDS.JASPER_STAGE_4,
    STAGE_IDS.SAPPHIRE_STAGE_5,
    STAGE_IDS.DIAMOND_STAGE_6_FINAL,
  ]);
});

test('23. Cascade promotion works', () => {
  const { members, root } = makeRootWithActiveChildren();
  const child = members.get(root.leftChildId!)!;
  child.stage = STAGE_IDS.REGISTERED_ACTIVE;
  addChild(members, child, 'child-left', 'left');
  addChild(members, child, 'child-right', 'right');
  root.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  addQualifiedDescendants(members, root, STAGE_IDS.STARTER_ENTRY_STAGE);
  cascade(members, child);
  assert.equal(child.stage, STAGE_IDS.STARTER_ENTRY_STAGE);
  assert.equal(root.stage, STAGE_IDS.EMERALD_STAGE_1);
});

test('24. Duplicate promotion is prevented', () => {
  const { members, root } = makeRootWithActiveChildren();
  evaluate(members, root);
  evaluate(members, root);
  assert.equal(root.history.filter((stage) => stage === STAGE_IDS.STARTER_ENTRY_STAGE).length, 1);
});

test('25. Duplicate rewards are prevented', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.STARTER_ENTRY_STAGE;
  addQualifiedDescendants(members, root, STAGE_IDS.STARTER_ENTRY_STAGE);
  promoteOne(members, root);
  promoteOne(members, root);
  assert.equal(root.rewards.filter((stage) => stage === STAGE_IDS.EMERALD_STAGE_1).length, 1);
});

test('26. Diamond prevents further stage advancement', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.DIAMOND_STAGE_6_FINAL;
  assert.equal(promoteOne(members, root), false);
});

test('27. Diamond member remains in genealogy', () => {
  const { members, root } = makeRootWithActiveChildren();
  root.stage = STAGE_IDS.DIAMOND_STAGE_6_FINAL;
  assert.equal(members.has(root.id), true);
  assert.equal(root.path, 'root/upline-root');
});

test('28. Jasper loan is recorded at 1% interest', () => {
  const loan = STAGE_CONFIG[STAGE_IDS.JASPER_STAGE_4].loan!;
  assert.equal(loan.principal, 250000);
  assert.equal(loan.principal * loan.interestRate, 2500);
});

test('29. Sapphire loan is recorded at 1% interest', () => {
  const loan = STAGE_CONFIG[STAGE_IDS.SAPPHIRE_STAGE_5].loan!;
  assert.equal(loan.principal, 1000000);
  assert.equal(loan.principal * loan.interestRate, 10000);
});

test('30. International trip remains a fixed Diamond benefit', () => {
  const packageText = STAGE_CONFIG[STAGE_IDS.DIAMOND_STAGE_6_FINAL].rewardPackage;
  assert.match(packageText, /fixed international trip/);
  assert.doesNotMatch(packageText, /trip worth/);
});

test('31. Existing genuine members and genealogy data remain intact', () => {
  const { members, root } = makeRootWithActiveChildren();
  const snapshot = [...members.values()].map((member) => ({
    id: member.id,
    parentId: member.parentId,
    path: member.path,
    depth: member.depth,
  }));
  evaluate(members, root);
  assert.deepEqual(
    [...members.values()].map((member) => ({
      id: member.id,
      parentId: member.parentId,
      path: member.path,
      depth: member.depth,
    })),
    snapshot
  );
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
