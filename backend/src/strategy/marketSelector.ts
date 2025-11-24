import { StrategyConfig } from '@prisma/client';
import { LpCandidateMarket } from '../types/domain';

export class MarketSelector {
  selectMarketsForLp(
    markets: LpCandidateMarket[],
    strategy: StrategyConfig
  ): LpCandidateMarket[] {
    const allowedTags = strategy.allowedTags ?? [];
    const filtered = markets.filter((m) => {
      if (allowedTags.length === 0) return true;
      return m.tags.some((t) => allowedTags.includes(t));
    });
    return filtered;
  }
}
