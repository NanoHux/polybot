import { create } from 'zustand';
import { api } from '../api/client';
import {
  ApiDashboardResponse,
  ApiMarketSummary,
  ApiOrder,
} from '../types/api';

type State = {
  dashboard?: ApiDashboardResponse;
  markets: ApiMarketSummary[];
  orders: ApiOrder[];
  loading: boolean;
  error?: string;
  fetchAll: () => Promise<void>;
  startBot: () => Promise<void>;
  stopBot: () => Promise<void>;
};

export const useDataStore = create<State>((set) => ({
  dashboard: undefined,
  markets: [],
  orders: [],
  loading: false,
  error: undefined,
  fetchAll: async () => {
    set((state) => ({
      loading: !state.dashboard && state.markets.length === 0,
      error: undefined,
    }));
    try {
      const [dashboard, markets, orders] = await Promise.all([
        api.getDashboard(),
        api.getMarkets(),
        api.getOrders(),
      ]);
      set({ dashboard, markets, orders, loading: false });
    } catch (err) {
      set({ error: 'Failed to load data', loading: false });
    }
  },
  startBot: async () => {
    await api.startBot();
    set((state) =>
      state.dashboard
        ? { dashboard: { ...state.dashboard, running: true } }
        : {}
    );
  },
  stopBot: async () => {
    await api.stopBot();
    set((state) =>
      state.dashboard
        ? { dashboard: { ...state.dashboard, running: false } }
        : {}
    );
  },
}));
