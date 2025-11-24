import axios from 'axios';
import { config } from '../config';
import {
  ClobCreateOrderResponse,
  ClobOrderBook,
  ClobOrdersResponse,
} from '../types/polymarket';

type CreateOrderInput = {
  marketId: string;
  outcomeId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  signature?: string;
};

export class ClobService {
  private client = axios.create({
    baseURL: config.clobBaseUrl,
    timeout: 10_000,
  });

  async getOrderBook(marketId: string): Promise<ClobOrderBook> {
    const { data } = await this.client.get<ClobOrderBook>(
      `/markets/${marketId}/orderbook`
    );
    return data;
  }

  async createOrder(input: CreateOrderInput): Promise<ClobCreateOrderResponse> {
    const payload = {
      market: input.marketId,
      outcome: input.outcomeId,
      side: input.side,
      price: input.price,
      size: input.size,
      signature: input.signature ?? '0x',
    };
    const { data } = await this.client.post<ClobCreateOrderResponse>(
      '/orders',
      payload
    );
    return data;
  }

  async cancelOrder(orderId: string) {
    await this.client.delete(`/orders/${orderId}`);
  }

  async listOrders(wallet: string): Promise<ClobOrdersResponse> {
    const { data } = await this.client.get<ClobOrdersResponse>('/orders', {
      params: { wallet },
    });
    return data;
  }
}
