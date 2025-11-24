import axios from 'axios';
import { config } from '../config';

export class RewardsService {
  private client = axios.create({
    baseURL: config.gammaBaseUrl,
    timeout: 10_000,
  });

  async getMarketReward(marketId: string) {
    const { data } = await this.client.get<{
      epochStart: string;
      epochEnd: string;
      rewardPool: string;
    }>(`/rewards/market/${marketId}`);

    return data;
  }
}
