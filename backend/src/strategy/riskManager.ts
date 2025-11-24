import { StrategyConfig } from '@prisma/client';
import { RiskCheckInput } from '../types/domain';

export class RiskManager {
  async filterQuotes(input: RiskCheckInput) {
    const { quotes, strategy } = input;
    const maxCap = Number(strategy.maxCapitalPerMarket ?? 0);
    if (maxCap <= 0) return quotes;

    const total = quotes.reduce((sum, q) => sum + Number(q.price) * Number(q.size), 0);
    if (total > maxCap) {
      // Simple throttle: cut size by half if exceeding cap
      return quotes.map((q) => ({ ...q, size: Number(q.size) / 2 }));
    }
    return quotes;
  }
}
