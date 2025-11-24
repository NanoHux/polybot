import { OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ClobService } from '../polymarket/clobService';

const clobService = new ClobService();

export async function runOrderSync() {
  if (process.env.POLYMARKET_DISABLE_ORDER_SYNC === 'true') {
    return;
  }
  try {
    const wallet = await prisma.wallet.findFirst();
    if (!wallet?.address) return;

    const clobOrders = await clobService.listActiveOrders();
    for (const remote of clobOrders.orders) {
      const local = await prisma.order.findFirst({
        where: { clobOrderId: remote.id },
      });
      if (!local) continue;

      const mappedStatus = mapClobStatus(remote.status);
      const filledSize = Number((remote as any).size_matched ?? 0);
      const originalSize = Number((remote as any).original_size ?? 0);
      await prisma.order.update({
        where: { id: local.id },
        data: {
          filledSize,
          size: originalSize || local.size,
          status: mappedStatus ?? local.status,
          raw: remote as unknown as object,
        },
      });
    }
  } catch (err) {
    console.error('[runOrderSync] failed', err);
  }
}

function mapClobStatus(status: string): OrderStatus | null {
  const normalized = status.toUpperCase();
  if (normalized === 'OPEN') return OrderStatus.OPEN;
  if (normalized === 'PARTIALLY_FILLED') return OrderStatus.PARTIALLY_FILLED;
  if (normalized === 'FILLED') return OrderStatus.FILLED;
  if (normalized === 'CANCELLED') return OrderStatus.CANCELLED;
  return null;
}
