export const STAGES = {
  STARTER: 'STARTER',
  EMERALD: 'EMERALD',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  JASPER: 'JASPER',
  SAPPHIRE: 'SAPPHIRE',
  DIAMOND: 'DIAMOND',
};

export interface StageConfig {
  name: string;
  previousStage: string | null;
  leftRequired: number;
  rightRequired: number;
  rewardValue: number;
  rewardPackage: string;
}

export const STAGE_CONFIG: Record<string, StageConfig> = {
  STARTER: {
    name: 'Starter Level',
    previousStage: null,
    leftRequired: 1, // immediate children
    rightRequired: 1, // immediate children
    rewardValue: 2000,
    rewardPackage: '2000 Cash',
  },
  EMERALD: {
    name: 'Emerald Stage 1',
    previousStage: 'STARTER',
    leftRequired: 7, // within first 14
    rightRequired: 7, // within first 14
    rewardValue: 25000,
    rewardPackage:
      'Option A: 1 carton of Noodles, 1 roll of milk, 1 roll of Milo, 1 pack of sugar, Cash ₦10,000 | Option B: 5kg Garri, 5kg Beans, 1 liter Palm Oil, Cash ₦10,000 | Option C: Rice 10kg, Cash ₦10,000',
  },
  SILVER: {
    name: 'Silver Stage 2',
    previousStage: 'EMERALD',
    leftRequired: 7,
    rightRequired: 7,
    rewardValue: 100000,
    rewardPackage:
      '1 carton spaghetti, 2 tins tomatoes, 1 packet of sugar, 2 rolls of milk and Milo, Cash ₦20,000, Health care product worth ₦11,000',
  },
  GOLD: {
    name: 'Gold Stage 3',
    previousStage: 'SILVER',
    leftRequired: 7,
    rightRequired: 7,
    rewardValue: 300000,
    rewardPackage:
      '1 pack of Golden Morn, Milk refill, Carton of noodles, ½ bag of rice, ½ carton of spaghetti, 1 big custard, ½ carton of tin tomatoes, Maggie 1 pack, Pack of sugar, 1 liter groundnut oil, Cash ₦100,000',
  },
  JASPER: {
    name: 'Jasper Stage 4',
    previousStage: 'GOLD',
    leftRequired: 7,
    rightRequired: 7,
    rewardValue: 3800000,
    rewardPackage:
      'Cash ₦1,000,000, Foodstuffs worth ₦200,000, Health care product ₦100,000, Children school fee support ₦250,000, Loan ₦250,000, First car award ₦2,000,000',
  },
  SAPPHIRE: {
    name: 'Sapphire Stage 5',
    previousStage: 'JASPER',
    leftRequired: 7,
    rightRequired: 7,
    rewardValue: 8800000,
    rewardPackage:
      'Cash ₦4,000,000, Foodstuff ₦400,000, Android phone worth ₦200,000, Second car award ₦3,000,000, Health care product ₦50,000, Refrigerator ₦150,000, Loan ₦1,000,000',
  },
  DIAMOND: {
    name: 'Diamond Stage 6',
    previousStage: 'SAPPHIRE',
    leftRequired: 7,
    rightRequired: 7,
    rewardValue: 30000000,
    rewardPackage:
      'Brand new car ₦8,000,000, House award ₦10,000,000, Foodstuff ₦500,000, Electronics ₦200,000, Children school fees ₦300,000, Health product ₦300,000, Cash ₦6,000,000, Send-off party ₦1,000,000, International trip',
  },
};
