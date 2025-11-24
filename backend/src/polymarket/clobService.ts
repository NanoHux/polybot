import { ClobOrderBook, ClobOrdersResponse, OpenOrder, SimplifiedMarketsResponse } from '../types/polymarket';
import {
  CancelMarketOrdersRequest,
  CancelOrdersResponse,
  PlaceOrderResponse,
  PlaceOrdersBatchRequest,
  PlaceOrdersBatchResponse,
  PlaceOrderSingleRequest,
} from '../types/polymarketOrders';
import { getClobClient } from './clobClient';

export type ListOrdersFilters = {
  market?: string;
  assetId?: string;
  id?: string;
};

export class ClobService {
  // ========= Public data via SDK =========
  async getOrderBook(marketId: string): Promise<ClobOrderBook> {
    const client = await getClobClient();
    const book = await (client as any).getOrderBook(marketId);
    return book as ClobOrderBook;
  }

  async getBookByTokenId(tokenId: string): Promise<ClobOrderBook> {
    const client = await getClobClient();
    const book = await (client as any).getOrderBook(tokenId);
    return book as ClobOrderBook;
  }

  async getSimplifiedMarkets(cursor?: string): Promise<SimplifiedMarketsResponse> {
    const client = await getClobClient();
    if ((client as any).getSimplifiedMarkets) {
      const resp = await (client as any).getSimplifiedMarkets(cursor);
      return resp as SimplifiedMarketsResponse;
    }
    const resp = await (client as any).getMarkets(cursor);
    return resp as SimplifiedMarketsResponse;
  }

  // ========= Authenticated via SDK =========
  async listActiveOrders(filters: ListOrdersFilters = {}): Promise<ClobOrdersResponse> {
    try {
      const client = await getClobClient();
      const params: any = {};
      if (filters.market) params.market = filters.market;
      if (filters.assetId) params.asset_id = filters.assetId;
      if (filters.id) params.id = filters.id;

      let orders: OpenOrder[] | undefined;
      if ((client as any).getOpenOrders) {
        orders = await (client as any).getOpenOrders(params);
      } else if ((client as any).getOrders) {
        orders = await (client as any).getOrders(params);
      }
      return { orders: orders ?? [] };
    } catch (err) {
      const axErr = err as any;
      console.error('[ClobService] listActiveOrders failed', axErr?.response?.data || axErr);
      return { orders: [] };
    }
  }

  async getOrder(id: string): Promise<OpenOrder | null> {
    try {
      const client = await getClobClient();
      const order = await client.getOrder(id);
      return order as OpenOrder;
    } catch (err) {
      const axErr = err as any;
      console.error('[ClobService] getOrder failed', axErr?.response?.data || axErr);
      return null;
    }
  }

  async createOrder(input: PlaceOrderSingleRequest): Promise<PlaceOrderResponse> {
    const client = await getClobClient();
    const res: any = await (client as any).createAndPostOrder?.(
      input.order,
      input.owner,
      input.orderType
    );
    return {
      orderId: res?.orderId ?? res?.id ?? '',
      status: res?.status ?? 'submitted',
      ...res,
    };
  }

  async createOrdersBatch(input: PlaceOrdersBatchRequest): Promise<PlaceOrdersBatchResponse> {
    const client = await getClobClient();
    const res: any = await (client as any).postOrders?.(input.PostOrder);
    return res ?? { results: [] };
  }

  async cancelOrder(orderId: string): Promise<CancelOrdersResponse> {
    const client = await getClobClient();
    const res: any = await (client as any).cancelOrder?.({ id: orderId }) ??
      (client as any).cancelOrders?.([orderId]);
    return res ?? { canceled: [], not_canceled: {} };
  }

  async cancelOrders(orderIDs: string[]): Promise<CancelOrdersResponse> {
    const client = await getClobClient();
    const res: any = await (client as any).cancelOrders?.(orderIDs);
    return res ?? { canceled: [], not_canceled: {} };
  }

  async cancelAll(): Promise<CancelOrdersResponse> {
    const client = await getClobClient();
    const res: any = await (client as any).cancelAll?.();
    return res ?? { canceled: [], not_canceled: {} };
  }

  async cancelMarketOrders(input: CancelMarketOrdersRequest): Promise<CancelOrdersResponse> {
    const client = await getClobClient();
    if ((client as any).cancelMarketOrders) {
      const res: any = await (client as any).cancelMarketOrders(input);
      return res ?? { canceled: [], not_canceled: {} };
    }
    const orders = await this.listActiveOrders({ market: input.market, assetId: input.asset_id });
    const ids = orders.orders.map((o) => o.id);
    if (!ids.length) return { canceled: [], not_canceled: {} };
    return this.cancelOrders(ids);
  }
}
