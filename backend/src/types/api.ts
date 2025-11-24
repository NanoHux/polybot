export interface DashboardRewardPoint {
  timestamp: string;
  rewardAmount: number;
}

export interface DashboardAprPoint {
  marketId: string;
  label: string;
  apr: number;
  timestamp: string;
}

export interface ApiDashboardResponse {
  running: boolean;
  totalEquity: number;
  totalRewards: number;
  unrealizedPnl: number;
  lastUpdated: string;
  systemAlert?: string | null;
  rewardHistory: DashboardRewardPoint[];
  aprSeries: DashboardAprPoint[];
}

export interface ApiMarketSummary {
  id: number;
  marketId: string;
  question: string | null;
  status: string | null;
  minIncentiveSize: string | null;
  maxIncentiveSpread: string | null;
  expectedApr?: number | null;
  myLiquidityShare?: number | null;
  epochEnd?: string | null;
}

export type ApiOrderSide = 'BUY' | 'SELL';

export interface ApiOrder {
  id: string;
  clobOrderId: string;
  marketId: string;
  question?: string | null;
  outcomeId: string;
  side: ApiOrderSide;
  price: number;
  size: number;
  status: string;
  placedAt: string;
}

export interface ApiOrdersResponse {
  orders: ApiOrder[];
}
