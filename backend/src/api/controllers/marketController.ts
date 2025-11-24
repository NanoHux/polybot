import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export async function getMarkets(_req: Request, res: Response) {
  const markets = await prisma.market.findMany({
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      orders: true,
    },
    orderBy: { id: 'asc' },
  });

  if (!markets.length) {
    console.warn('[getMarkets] no markets found in DB');
  } else {
    const missingConfig = markets.filter((m) => !m.incentiveConfigs.length);
    if (missingConfig.length) {
      console.warn(
        `[getMarkets] markets missing incentiveConfigs: ${missingConfig
          .map((m) => m.marketId)
          .join(', ')}`
      );
    }
  }

  res.json(
    markets.map((m) => ({
      id: m.id,
      marketId: m.marketId,
      question: m.question ?? `Market ${m.marketId}`,
      status: m.status ?? 'open',
      minIncentiveSize: m.incentiveConfigs[0]?.minIncentiveSize?.toString() ?? '0',
      maxIncentiveSpread: m.incentiveConfigs[0]?.maxIncentiveSpread?.toString() ?? '0',
      expectedApr: m.incentiveConfigs[0]?.rewardPoolTotal
        ? Number(m.incentiveConfigs[0]?.rewardPoolTotal ?? 0)
        : 0,
      myLiquidityShare: m.orders.length
        ? Math.min(
            1,
            m.orders.reduce((sum, o) => sum + Number(o.size ?? 0), 0) / 1000
          )
        : 0,
      epochEnd: m.incentiveConfigs[0]?.epochEnd
        ? m.incentiveConfigs[0]?.epochEnd?.toISOString()
        : null,
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
