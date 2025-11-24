import axios from 'axios';
import { config } from '../config';
import { GammaMarketDetail, GammaMarketsResponse } from '../types/polymarket';

export class GammaService {
  private client = axios.create({
    baseURL: config.gammaBaseUrl,
    timeout: 10_000,
  });

  async listMarkets(): Promise<GammaMarketsResponse> {
    const { data } = await this.client.get<any>('/markets');
    // If data is an array, wrap it in an object with a 'markets' property
    if (Array.isArray(data)) {
      return { markets: data };
    }
    // If data already has a 'markets' property, return it as is
    if (data && Array.isArray(data.markets)) {
      return data;
    }
    // Fallback/Empty
    return { markets: [] };
  }

  async getMarket(id: string): Promise<GammaMarketDetail> {
    const { data } = await this.client.get<GammaMarketDetail>(`/markets/${id}`);
    return data;
  }
}
