import axios from 'axios';
import {
  ApiDashboardResponse,
  ApiMarketSummary,
  ApiOrder,
} from '../types/api';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5172/api',
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
    const { data } = await client.get<{ orders: ApiOrder[] }>('/orders');
    return data.orders;
  },
  async startBot() {
    await client.post('/strategy/start');
  },
  async stopBot() {
    await client.post('/strategy/stop');
  },
};
