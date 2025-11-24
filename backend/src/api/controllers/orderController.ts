import { OrderSide, OrderStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ClobService } from '../../polymarket/clobService';

const clobService = new ClobService();

export async function listOrders(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    orderBy: { placedAt: 'desc' },
  });
  res.json(orders);
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

  const clobOrder = await clobService.createOrder({
    marketId,
    outcomeId: outcome,
    side: normalizedSide,
    price,
    size,
  });

  const order = await prisma.order.create({
    data: {
      walletId: wallet.id,
      marketId: market.id,
      clobOrderId: clobOrder.order_id,
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
    clobOrderId: clobOrder.order_id,
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
