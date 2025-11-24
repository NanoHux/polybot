export interface SignedOrder {
  salt: string;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  expiration: string;
  nonce: string;
  feeRateBps: string;
  side: 'BUY' | 'SELL';
  signature: string;
  // ...other fields as per Polymarket spec
}

export interface PlaceOrderSingleRequest {
  order: SignedOrder;
  owner: string;
  orderType: 'FOK' | 'GTC' | 'GTD';
}

export interface PlaceOrderResponse {
  orderId: string;
  status: string;
  [key: string]: any;
}

export interface PostOrder {
  order: SignedOrder;
  orderType: 'FOK' | 'GTC' | 'GTD' | 'FAK';
  owner: string;
}

export interface PlaceOrdersBatchRequest {
  PostOrder: PostOrder[];
}

export interface PlaceOrdersBatchResponse {
  results: {
    orderId: string;
    status: string;
    error?: string;
  }[];
}

export interface CancelOrderRequest {
  orderID: string;
}

export interface CancelOrdersRequest {
  orderIDs: string[];
}

export interface CancelOrdersResponse {
  canceled: string[];
  not_canceled: Record<string, string>;
}

export interface CancelMarketOrdersRequest {
  market?: string;
  asset_id?: string;
}
