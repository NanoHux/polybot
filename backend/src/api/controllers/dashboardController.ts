import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { isBotRunning } from '../../jobs/scheduler';

export async function getDashboard(_req: Request, res: Response) {
  const [pnl, rewards, markets] = await Promise.all([
    prisma.pnlSnapshot.findFirst({ orderBy: { capturedAt: 'desc' } }),
    prisma.liquidityReward.aggregate({ _sum: { rewardAmount: true } }),
    prisma.market.findMany({ select: { marketId: true, question: true, status: true } }),
  ]);

  res.json({
    totalEquity: pnl?.totalEquity ?? 0,
    totalRewards: rewards._sum.rewardAmount ?? 0,
    realizedPnl: pnl?.realizedPnl ?? 0,
    unrealizedPnl: pnl?.unrealizedPnl ?? 0,
    running: isBotRunning(),
    markets: markets.map((m) => ({
      marketId: m.marketId,
      question: m.question,
      currentApr: null,
      myLiquidityShare: null,
    })),
  });
}
