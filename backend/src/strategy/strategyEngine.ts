import { OrderSide, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ClobService } from '../polymarket/clobService';
import { MarketSelector } from './marketSelector';
import { QuoteGenerator } from './quoteGenerator';
import { RiskManager } from './riskManager';
import { GeneratedQuote, SimplifiedMarket } from '../types/domain';
import { PlaceOrderSingleRequest } from '../types/polymarketOrders';

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

  const simplifiedMarkets = await fetchAllSimplifiedMarkets();
  const selectedMarkets = await marketSelector.selectMarketsForLp(
    simplifiedMarkets,
    strategy
  );
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
      const dbMarket = await prisma.market.upsert({
        where: { marketId: m.condition_id },
        update: { question: m.condition_id, status: 'open' },
        create: {
          marketId: m.condition_id,
          question: m.condition_id,
          status: 'open',
          tags: [],
          outcomeYesId: m.tokens?.[0]?.token_id,
          outcomeNoId: m.tokens?.[1]?.token_id,
        },
      });

      const book = await clobService.getBookByTokenId(
        m.tokens?.[0]?.token_id ?? ''
      );
      const targetQuotes = quoteGenerator.generateQuotes({
        market: m,
        book,
        strategy,
      });

      const filteredQuotes = await riskManager.filterQuotes({
        walletId: wallet.id,
        market: m,
        marketDbId: dbMarket.id,
        quotes: targetQuotes,
        strategy,
      });

      const openOrders = await prisma.order.findMany({
        where: {
          walletId: wallet.id,
          marketId: dbMarket.id,
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
        const orderPayload: PlaceOrderSingleRequest = {
          order: {
            salt: '',
            maker: wallet.address,
            signer: wallet.address,
            taker: wallet.address,
            tokenId: q.tokenId,
            makerAmount: String(q.size),
            takerAmount: String(q.price),
            expiration: String(Math.floor(Date.now() / 1000) + 3600),
            nonce: String(Date.now()),
            feeRateBps: '0',
            side: q.side,
            signature: '',
          },
          owner: wallet.address,
          orderType: 'GTC',
        };
        const clobOrder = await clobService.createOrder(orderPayload);

        await prisma.order.create({
          data: {
            walletId: wallet.id,
            marketId: dbMarket.id,
            clobOrderId: clobOrder.orderId,
            outcomeId: q.tokenId,
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
      console.error('[strategyTick] Error on market', m.condition_id, err);
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
        q.tokenId === o.outcomeId &&
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
        o.outcomeId === q.tokenId &&
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

async function fetchAllSimplifiedMarkets(): Promise<SimplifiedMarket[]> {
  const all: SimplifiedMarket[] = [];
  let cursor: string | undefined = undefined;
  while (true) {
    const page = await clobService.getSimplifiedMarkets(cursor);
    if (page?.data?.length) {
      console.log(
        `[simplified-markets] page size=${page.data.length} next=${page.next_cursor ?? 'null'} sample keys=${Object.keys(
          page.data[0] ?? {}
        ).join(',')}`
      );
    } else {
      console.warn('[simplified-markets] empty page or undefined data');
    }
    all.push(...(page.data ?? []));
    if (!page.next_cursor || page.next_cursor === '' || page.next_cursor === 'LTE=') {
      break;
    }
    cursor = page.next_cursor;
    if (all.length >= 500) break; // safety cap
  }
  return all;
}
