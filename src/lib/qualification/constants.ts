export const STAGE_IDS = {
  REGISTERED_ACTIVE: 'REGISTERED_ACTIVE',
  STARTER_ENTRY_STAGE: 'STARTER_ENTRY_STAGE',
  EMERALD_STAGE_1: 'EMERALD_STAGE_1',
  SILVER_STAGE_2: 'SILVER_STAGE_2',
  GOLD_STAGE_3: 'GOLD_STAGE_3',
  JASPER_STAGE_4: 'JASPER_STAGE_4',
  SAPPHIRE_STAGE_5: 'SAPPHIRE_STAGE_5',
  DIAMOND_STAGE_6_FINAL: 'DIAMOND_STAGE_6_FINAL',
} as const;

export type StageId = (typeof STAGE_IDS)[keyof typeof STAGE_IDS];

export const QUALIFICATION_RULE_VERSION = 'gma-dynamic-stage-v1';
export const REQUIRED_DESCENDANT_COUNT = 14;
export const STARTER_QUALIFICATION_MODE = 'PERSONAL_SPONSORSHIP_BY_SPONSOR_ID';

export const STAGE_ORDER: StageId[] = [
  STAGE_IDS.REGISTERED_ACTIVE,
  STAGE_IDS.STARTER_ENTRY_STAGE,
  STAGE_IDS.EMERALD_STAGE_1,
  STAGE_IDS.SILVER_STAGE_2,
  STAGE_IDS.GOLD_STAGE_3,
  STAGE_IDS.JASPER_STAGE_4,
  STAGE_IDS.SAPPHIRE_STAGE_5,
  STAGE_IDS.DIAMOND_STAGE_6_FINAL,
];

export const STAGE_RANK: Record<StageId, number> = {
  [STAGE_IDS.REGISTERED_ACTIVE]: 0,
  [STAGE_IDS.STARTER_ENTRY_STAGE]: 1,
  [STAGE_IDS.EMERALD_STAGE_1]: 2,
  [STAGE_IDS.SILVER_STAGE_2]: 3,
  [STAGE_IDS.GOLD_STAGE_3]: 4,
  [STAGE_IDS.JASPER_STAGE_4]: 5,
  [STAGE_IDS.SAPPHIRE_STAGE_5]: 6,
  [STAGE_IDS.DIAMOND_STAGE_6_FINAL]: 7,
};

export interface StageLoanConfig {
  principal: number;
  interestRate: number;
}

export interface StageConfig {
  id: StageId;
  displayName: string;
  shortName: string;
  stageNumber: number | null;
  previousStage: StageId | null;
  requiredContributorStage: StageId | null;
  requiredCount: number;
  rewardValue: number;
  rewardPackage: string;
  hasReward: boolean;
  isFinal: boolean;
  loan?: StageLoanConfig;
}

export const STAGE_CONFIG: Record<StageId, StageConfig> = {
  [STAGE_IDS.REGISTERED_ACTIVE]: {
    id: STAGE_IDS.REGISTERED_ACTIVE,
    displayName: 'Registered / Active',
    shortName: 'Registered',
    stageNumber: null,
    previousStage: null,
    requiredContributorStage: null,
    requiredCount: 0,
    rewardValue: 0,
    rewardPackage: '',
    hasReward: false,
    isFinal: false,
  },
  [STAGE_IDS.STARTER_ENTRY_STAGE]: {
    id: STAGE_IDS.STARTER_ENTRY_STAGE,
    displayName: 'Starter Stage \u2014 Entry Stage',
    shortName: 'Starter',
    stageNumber: null,
    previousStage: STAGE_IDS.REGISTERED_ACTIVE,
    requiredContributorStage: STAGE_IDS.REGISTERED_ACTIVE,
    requiredCount: 2,
    rewardValue: 0,
    rewardPackage: 'No separate Starter reward has been specified.',
    hasReward: false,
    isFinal: false,
  },
  [STAGE_IDS.EMERALD_STAGE_1]: {
    id: STAGE_IDS.EMERALD_STAGE_1,
    displayName: 'Emerald \u2014 Stage 1',
    shortName: 'Emerald',
    stageNumber: 1,
    previousStage: STAGE_IDS.STARTER_ENTRY_STAGE,
    requiredContributorStage: STAGE_IDS.STARTER_ENTRY_STAGE,
    requiredCount: REQUIRED_DESCENDANT_COUNT,
    rewardValue: 25000,
    rewardPackage:
      'Food package or approved cash option worth \u20a625,000: 1 carton of noodles; 1 roll of milk; 1 roll of Milo; 1 pack of sugar; \u20a610,000 cash; 5 kg garri; 5 kg beans; 10 kg rice; 2 litres palm oil.',
    hasReward: true,
    isFinal: false,
  },
  [STAGE_IDS.SILVER_STAGE_2]: {
    id: STAGE_IDS.SILVER_STAGE_2,
    displayName: 'Silver \u2014 Stage 2',
    shortName: 'Silver',
    stageNumber: 2,
    previousStage: STAGE_IDS.EMERALD_STAGE_1,
    requiredContributorStage: STAGE_IDS.EMERALD_STAGE_1,
    requiredCount: REQUIRED_DESCENDANT_COUNT,
    rewardValue: 100000,
    rewardPackage:
      'Reward value \u20a6100,000: 1 carton spaghetti; 2 tins tomatoes; 1 packet sugar; 2 rolls of milk and Milo; \u20a620,000 cash; healthcare products worth \u20a611,000.',
    hasReward: true,
    isFinal: false,
  },
  [STAGE_IDS.GOLD_STAGE_3]: {
    id: STAGE_IDS.GOLD_STAGE_3,
    displayName: 'Gold \u2014 Stage 3',
    shortName: 'Gold',
    stageNumber: 3,
    previousStage: STAGE_IDS.SILVER_STAGE_2,
    requiredContributorStage: STAGE_IDS.SILVER_STAGE_2,
    requiredCount: REQUIRED_DESCENDANT_COUNT,
    rewardValue: 300000,
    rewardPackage:
      'Reward value \u20a6300,000: Golden Morn; milk refill; carton of noodles; half bag of rice; half carton of spaghetti; large custard; half carton of tinned tomatoes; seasoning cubes; pack of sugar; 1 litre groundnut oil; \u20a6100,000 cash.',
    hasReward: true,
    isFinal: false,
  },
  [STAGE_IDS.JASPER_STAGE_4]: {
    id: STAGE_IDS.JASPER_STAGE_4,
    displayName: 'Jasper \u2014 Stage 4',
    shortName: 'Jasper',
    stageNumber: 4,
    previousStage: STAGE_IDS.GOLD_STAGE_3,
    requiredContributorStage: STAGE_IDS.GOLD_STAGE_3,
    requiredCount: REQUIRED_DESCENDANT_COUNT,
    rewardValue: 3800000,
    rewardPackage:
      'Total award \u20a63,800,000: \u20a61,000,000 cash; foodstuffs worth \u20a6200,000; healthcare products worth \u20a6100,000; children school-fee support worth \u20a6250,000; repayable loan of \u20a6250,000 at 1% interest; first car award worth \u20a62,000,000.',
    hasReward: true,
    isFinal: false,
    loan: {
      principal: 250000,
      interestRate: 0.01,
    },
  },
  [STAGE_IDS.SAPPHIRE_STAGE_5]: {
    id: STAGE_IDS.SAPPHIRE_STAGE_5,
    displayName: 'Sapphire \u2014 Stage 5',
    shortName: 'Sapphire',
    stageNumber: 5,
    previousStage: STAGE_IDS.JASPER_STAGE_4,
    requiredContributorStage: STAGE_IDS.JASPER_STAGE_4,
    requiredCount: REQUIRED_DESCENDANT_COUNT,
    rewardValue: 8800000,
    rewardPackage:
      'Total award \u20a68,800,000: \u20a64,000,000 cash; foodstuffs worth \u20a6400,000; Android phone worth \u20a6200,000; second car award worth \u20a63,000,000; healthcare products worth \u20a650,000; refrigerator worth \u20a6150,000; repayable loan of \u20a61,000,000 at 1% interest.',
    hasReward: true,
    isFinal: false,
    loan: {
      principal: 1000000,
      interestRate: 0.01,
    },
  },
  [STAGE_IDS.DIAMOND_STAGE_6_FINAL]: {
    id: STAGE_IDS.DIAMOND_STAGE_6_FINAL,
    displayName: 'Diamond \u2014 Stage 6 \u2014 Final Stage',
    shortName: 'Diamond',
    stageNumber: 6,
    previousStage: STAGE_IDS.SAPPHIRE_STAGE_5,
    requiredContributorStage: STAGE_IDS.SAPPHIRE_STAGE_5,
    requiredCount: REQUIRED_DESCENDANT_COUNT,
    rewardValue: 30000000,
    rewardPackage:
      'Total award \u20a630,000,000: brand-new car worth \u20a68,000,000; house award worth \u20a610,000,000; foodstuffs worth \u20a6500,000; electronics worth \u20a6200,000; children school-fee support worth \u20a6300,000; healthcare products worth \u20a6300,000; \u20a66,000,000 cash; send-off celebration worth \u20a61,000,000; fixed international trip.',
    hasReward: true,
    isFinal: true,
  },
};

const NEW_STAGE_IDS = new Set<string>(STAGE_ORDER);

const LEGACY_STAGE_TO_ATTAINED_STAGE: Record<string, StageId> = {
  STARTER: STAGE_IDS.REGISTERED_ACTIVE,
  EMERALD: STAGE_IDS.STARTER_ENTRY_STAGE,
  SILVER: STAGE_IDS.EMERALD_STAGE_1,
  GOLD: STAGE_IDS.SILVER_STAGE_2,
  JASPER: STAGE_IDS.GOLD_STAGE_3,
  SAPPHIRE: STAGE_IDS.JASPER_STAGE_4,
  DIAMOND: STAGE_IDS.SAPPHIRE_STAGE_5,
};

export const LEGACY_STAGE_IDS = Object.keys(LEGACY_STAGE_TO_ATTAINED_STAGE);

export const ATTAINED_STAGE_TO_LEGACY_COMPLETED_STAGE: Partial<Record<StageId, string>> = {
  [STAGE_IDS.STARTER_ENTRY_STAGE]: 'STARTER',
  [STAGE_IDS.EMERALD_STAGE_1]: 'EMERALD',
  [STAGE_IDS.SILVER_STAGE_2]: 'SILVER',
  [STAGE_IDS.GOLD_STAGE_3]: 'GOLD',
  [STAGE_IDS.JASPER_STAGE_4]: 'JASPER',
  [STAGE_IDS.SAPPHIRE_STAGE_5]: 'SAPPHIRE',
  [STAGE_IDS.DIAMOND_STAGE_6_FINAL]: 'DIAMOND',
};

export function normalizeStageId(stage: string | null | undefined): StageId {
  if (stage && NEW_STAGE_IDS.has(stage)) {
    return stage as StageId;
  }
  if (stage && LEGACY_STAGE_TO_ATTAINED_STAGE[stage]) {
    return LEGACY_STAGE_TO_ATTAINED_STAGE[stage];
  }
  return STAGE_IDS.REGISTERED_ACTIVE;
}

export function getStageRank(stage: string | null | undefined): number {
  return STAGE_RANK[normalizeStageId(stage)];
}

export function isStageAtLeast(stage: string | null | undefined, requiredStage: StageId): boolean {
  return getStageRank(stage) >= STAGE_RANK[requiredStage];
}

export function getNextStage(stage: string | null | undefined): StageId | null {
  const current = normalizeStageId(stage);
  const nextIndex = STAGE_RANK[current] + 1;
  return STAGE_ORDER[nextIndex] ?? null;
}

export function getStageDisplayName(stage: string | null | undefined): string {
  return STAGE_CONFIG[normalizeStageId(stage)].displayName;
}

export function getStageNumberLabel(stage: string | null | undefined): string {
  const config = STAGE_CONFIG[normalizeStageId(stage)];
  if (config.id === STAGE_IDS.REGISTERED_ACTIVE) return 'Account status';
  if (config.id === STAGE_IDS.STARTER_ENTRY_STAGE) return 'Entry Stage';
  return `Stage ${config.stageNumber}`;
}

export function getStagesAtOrAbove(requiredStage: StageId): StageId[] {
  const requiredRank = STAGE_RANK[requiredStage];
  return STAGE_ORDER.filter((stage) => STAGE_RANK[stage] >= requiredRank);
}

export function getQueryableStageIdsAtOrAbove(requiredStage: StageId): string[] {
  const allowed = new Set<string>(getStagesAtOrAbove(requiredStage));
  for (const legacyStage of LEGACY_STAGE_IDS) {
    if (isStageAtLeast(legacyStage, requiredStage)) {
      allowed.add(legacyStage);
    }
  }
  return [...allowed];
}

export function getRequirementText(targetStage: StageId | null): string {
  if (!targetStage) return 'No further compensation stage exists.';

  if (targetStage === STAGE_IDS.STARTER_ENTRY_STAGE) {
    return 'Personally sponsor and successfully register 2 eligible active members through your referral link or referral code.';
  }

  if (targetStage === STAGE_IDS.EMERALD_STAGE_1) {
    return 'Qualify with the first 14 binary-tree positions at Starter Stage — Entry Stage or higher: 7 on the left and 7 on the right.';
  }

  const config = STAGE_CONFIG[targetStage];
  const contributorStage = config.requiredContributorStage
    ? STAGE_CONFIG[config.requiredContributorStage].displayName
    : 'eligible';

  return `${config.requiredCount} descendants at ${contributorStage} or higher.`;
}

export function getHighestStage(
  stageA: string | null | undefined,
  stageB: string | null | undefined
): StageId {
  return getStageRank(stageA) >= getStageRank(stageB)
    ? normalizeStageId(stageA)
    : normalizeStageId(stageB);
}
