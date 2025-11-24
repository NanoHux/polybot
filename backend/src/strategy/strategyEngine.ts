import { OrderSide, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ClobService } from '../polymarket/clobService';
import { MarketSelector } from './marketSelector';
import { QuoteGenerator } from './quoteGenerator';
import { RiskManager } from './riskManager';
import { GeneratedQuote } from '../types/domain';

const clobService = new ClobService();
const marketSelector = new MarketSelector();
const quoteGenerator = new QuoteGenerator();
const riskManager = new RiskManager();

export async function strategyTick() {
  const strategy = await prisma.strategyConfig.findFirst({
    where: { isActive: true },
  });

  if (!strategy) {
    console.log('[strategyTick] No active strategy, skipping');
    return;
  }

  const dbMarkets = await prisma.market.findMany({
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    where: { status: 'open' },
  });

  const selectedMarkets = marketSelector.selectMarketsForLp(dbMarkets, strategy);
  if (selectedMarkets.length === 0) {
    console.log('[strategyTick] No markets selected');
    return;
  }

  const wallet = await prisma.wallet.findFirst();
  if (!wallet) {
    console.warn('[strategyTick] No wallet configured');
    return;
  }

  for (const m of selectedMarkets) {
    try {
      const orderbook = await clobService.getOrderBook(m.marketId);
      const incentiveConfig = m.incentiveConfigs[0];
      const targetQuotes = quoteGenerator.generateQuotes({
        market: m,
        orderbook,
        incentiveConfig,
        strategy,
      });

      const filteredQuotes = await riskManager.filterQuotes({
        walletId: wallet.id,
        market: m,
        quotes: targetQuotes,
        strategy,
      });

      const openOrders = await prisma.order.findMany({
        where: {
          walletId: wallet.id,
          marketId: m.id,
          status: OrderStatus.OPEN,
          isStrategyManaged: true,
        },
      });

      const { ordersToCancel, ordersToCreate } = diffOrders(
        openOrders,
        filteredQuotes
      );

      for (const o of ordersToCancel) {
        if (o.clobOrderId) {
          await clobService.cancelOrder(o.clobOrderId);
        }
        await prisma.order.update({
          where: { id: o.id },
          data: { status: OrderStatus.CANCELLED },
        });
      }

      for (const q of ordersToCreate) {
        const clobOrder = await clobService.createOrder({
          marketId: m.marketId,
          outcomeId: q.outcomeId,
          side: q.side,
          price: q.price,
          size: q.size,
        });

        await prisma.order.create({
          data: {
            walletId: wallet.id,
            marketId: m.id,
            clobOrderId: clobOrder.order_id,
            outcomeId: q.outcomeId,
            side: q.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
            price: q.price,
            size: q.size,
            filledSize: 0,
            status: OrderStatus.OPEN,
            isStrategyManaged: true,
            placedAt: new Date(),
            raw: clobOrder as unknown as object,
          },
        });
      }
    } catch (err) {
      console.error('[strategyTick] Error on market', m.marketId, err);
    }
  }
}

function diffOrders(
  openOrders: {
    id: number;
    outcomeId: string | null;
    side: OrderSide;
    price: any;
    size: any;
    clobOrderId: string | null;
  }[],
  targetQuotes: GeneratedQuote[]
) {
  const ordersToCancel: typeof openOrders = [];
  const ordersToCreate: GeneratedQuote[] = [];

  for (const o of openOrders) {
    const match = targetQuotes.find(
      (q) =>
        q.outcomeId === o.outcomeId &&
        q.side === (o.side === OrderSide.BUY ? 'BUY' : 'SELL') &&
        Number(q.price) === Number(o.price) &&
        Number(q.size) === Number(o.size)
    );

    if (!match) {
      ordersToCancel.push(o);
    }
  }

  for (const q of targetQuotes) {
    const match = openOrders.find(
      (o) =>
        o.outcomeId === q.outcomeId &&
        (o.side === OrderSide.BUY ? 'BUY' : 'SELL') === q.side &&
        Number(o.price) === Number(q.price) &&
        Number(o.size) === Number(q.size)
    );
    if (!match) {
      ordersToCreate.push(q);
    }
  }

  return { ordersToCancel, ordersToCreate };
}
