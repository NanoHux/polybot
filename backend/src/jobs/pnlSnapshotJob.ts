import { prisma } from '../lib/prisma';

export async function runPnlSnapshot() {
  try {
    const wallet = await prisma.wallet.findFirst();
    if (!wallet) return;

    const orders = await prisma.order.findMany({
      where: { walletId: wallet.id },
    });
    const rewards = await prisma.liquidityReward.aggregate({
      _sum: { rewardAmount: true },
      where: { walletId: wallet.id },
    });

    await prisma.pnlSnapshot.create({
      data: {
        walletId: wallet.id,
        capturedAt: new Date(),
        totalEquity: orders.length,
        totalRewards: rewards._sum.rewardAmount ?? 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
      },
    });
  } catch (err) {
    console.error('[runPnlSnapshot] failed', err);
  }
}
