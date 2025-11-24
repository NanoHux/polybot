import { OrderSide, OrderStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ClobService } from '../../polymarket/clobService';
import { PlaceOrderSingleRequest } from '../../types/polymarketOrders';
import { ApiOrder, ApiOrdersResponse } from '../../types/api';

const clobService = new ClobService();

export async function getLiveOrders(_req: Request, res: Response) {
  try {
    const { orders } = await clobService.listActiveOrders();
    const data: ApiOrder[] = (orders ?? []).map((o) => ({
      id: o.id,
      clobOrderId: o.id,
      marketId: (o as any).market ?? '',
      question: null,
      side: (o as any).side?.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
      outcomeId: (o as any).asset_id ?? '',
      status: (o as any).status ?? 'OPEN',
      price: Number((o as any).price ?? 0),
      size: Number((o as any).size ?? (o as any).original_size ?? 0),
      placedAt: (o as any).createdAt ? new Date((o as any).createdAt).toISOString() : new Date().toISOString(),
    }));
    const payload: ApiOrdersResponse = { orders: data };
    res.json(payload);
  } catch (err: any) {
    console.error('[getLiveOrders] error', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to fetch live orders' });
  }
}

export async function createOrder(req: Request, res: Response) {
  const { marketId, outcome, side, price, size } = req.body;
  const wallet = await prisma.wallet.findFirst();
  const market = await prisma.market.findUnique({ where: { marketId } });

  if (!wallet || !market) {
    return res.status(400).json({ error: 'Missing wallet or market' });
  }
  if (!marketId || !outcome || !side || typeof price !== 'number' || typeof size !== 'number') {
    return res.status(400).json({ error: 'Invalid order payload' });
  }

  const normalizedSide = String(side).toUpperCase() === 'BUY' ? 'BUY' : 'SELL';

  // TODO: build SignedOrder per Polymarket spec; placeholder payload here.
  const clobPayload: PlaceOrderSingleRequest = {
    order: {
      salt: '',
      maker: wallet.address,
      signer: wallet.address,
      taker: wallet.address,
      tokenId: outcome,
      makerAmount: String(size),
      takerAmount: String(price),
      expiration: String(Math.floor(Date.now() / 1000) + 3600),
      nonce: String(Date.now()),
      feeRateBps: '0',
      side: normalizedSide,
      signature: '',
    },
    owner: wallet.address,
    orderType: 'GTC',
  };

  const clobOrder = await clobService.createOrder(clobPayload);

  const order = await prisma.order.create({
    data: {
      walletId: wallet.id,
      marketId: market.id,
      clobOrderId: clobOrder.orderId,
      outcomeId: outcome,
      side: normalizedSide === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
      price,
      size,
      filledSize: 0,
      status: OrderStatus.OPEN,
      isStrategyManaged: false,
      placedAt: new Date(),
      raw: clobOrder as unknown as object,
    },
  });

  res.json({
    orderId: order.id,
    clobOrderId: clobOrder.orderId,
  });
}

export async function cancelOrder(req: Request, res: Response) {
  const id = Number(req.params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order?.clobOrderId) {
    return res.status(404).json({ error: 'Order not found' });
  }

  await clobService.cancelOrder(order.clobOrderId);
  await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.CANCELLED },
  });

  res.json({ success: true });
}
