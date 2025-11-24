import { prisma } from '../lib/prisma';
import { GammaService } from '../polymarket/gammaService';
import { RewardsService } from '../polymarket/rewardsService';

const gammaService = new GammaService();
const rewardsService = new RewardsService();

export async function runMarketSync() {
  try {
    const { markets } = await gammaService.listMarkets();
    for (const m of markets) {
      const detail = await gammaService.getMarket(m.id);
      const reward = await rewardsService.getMarketReward(m.id);

      const market = await prisma.market.upsert({
        where: { marketId: m.id },
        update: {
          question: m.question,
          slug: m.slug,
          status: m.status,
          startsAt: detail.startDate ? new Date(detail.startDate) : undefined,
          endsAt: detail.endDate ? new Date(detail.endDate) : undefined,
        },
        create: {
          marketId: m.id,
          question: m.question,
          slug: m.slug,
          status: m.status,
          tags: [],
        },
      });

      await prisma.marketIncentiveConfig.create({
        data: {
          marketId: market.id,
          minIncentiveSize: detail.minIncentiveSize ?? null,
          maxIncentiveSpread: detail.maxIncentiveSpread ?? null,
          rewardPoolTotal: reward?.rewardPool ?? null,
          epochStart: reward?.epochStart ? new Date(reward.epochStart) : undefined,
          epochEnd: reward?.epochEnd ? new Date(reward.epochEnd) : undefined,
          raw: { detail, reward } as unknown as object,
        },
      });
    }
  } catch (err) {
    console.error('[runMarketSync] failed', err);
  }
}
