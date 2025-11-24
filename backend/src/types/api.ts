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

export interface ApiCreateOrderRequest {
  marketId: string;
  outcome: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
}

export interface ApiCreateOrderResponse {
  orderId: number;
  clobOrderId: string;
}

export interface ApiStrategyToggleResponse {
  success: boolean;
  message?: string;
}

export interface ApiStrategyConfigUpdateRequest {
  maxCapitalPerMarket?: number;
  minExpectedApr?: number;
  allowedTags?: string[];
  params?: Record<string, any>;
}
