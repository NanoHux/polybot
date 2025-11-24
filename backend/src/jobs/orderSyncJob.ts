import { OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ClobService } from '../polymarket/clobService';

const clobService = new ClobService();

export async function runOrderSync() {
  try {
    const wallet = await prisma.wallet.findFirst();
    if (!wallet?.address) return;

    const clobOrders = await clobService.listOrders(wallet.address);
    for (const remote of clobOrders.orders) {
      const local = await prisma.order.findFirst({
        where: { clobOrderId: remote.order_id },
      });
      if (!local) continue;

      const mappedStatus = mapClobStatus(remote.status);
      await prisma.order.update({
        where: { id: local.id },
        data: {
          filledSize: Number(remote.size),
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
