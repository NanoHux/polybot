import { OrderStatus, StrategyConfig } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  GeneratedQuote,
  SimplifiedMarketWithScore,
  StrategyParams,
} from '../types/domain';

export class RiskManager {
  async filterQuotes(input: {
    walletId: number;
    market: SimplifiedMarketWithScore;
    marketDbId: number;
    quotes: GeneratedQuote[];
    strategy: StrategyConfig;
  }): Promise<GeneratedQuote[]> {
    const params = parseParams(input.strategy);

    const openOrders = await prisma.order.findMany({
      where: {
        walletId: input.walletId,
        marketId: input.marketDbId,
        status: OrderStatus.OPEN,
      },
    });

    const currentExposure = openOrders.reduce((sum, o) => {
      const remaining = Number(o.size) - Number(o.filledSize ?? 0);
      return sum + Number(o.price) * remaining;
    }, 0);

    const maxPerMarket = params.maxCapitalPerMarket;
    const availableForThisMarket = Math.max(maxPerMarket - currentExposure, 0);
    if (availableForThisMarket <= 0) return [];

    const sorted = [...input.quotes].sort(
      (a, b) =>
        Math.abs(a.price - input.market.midPrice) -
        Math.abs(b.price - input.market.midPrice)
    );

    const selected: GeneratedQuote[] = [];
    let cumulative = 0;
    for (const q of sorted) {
      const notional = Number(q.price) * Number(q.size);
      if (cumulative + notional <= availableForThisMarket) {
        selected.push(q);
        cumulative += notional;
      }
    }

    return selected;
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
