import axios from 'axios';
import { config } from '../config';
import { GammaMarketDetail, GammaMarketsResponse } from '../types/polymarket';

export class GammaService {
  private client = axios.create({
    baseURL: config.gammaBaseUrl,
    timeout: 10_000,
  });

  async listMarkets(): Promise<GammaMarketsResponse> {
    const { data } = await this.client.get<GammaMarketsResponse>('/markets');
    return data;
  }

  async getMarket(id: string): Promise<GammaMarketDetail> {
    const { data } = await this.client.get<GammaMarketDetail>(`/markets/${id}`);
    return data;
  }
}
