import { StrategyConfig } from '@prisma/client';

export interface StrategyParams {
  totalCapitalUsdc: number;
  maxMarkets: number;
  maxCapitalPerMarket: number;
  minRewardPoolUsd: number;
  maxExistingDepthUsd: number;
  minMidPrice: number;
  maxMidPrice: number;
  orderLadderLevels: number;
  ladderStepBps: number;
  minOrderSizeShares: number;
  maxOrderSizeShares: number;
  minUtilization: number;
  maxUtilization: number;
  avoidNearExpiryHours: number;
}

export interface SimplifiedMarket {
  condition_id: string;
  tokens: { token_id: string; outcome: string }[];
  rewards?: {
    min_size?: number;
    max_spread?: number;
    reward_pool?: number;
    total_rewards?: number;
    reward_epoch_reward?: number;
    event_start_date?: string;
    event_end_date?: string;
  };
  min_incentive_size?: string;
  max_incentive_spread?: string;
  active?: boolean;
  closed?: boolean;
}

export interface SimplifiedMarketWithScore extends SimplifiedMarket {
  score: number;
  midPrice: number;
  existingDepthUsd: number;
}

export interface GeneratedQuote {
  tokenId: string;
  outcome: 'YES' | 'NO';
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
}
