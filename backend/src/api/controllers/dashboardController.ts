import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { isBotRunning } from '../../jobs/scheduler';
import { ApiDashboardResponse } from '../../types/api';

export async function getDashboard(_req: Request, res: Response) {
  try {
    const [pnl, rewardsAgg, rewardsHistory, markets] = await Promise.all([
      prisma.pnlSnapshot.findFirst({ orderBy: { capturedAt: 'desc' } }),
      prisma.liquidityReward.aggregate({ _sum: { rewardAmount: true } }),
      prisma.liquidityReward.findMany({
        orderBy: { epochEnd: 'asc' },
        take: 30,
      }),
      prisma.market.findMany({
        include: {
          incentiveConfigs: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const rewardHistory = rewardsHistory.map((r) => ({
      timestamp: r.epochEnd.toISOString(),
      rewardAmount: Number(r.rewardAmount),
    }));

    const aprSeries = markets.map((m) => {
      const cfg = m.incentiveConfigs[0];
      if (!cfg?.rewardPoolTotal || !cfg?.epochStart || !cfg?.epochEnd) {
        return {
          marketId: m.marketId,
          label: m.question ?? m.marketId,
          apr: 0,
          timestamp: new Date().toISOString(),
        };
      }
      const pool = Number(cfg.rewardPoolTotal);
      const durationDays =
        (new Date(cfg.epochEnd).getTime() - new Date(cfg.epochStart).getTime()) /
        (1000 * 60 * 60 * 24);
      const baseCap = Number(cfg.minIncentiveSize ?? 1);
      const apr =
        durationDays > 0 && baseCap > 0 ? (pool / baseCap) * (365 / durationDays) : 0;
      return {
        marketId: m.marketId,
        label: m.question ?? m.marketId,
        apr,
        timestamp: new Date().toISOString(),
      };
    });

    const payload: ApiDashboardResponse = {
      totalEquity: pnl ? Number(pnl.totalEquity ?? 0) : 0,
      totalRewards: Number(rewardsAgg._sum.rewardAmount ?? 0),
      unrealizedPnl: pnl ? Number(pnl.unrealizedPnl ?? 0) : 0,
      running: isBotRunning(),
      lastUpdated: new Date().toISOString(),
      systemAlert: null,
      rewardHistory,
      aprSeries,
    };

    res.json(payload);
  } catch (err) {
    console.error('[getDashboard] error', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
}
