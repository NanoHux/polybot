export interface GammaMarketsResponse {
  markets: GammaMarket[];
}

export interface GammaMarket {
  id: string;
  question: string;
  slug?: string;
  status: string;
  outcomes?: GammaOutcome[];
  startDate?: string;
  endDate?: string;
}

export interface GammaOutcome {
  id: string;
  name: string;
}

export interface GammaMarketDetail extends GammaMarket {
  minIncentiveSize?: string;
  maxIncentiveSpread?: string;
  reward?: {
    epochStart: string;
    epochEnd: string;
    rewardPool: string;
  };
}

export interface ClobOrderBook {
  bids: ClobOrderLevel[];
  asks: ClobOrderLevel[];
  tick_size?: string;
}

export interface ClobOrderLevel {
  price: string;
  size: string;
}

export interface ClobCreateOrderResponse {
  order_id: string;
  status: string;
}

export interface ClobOrdersResponse {
  orders: OpenOrder[];
}

export interface OpenOrder {
  id: string;
  status: string;
  market: string;
  asset_id: string;
  maker_address: string;
  owner: string;
  price: string;
  side: 'buy' | 'sell';
  size_matched: string;
  original_size: string;
}

export interface SimplifiedMarketsResponse {
  data: SimplifiedMarket[];
  next_cursor?: string;
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
