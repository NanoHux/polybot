import { prisma } from '../lib/prisma';
import { RewardsService } from '../polymarket/rewardsService';

const rewardsService = new RewardsService();

export async function runRewardsSync() {
  try {
    const markets = await prisma.market.findMany();
    for (const m of markets) {
      const reward = await rewardsService.getMarketReward(m.marketId);
      if (!reward) continue;
      const wallet = await prisma.wallet.findFirst();
      if (!wallet) continue;

      await prisma.liquidityReward.create({
        data: {
          walletId: wallet.id,
          marketId: m.id,
          epochStart: new Date(reward.epochStart),
          epochEnd: new Date(reward.epochEnd),
          rewardAmount: reward.rewardPool ?? 0,
          raw: reward,
        },
      });
    }
  } catch (err) {
    console.error('[runRewardsSync] failed', err);
  }
}
