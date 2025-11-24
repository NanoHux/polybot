import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export async function getMarkets(_req: Request, res: Response) {
  const markets = await prisma.market.findMany({
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  res.json(
    markets.map((m) => ({
      id: m.id,
      marketId: m.marketId,
      question: m.question,
      status: m.status,
      minIncentiveSize: m.incentiveConfigs[0]?.minIncentiveSize ?? null,
      maxIncentiveSpread: m.incentiveConfigs[0]?.maxIncentiveSpread ?? null,
      rewardPoolTotal: m.incentiveConfigs[0]?.rewardPoolTotal ?? null,
    }))
  );
}

export async function getMarketDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      orders: true,
      orderBookSnaps: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  res.json(market);
}
