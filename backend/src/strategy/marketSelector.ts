import { StrategyConfig } from '@prisma/client';
import { ClobService } from '../polymarket/clobService';
import {
  SimplifiedMarket,
  SimplifiedMarketWithScore,
  StrategyParams,
} from '../types/domain';
import { ClobOrderBook } from '../types/polymarket';

export class MarketSelector {
  private clobService = new ClobService();

  async selectMarketsForLp(
    simplifiedMarkets: SimplifiedMarket[],
    strategy: StrategyConfig
  ): Promise<SimplifiedMarketWithScore[]> {
    const params = parseParams(strategy);
    const now = Date.now();
    const results: SimplifiedMarketWithScore[] = [];

    for (const m of simplifiedMarkets) {
      if (!m.active || m.closed) continue;
      const rewardEnd = m.rewards?.event_end_date
        ? new Date(m.rewards.event_end_date).getTime()
        : null;
      if (!rewardEnd || rewardEnd <= now) continue;
      const hoursLeft = (rewardEnd - now) / (1000 * 60 * 60);
      if (hoursLeft < params.avoidNearExpiryHours) continue;

      const rewardPoolUsd =
        Number(m.rewards?.reward_epoch_reward ?? m.rewards?.total_rewards ?? m.rewards?.reward_pool ?? 0);
      if (rewardPoolUsd < params.minRewardPoolUsd) continue;

      const maxIncentiveSize = Number(m.min_incentive_size ?? m.rewards?.min_size ?? 0);
      if (maxIncentiveSize > params.maxOrderSizeShares) continue;

      const primaryToken = m.tokens?.[0]?.token_id;
      if (!primaryToken) continue;

      const book = await this.safeGetBook(primaryToken);
      if (!book) continue;
      const mid = calcMid(book);
      if (mid < params.minMidPrice || mid > params.maxMidPrice) continue;

      const vProb =
        Number(m.max_incentive_spread ?? m.rewards?.max_spread ?? 0) / 100;
      const eligibleBidMin = mid - vProb;
      const eligibleAskMax = mid + vProb;

      const existingDepthUsd = calcDepthUsd(book, eligibleBidMin, eligibleAskMax);
      if (existingDepthUsd > params.maxExistingDepthUsd) continue;

      const depth = Math.max(existingDepthUsd, 10);
      const scoreBase = rewardPoolUsd / depth;
      const midWeight = 1 + (1 - Math.abs(mid - 0.5)) * 0.1;
      const timeWeight = 1 + Math.min(hoursLeft / 168, 0.2); // up to +20% over 7 days
      const score = scoreBase * midWeight * timeWeight;

      results.push({
        ...m,
        midPrice: mid,
        existingDepthUsd,
        score,
      });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, params.maxMarkets);
  }

  private async safeGetBook(tokenId: string): Promise<ClobOrderBook | null> {
    try {
      return await this.clobService.getBookByTokenId(tokenId);
    } catch (err) {
      console.error('[MarketSelector] failed to get book', tokenId, err);
      return null;
    }
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

function calcMid(book: ClobOrderBook): number {
  const bestBid = Number(book.bids?.[0]?.price ?? 0);
  const bestAsk = Number(book.asks?.[0]?.price ?? 1);
  if (bestBid <= 0 || bestAsk <= 0) return 0.5;
  return (bestBid + bestAsk) / 2;
}

function calcDepthUsd(
  book: ClobOrderBook,
  eligibleBidMin: number,
  eligibleAskMax: number
): number {
  let depth = 0;
  for (const b of book.bids ?? []) {
    const price = Number(b.price);
    if (price >= eligibleBidMin) {
      depth += price * Number(b.size);
    }
  }
  for (const a of book.asks ?? []) {
    const price = Number(a.price);
    if (price <= eligibleAskMax) {
      depth += price * Number(a.size);
    }
  }
  return depth;
}
