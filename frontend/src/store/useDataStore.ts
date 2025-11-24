import { create } from 'zustand';
import { api } from '../api/client';
import {
  ApiDashboardResponse,
  ApiMarketSummary,
  ApiOrder,
} from '../types/api';

type State = {
  dashboard: ApiDashboardResponse | null;
  markets: ApiMarketSummary[];
  orders: ApiOrder[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  startBot: () => Promise<void>;
  stopBot: () => Promise<void>;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5172/api';

export const useDataStore = create<State>((set, get) => ({
  dashboard: null,
  markets: [],
  orders: [],
  loading: false,
  error: null,
  fetchAll: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const [dashRes, marketsRes, ordersRes] = await Promise.all([
        api.getDashboard(),
        api.getMarkets(),
        api.getOrders(),
      ]);

      set({
        dashboard: dashRes,
        markets: marketsRes,
        orders: ordersRes,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('[fetchAll] error', err?.message ?? err);
      set({ loading: false, error: 'Failed to load data from backend' });
    }
  },
  startBot: async () => {
    try {
      await api.startBot();
      await get().fetchAll();
    } catch (err: any) {
      console.error('[startBot] error', err?.message ?? err);
      set({ error: 'Failed to start bot' });
    }
  },
  stopBot: async () => {
    try {
      await api.stopBot();
      await get().fetchAll();
    } catch (err: any) {
      console.error('[stopBot] error', err?.message ?? err);
      set({ error: 'Failed to stop bot' });
    }
  },
}));
