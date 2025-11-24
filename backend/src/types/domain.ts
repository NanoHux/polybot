import { Market, MarketIncentiveConfig, StrategyConfig } from '@prisma/client';
import { ClobOrderBook } from './polymarket';

export interface LpCandidateMarket extends Market {
  incentiveConfigs: MarketIncentiveConfig[];
}

export interface QuoteGeneratorInput {
  market: LpCandidateMarket;
  orderbook: ClobOrderBook;
  incentiveConfig?: MarketIncentiveConfig;
  strategy: StrategyConfig;
}

export interface GeneratedQuote {
  outcomeId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
}

export interface RiskCheckInput {
  walletId: number;
  market: LpCandidateMarket;
  quotes: GeneratedQuote[];
  strategy: StrategyConfig;
}
