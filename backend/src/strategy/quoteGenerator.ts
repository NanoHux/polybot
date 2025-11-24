import { StrategyConfig } from '@prisma/client';
import { ClobOrderBook } from '../types/polymarket';
import {
  GeneratedQuote,
  SimplifiedMarketWithScore,
  StrategyParams,
} from '../types/domain';

export class QuoteGenerator {
  generateQuotes(input: {
    market: SimplifiedMarketWithScore;
    book: ClobOrderBook;
    strategy: StrategyConfig;
  }): GeneratedQuote[] {
    const params = parseParams(input.strategy);
    const yesToken = input.market.tokens?.find(
      (t) => t.outcome.toLowerCase() === 'yes'
    )?.token_id;
    const targetToken = yesToken ?? input.market.tokens?.[0]?.token_id;
    if (!targetToken) return [];

    const tickSize = Number(input.book.tick_size ?? 0.01);
    const mid = input.market.midPrice;
    const vCents =
      Number(input.market.max_incentive_spread ?? input.market.rewards?.max_spread ?? 0) || 0;
    const vProb = vCents / 100;

    const levels = Math.max(1, params.orderLadderLevels);
    const maxOffset = Math.min(
      vProb,
      (levels * params.ladderStepBps) / 10000
    );

    const minSize = Math.max(
      params.minOrderSizeShares,
      Number(input.market.min_incentive_size ?? input.market.rewards?.min_size ?? 1)
    );
    const maxSize = params.maxOrderSizeShares;

    const quotes: GeneratedQuote[] = [];
    for (let i = 0; i < levels; i++) {
      const offset = (i + 0.5) * (maxOffset / levels);
      const closeness = maxOffset > 0 ? (maxOffset - offset) / maxOffset : 1;
      const size = clamp(
        minSize + closeness * (maxSize - minSize),
        minSize,
        maxSize
      );

      const buyPrice = clamp(mid - offset, tickSize, 1 - tickSize);
      const sellPrice = clamp(mid + offset, tickSize, 1 - tickSize);

      if (buyPrice > 0 && size >= minSize) {
        quotes.push({
          tokenId: targetToken,
          outcome: 'YES',
          side: 'BUY',
          price: roundToTick(buyPrice, tickSize),
          size: size,
        });
      }
      if (sellPrice < 1 && size >= minSize) {
        quotes.push({
          tokenId: targetToken,
          outcome: 'YES',
          side: 'SELL',
          price: roundToTick(sellPrice, tickSize),
          size: size,
        });
      }
    }

    return quotes;
  }
}

function parseParams(strategy: StrategyConfig): StrategyParams {
  const p = (strategy.params as unknown as Partial<StrategyParams>) ?? {};
  return {
    totalCapitalUsdc: p.totalCapitalUsdc ?? 130,
    maxMarkets: p.maxMarkets ?? 4,
    maxCapitalPerMarket: p.maxCapitalPerMarket ?? 30,
    minRewardPoolUsd: p.minRewardPoolUsd ?? 200,
    maxExistingDepthUsd: p.maxExistingDepthUsd ?? 500,
    minMidPrice: p.minMidPrice ?? 0.15,
    maxMidPrice: p.maxMidPrice ?? 0.85,
    orderLadderLevels: p.orderLadderLevels ?? 3,
    ladderStepBps: p.ladderStepBps ?? 50,
    minOrderSizeShares: p.minOrderSizeShares ?? 10,
    maxOrderSizeShares: p.maxOrderSizeShares ?? 80,
    minUtilization: p.minUtilization ?? 0.6,
    maxUtilization: p.maxUtilization ?? 0.95,
    avoidNearExpiryHours: p.avoidNearExpiryHours ?? 6,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function roundToTick(price: number, tickSize: number) {
  const inv = Math.round(price / tickSize);
  return Number((inv * tickSize).toFixed(4));
}
