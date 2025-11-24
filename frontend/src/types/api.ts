export interface ApiMarketSummary {
  id: number;
  marketId: string;
  question: string | null;
  status: string | null;
  minIncentiveSize: string | null;
  maxIncentiveSpread: string | null;
  rewardPoolTotal: string | null;
}

export interface ApiDashboardResponse {
  totalEquity: number;
  totalRewards: number;
  realizedPnl: number;
  unrealizedPnl: number;
  running: boolean;
  markets: ApiMarketKpi[];
}

export interface ApiMarketKpi {
  marketId: string;
  question: string | null;
  currentApr: number | null;
  myLiquidityShare: number | null;
}

export interface ApiOrder {
  id: number;
  marketId: number;
  outcomeId: string | null;
  side: string;
  price: string;
  size: string;
  status: string;
}
