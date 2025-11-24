import { QuoteGeneratorInput, GeneratedQuote } from '../types/domain';

export class QuoteGenerator {
  generateQuotes(input: QuoteGeneratorInput): GeneratedQuote[] {
    const { orderbook, incentiveConfig, market } = input;
    const bestBid = Number(orderbook.bids?.[0]?.price ?? 0);
    const bestAsk = Number(orderbook.asks?.[0]?.price ?? 1);
    const mid = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : 0.5;

    const spreadLimit = Number(incentiveConfig?.maxIncentiveSpread ?? 0.05);
    const size = Number(incentiveConfig?.minIncentiveSize ?? 10);

    const buyPrice = Math.max(0.01, mid - spreadLimit / 2);
    const sellPrice = Math.min(0.99, mid + spreadLimit / 2);

    const outcomeYes = market.outcomeYesId ?? 'o-1';
    const outcomeNo = market.outcomeNoId ?? 'o-2';

    return [
      { outcomeId: outcomeYes, side: 'BUY', price: buyPrice, size },
      { outcomeId: outcomeNo, side: 'SELL', price: sellPrice, size },
    ];
  }
}
