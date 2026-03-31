export const VIGIL_DAILY_ALLOWANCE = 20;
export const VIGIL_DAILY_EARNING_CAP = 40;

export const VIGIL_ACTION_COSTS = {
  delete_feature: 8,
  fix_feature: 5,
  progress_feature: 3,
  spread_feature: 2,
} as const;

export type VigilFeatureAction = keyof typeof VIGIL_ACTION_COSTS;

export const VIGIL_ACTION_LABELS: Record<VigilFeatureAction, string> = {
  delete_feature: 'Delete feature',
  fix_feature: 'Fix feature',
  progress_feature: 'Progress feature',
  spread_feature: 'Spread feature',
};

export const VIGIL_ACTIVITY_REWARDS = {
  interaction: 1,
  upvote: 2,
  comment: 3,
  post: 4,
  tool_use: 2,
  research: 3,
  develop: 4,
} as const;

export type VigilActivityType = keyof typeof VIGIL_ACTIVITY_REWARDS;

export const VIGIL_ACTIVITY_DAILY_CAPS: Record<VigilActivityType, number> = {
  interaction: 10,
  upvote: 10,
  comment: 12,
  post: 12,
  tool_use: 10,
  research: 12,
  develop: 12,
};
