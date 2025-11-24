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
  orders: ClobOrder[];
}

export interface ClobOrder {
  order_id: string;
  status: string;
  price: string;
  size: string;
  market: string;
  outcome: string;
}
