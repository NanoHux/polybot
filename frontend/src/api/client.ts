import axios from 'axios';
import {
  ApiDashboardResponse,
  ApiMarketSummary,
  ApiOrder,
} from '../types/api';

const client = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

export const api = {
  async getDashboard() {
    const { data } = await client.get<ApiDashboardResponse>('/dashboard');
    return data;
  },
  async getMarkets() {
    const { data } = await client.get<ApiMarketSummary[]>('/markets');
    return data;
  },
  async getOrders() {
    const { data } = await client.get<ApiOrder[]>('/orders');
    return data;
  },
  async startBot() {
    const { data } = await client.post<{ success: boolean; message?: string }>(
      '/strategy/start'
    );
    return data;
  },
  async stopBot() {
    const { data } = await client.post<{ success: boolean; message?: string }>(
      '/strategy/stop'
    );
    return data;
  },
};
