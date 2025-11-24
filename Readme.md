1. 🏗 技术栈（固定，不可变）
Backend（固定）

Node.js 20+

TypeScript

Express.js（REST API）

Prisma ORM（PostgreSQL）

PostgreSQL（本地 Brew 或 Docker）

node-cron（定时任务）

axios（Polymarket API 调用）

polymarket/clob-client（官方 CLOB 下单 SDK）

Frontend（固定）

React 18+

TypeScript

Vite

Zustand（状态管理）

ECharts（炫酷数据可视化）

Ant Design（组件库）

2. 📡 依赖的 Polymarket 官方 API（必须实现）

下面这些 API 都在官方文档中存在。AI Agent 必须严格按这些 URL 调用。

2.1 🔵 Polymarket Gamma API（市场信息 / 奖励信息）

Base URL:

https://gamma-api.polymarket.com

(1) 获取全部市场列表

GET /markets

Example Request:
GET https://gamma-api.polymarket.com/markets

Example Response:
{
  "markets": [
    {
      "id": "123",
      "question": "Will Bitcoin be above $100k by 2025?",
      "slug": "btc-100k-2025",
      "status": "open",
      "outcomes": [
        {"name": "Yes", "id": "o-1"},
        {"name": "No", "id": "o-2"}
      ],
      "startDate": "2024-05-01T00:00:00Z",
      "endDate": "2025-12-31T23:59:59Z"
    }
  ]
}

(2) 获取单个市场详细信息（含 LP 激励区间）

GET /markets/{market-id}

GET https://gamma-api.polymarket.com/markets/123


返回字段包含：

minIncentiveSize

maxIncentiveSpread

liquidityReward（奖励池信息）

Example Response:
{
  "id": "123",
  "minIncentiveSize": "50",
  "maxIncentiveSpread": "0.05",
  "reward": {
    "epochStart": "2024-11-20T00:00:00Z",
    "epochEnd": "2024-11-27T00:00:00Z",
    "rewardPool": "13000"
  }
}

(3) 获取奖励池分配记录（历史奖励）

GET /rewards/market/{market-id}

GET https://gamma-api.polymarket.com/rewards/market/123

2.2 🔴 Polymarket CLOB Trading API（自动挂单/撤单）

Base URL：

https://clob.polymarket.com

(1) Submit Order（提交订单）

POST /orders

Request Body:
{
  "market": "123",
  "outcome": "o-1",
  "side": "BUY",
  "price": 0.55,
  "size": 100,
  "signature": "0x..."
}

Response:
{
  "order_id": "ord-123456",
  "status": "open"
}

(2) Cancel Order

DELETE /orders/{order-id}

(3) 获取订单列表

GET /orders?wallet={address}

Response:

{
  "orders": [
    {
      "order_id": "ord-123456",
      "status": "open",
      "price": "0.54",
      "size": 100
    }
  ]
}

(4) 获取 OrderBook（盘口深度）

GET /markets/{market-id}/orderbook

Response:

{
  "bids": [
    {"price": "0.52", "size": "200"},
    {"price": "0.51", "size": "250"}
  ],
  "asks": [
    {"price": "0.55", "size": "180"},
    {"price": "0.56", "size": "300"}
  ]
}

3. 🛢 数据库设计（PostgreSQL）

使用 Prisma ORM，以下结构固定不可变：

3.1 markets

缓存市场信息（来自 Gamma API）

3.2 market_incentive_configs

保存 minIncentiveSize / maxIncentiveSpread / rewardPool 等奖励计算参数

3.3 orders

机器人在 Polymarket 下的所有订单

3.4 liquidity_rewards

历史奖励，每个 epoch 一个记录

3.5 pnl_snapshots

每天定时估值：

总权益

未实现盈亏

累积奖励

3.6 strategy_configs

策略参数（挂单层数、spread 宽度、单市场最大资金等）

3.7 run_logs

系统运行日志

4. 🧠 后端 API 设计（Express）

要求：前端全部调用这些 API，不调用 Polymarket 官方 API。

Base URL:

http://localhost:3001/api

4.1 市场数据
GET /api/markets

返回市场列表 + 激励参数。

Response:

[
  {
    "id": 123,
    "question": "...",
    "minIncentiveSize": "50",
    "maxIncentiveSpread": "0.05"
  }
]

GET /api/markets/:id

返回单市场详情（含订单簿 + 你的仓位）。

4.2 挂单管理
POST /api/orders/create

下挂单 → 后端调用 CLOB API → 保存数据库。

Request:

{
  "marketId": "123",
  "outcome": "o-1",
  "side": "BUY",
  "price": 0.54,
  "size": 30
}

DELETE /api/orders/:id

撤订单。

4.3 策略控制
POST /api/strategy/start

开始自动化 LP 运行（启动 cron）。

POST /api/strategy/stop

停止运行。

PATCH /api/strategy/config

修改策略参数。

4.4 数据 & 监控
GET /api/dashboard

用于前端「炫酷仪表盘」显示：

当前总资产

奖励累计

每市场 APR

当前挂单深度

Bot 运行状态

5. 🖥 前端功能需求（不设计 UI，只写功能）

前端目标：炫酷 / 动态 / 实时更新

必须包含以下功能模块：

(1) Dashboard（炫酷总览）

显示累计奖励（ECharts 动态动画）

显示当前总资金估值

显示每个市场的：

mid price

spread

预估 APR

(2) Markets（市场列表）

展示所有市场（来自 /api/markets）

点击进入详情

高亮显示激励区间

(3) Order Panel（挂单面板）

展示当前所有挂单

显示距离 mid price 的 spread

支持点击撤单

(4) Rewards（奖励中心）

每小时刷新一次奖励

可按市场查看奖励曲线

使用 ECharts 做渐变折线图效果

(5) Bot Control（机器人控制中心）

启动 / 停止 Bot

修改策略参数（spread、深度、最大资本等）

6. 🔧 后端任务调度（cron）

Bot 运行周期：

任务	周期	功能
MarketSync	每 5 分钟	同步市场列表 & 激励参数
OrderBookSync	每 30 秒	更新 target orders
StrategyTick	每 30 秒	生成挂单/撤单动作
RewardSync	每 1 小时	同步奖励池
PnLSnapshot	每 1 小时	记录资产估值
7. 🧩 运行方式（macOS）
安装 PostgreSQL
brew install postgresql
brew services start postgresql

安装依赖
npm install

启动后端
npm run dev:server

启动前端
npm run dev:web

8. 📦 所有固定依赖包（Backend + Frontend）
Backend
npm install express cors axios dotenv prisma @prisma/client pg node-cron
npm install polymarket/clob-client
npm install typescript ts-node-dev --save-dev

Frontend
npm install react react-dom zustand echarts antd axios
npm install typescript vite --save-dev


一、Prisma schema.prisma 完整版

假设文件路径：backend/prisma/schema.prisma
DB：PostgreSQL（DATABASE_URL 用 ENV）

// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OrderSide {
  BUY
  SELL
}

enum OrderStatus {
  OPEN
  PARTIALLY_FILLED
  FILLED
  CANCELLED
}

enum LogLevel {
  INFO
  WARN
  ERROR
}

model Wallet {
  id        Int      @id @default(autoincrement())
  address   String   @unique
  label     String?

  orders    Order[]
  rewards   LiquidityReward[]
  pnl       PnlSnapshot[]

  createdAt DateTime @default(now())
}

model Market {
  id             Int       @id @default(autoincrement())
  marketId       String    @unique // Polymarket market ID (string)
  question       String?
  slug           String?
  outcomeYesId   String?
  outcomeNoId    String?
  category       String?
  tags           String[]  // e.g. ["US_ELECTION", "POLITICS"]
  status         String?   // open/closed/resolved...
  startsAt       DateTime?
  endsAt         DateTime?

  incentiveConfigs MarketIncentiveConfig[]
  orders           Order[]
  rewards          LiquidityReward[]
  orderBookSnaps   OrderBookSnapshot[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model MarketIncentiveConfig {
  id                 Int      @id @default(autoincrement())
  market             Market   @relation(fields: [marketId], references: [id])
  marketId           Int
  minIncentiveSize   Decimal? // from Gamma API
  maxIncentiveSpread Decimal? // from Gamma API
  rewardPoolTotal    Decimal? // current epoch reward pool
  epochStart         DateTime?
  epochEnd           DateTime?

  raw                Json?    // full raw Gamma/Rewards response

  createdAt          DateTime @default(now())
}

model Order {
  id              Int         @id @default(autoincrement())
  wallet          Wallet      @relation(fields: [walletId], references: [id])
  walletId        Int

  market          Market      @relation(fields: [marketId], references: [id])
  marketId        Int

  clobOrderId     String?     @unique // returned by CLOB
  outcomeId       String?     // outcome ID, e.g. "o-1"
  side            OrderSide
  price           Decimal
  size            Decimal
  filledSize      Decimal     @default(0)
  status          OrderStatus @default(OPEN)
  isStrategyManaged Boolean   @default(true)

  placedAt        DateTime
  updatedAt       DateTime    @updatedAt
  raw             Json?       // raw payload from CLOB
}

model OrderBookSnapshot {
  id          Int      @id @default(autoincrement())
  market      Market   @relation(fields: [marketId], references: [id])
  marketId    Int

  capturedAt  DateTime
  bestBid     Decimal?
  bestAsk     Decimal?
  midPrice    Decimal?
  depthJson   Json? // full orderbook or top N levels

  createdAt   DateTime @default(now())
}

model LiquidityReward {
  id           Int      @id @default(autoincrement())
  wallet       Wallet   @relation(fields: [walletId], references: [id])
  walletId     Int

  market       Market   @relation(fields: [marketId], references: [id])
  marketId     Int

  epochStart   DateTime
  epochEnd     DateTime
  rewardAmount Decimal   // USDC amount
  rewardToken  String    @default("USDC")
  raw          Json?

  createdAt    DateTime @default(now())
}

model PnlSnapshot {
  id            Int      @id @default(autoincrement())
  wallet        Wallet   @relation(fields: [walletId], references: [id])
  walletId      Int

  capturedAt    DateTime
  totalEquity   Decimal? // estimated equity based on mid prices
  totalRewards  Decimal? // cumulative rewards
  realizedPnl   Decimal? 
  unrealizedPnl Decimal?

  createdAt     DateTime @default(now())
}

model StrategyConfig {
  id                  Int      @id @default(autoincrement())
  name                String   @unique
  isActive            Boolean  @default(true)

  maxCapitalPerMarket Decimal? // per-market cap
  minExpectedApr      Decimal? // filter markets by expected APR
  allowedTags         String[] // tag filter, e.g. ["POLITICS", "MACRO"]

  params              Json?    // JSON object of strategy parameters

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model RunLog {
  id        Int      @id @default(autoincrement())
  runAt     DateTime @default(now())
  level     LogLevel @default(INFO)
  message   String
  details   Json?
}

二、Express 项目结构 & 核心骨架

假设后端路径：backend/

2.1 目录结构建议
backend/
  prisma/
    schema.prisma
  src/
    index.ts              // 入口：创建 Express app
    config.ts             // 配置 & env
    server.ts             // http server 启动
    lib/
      prisma.ts           // PrismaClient 单例
      logger.ts           // 简单日志封装
    polymarket/
      gammaService.ts     // 调 Gamma API
      clobService.ts      // 调 CLOB API
      rewardsService.ts   // 奖励相关 API 封装
    strategy/
      strategyEngine.ts   // strategyTick 核心逻辑
      marketSelector.ts   // 市场筛选/打分
      quoteGenerator.ts   // 生成目标挂单
      riskManager.ts      // 风控过滤
    jobs/
      scheduler.ts        // node-cron 定时任务入口
      marketSyncJob.ts
      orderSyncJob.ts
      rewardsSyncJob.ts
      pnlSnapshotJob.ts
    api/
      routes/
        index.ts
        dashboardRoutes.ts
        marketRoutes.ts
        orderRoutes.ts
        strategyRoutes.ts
      controllers/
        dashboardController.ts
        marketController.ts
        orderController.ts
        strategyController.ts
    types/
      api.ts              // REST API 的类型
      polymarket.ts       // Polymarket API 的类型
      domain.ts           // Domain 层类型（策略使用）
  package.json
  tsconfig.json
  .env

2.2 src/index.ts（创建 app）
// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { router as apiRouter } from './api/routes';
import { initScheduler } from './jobs/scheduler';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(json());

  app.use('/api', apiRouter);

  return app;
}

// 初始化定时任务
initScheduler();

2.3 src/server.ts（启动服务）
// backend/src/server.ts
import { createApp } from './index';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error on bootstrap', err);
  process.exit(1);
});

2.4 src/lib/prisma.ts
// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

2.5 src/api/routes/index.ts
// backend/src/api/routes/index.ts
import { Router } from 'express';
import { router as dashboardRoutes } from './dashboardRoutes';
import { router as marketRoutes } from './marketRoutes';
import { router as orderRoutes } from './orderRoutes';
import { router as strategyRoutes } from './strategyRoutes';

export const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/markets', marketRoutes);
router.use('/orders', orderRoutes);
router.use('/strategy', strategyRoutes);

2.6 路由示例：marketRoutes.ts
// backend/src/api/routes/marketRoutes.ts
import { Router } from 'express';
import { getMarkets, getMarketDetail } from '../controllers/marketController';

export const router = Router();

router.get('/', getMarkets);
router.get('/:id', getMarketDetail);

2.7 控制器示例：marketController.ts
// backend/src/api/controllers/marketController.ts
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export async function getMarkets(req: Request, res: Response) {
  const markets = await prisma.market.findMany({
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  res.json(
    markets.map((m) => ({
      id: m.id,
      marketId: m.marketId,
      question: m.question,
      status: m.status,
      minIncentiveSize: m.incentiveConfigs[0]?.minIncentiveSize ?? null,
      maxIncentiveSpread: m.incentiveConfigs[0]?.maxIncentiveSpread ?? null,
      rewardPoolTotal: m.incentiveConfigs[0]?.rewardPoolTotal ?? null,
    }))
  );
}

export async function getMarketDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const market = await prisma.market.findUnique({
    where: { id },
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      orders: true,
    },
  });

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  res.json(market);
}

三、strategyTick() 自动挂单核心逻辑（TS 模板）

文件建议：backend/src/strategy/strategyEngine.ts
核心思路：

读取当前启用策略

找出可做 LP 的市场

拉取每个市场的 orderbook（CLOB）

生成目标挂单（QuoteGenerator）

与当前 open 订单对比 → 决定新挂单 & 撤单

调用 CLOB API & 更新数据库

// backend/src/strategy/strategyEngine.ts
import { prisma } from '../lib/prisma';
import { GammaService } from '../polymarket/gammaService';
import { ClobService } from '../polymarket/clobService';
import { MarketSelector } from './marketSelector';
import { QuoteGenerator } from './quoteGenerator';
import { RiskManager } from './riskManager';
import { OrderSide, OrderStatus } from '@prisma/client';

const gammaService = new GammaService();
const clobService = new ClobService();
const marketSelector = new MarketSelector();
const quoteGenerator = new QuoteGenerator();
const riskManager = new RiskManager();

/**
 * strategyTick:
 * 每次执行一轮完整的：
 * 1. 选市场
 * 2. 拉盘口
 * 3. 生成目标挂单
 * 4. 风控过滤
 * 5. 下单 & 撤单
 */
export async function strategyTick() {
  // 1. 读取当前启用策略
  const strategy = await prisma.strategyConfig.findFirst({
    where: { isActive: true },
  });

  if (!strategy) {
    console.log('[strategyTick] No active strategy, skipping');
    return;
  }

  // 2. 找出候选市场（从 DB + Gamma 数据）
  const dbMarkets = await prisma.market.findMany({
    include: {
      incentiveConfigs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    where: {
      status: 'open',
    },
  });

  const selectedMarkets = marketSelector.selectMarketsForLp(
    dbMarkets,
    strategy
  );

  if (selectedMarkets.length === 0) {
    console.log('[strategyTick] No markets selected');
    return;
  }

  // 假设只有一个钱包
  const wallet = await prisma.wallet.findFirst();
  if (!wallet) {
    console.warn('[strategyTick] No wallet configured');
    return;
  }

  for (const m of selectedMarkets) {
    try {
      console.log(`[strategyTick] Processing market ${m.marketId}`);

      // 3. 从 CLOB 拉取 orderbook
      const orderbook = await clobService.getOrderBook(m.marketId);

      // 4. 生成目标挂单（在 maxIncentiveSpread 内，size >= minIncentiveSize）
      const incentiveConfig = m.incentiveConfigs[0];
      const targetQuotes = quoteGenerator.generateQuotes({
        market: m,
        orderbook,
        incentiveConfig,
        strategy,
      });

      // 5. 风控过滤
      const filteredQuotes = await riskManager.filterQuotes({
        walletId: wallet.id,
        market: m,
        quotes: targetQuotes,
        strategy,
      });

      // 6. 获取当前 open 订单
      const openOrders = await prisma.order.findMany({
        where: {
          walletId: wallet.id,
          marketId: m.id,
          status: OrderStatus.OPEN,
          isStrategyManaged: true,
        },
      });

      // 7. 计算 diff：哪些要撤、哪些要下
      const {
        ordersToCancel,
        ordersToCreate,
      } = diffOrders(openOrders, filteredQuotes);

      // 8. 执行撤单
      for (const o of ordersToCancel) {
        await clobService.cancelOrder(o.clobOrderId!);
        await prisma.order.update({
          where: { id: o.id },
          data: { status: OrderStatus.CANCELLED },
        });
      }

      // 9. 执行新挂单
      for (const q of ordersToCreate) {
        const clobOrder = await clobService.createOrder({
          marketId: m.marketId,
          outcomeId: q.outcomeId,
          side: q.side,
          price: q.price,
          size: q.size,
        });

        await prisma.order.create({
          data: {
            walletId: wallet.id,
            marketId: m.id,
            clobOrderId: clobOrder.order_id,
            outcomeId: q.outcomeId,
            side: q.side === 'BUY' ? OrderSide.BUY : OrderSide.SELL,
            price: q.price,
            size: q.size,
            filledSize: 0,
            status: OrderStatus.OPEN,
            isStrategyManaged: true,
            placedAt: new Date(),
            raw: clobOrder,
          },
        });
      }
    } catch (err) {
      console.error('[strategyTick] Error on market', m.marketId, err);
    }
  }
}

// 计算订单 diff 的简单实现
type TargetQuote = {
  outcomeId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
};

function diffOrders(
  openOrders: { id: number; outcomeId: string | null; side: OrderSide; price: any; size: any; }[],
  targetQuotes: TargetQuote[]
) {
  const ordersToCancel: typeof openOrders = [];
  const ordersToCreate: TargetQuote[] = [];

  // 简单策略：只要不完全匹配（同 outcome + side + price + size），就重建
  for (const o of openOrders) {
    const match = targetQuotes.find(
      (q) =>
        q.outcomeId === o.outcomeId &&
        q.side === (o.side === OrderSide.BUY ? 'BUY' : 'SELL') &&
        Number(q.price) === Number(o.price) &&
        Number(q.size) === Number(o.size)
    );

    if (!match) {
      ordersToCancel.push(o);
    }
  }

  // 有 targetQuote 但没有对应 openOrder → 创建
  for (const q of targetQuotes) {
    const match = openOrders.find(
      (o) =>
        o.outcomeId === q.outcomeId &&
        (o.side === OrderSide.BUY ? 'BUY' : 'SELL') === q.side &&
        Number(o.price) === Number(q.price) &&
        Number(o.size) === Number(q.size)
    );
    if (!match) {
      ordersToCreate.push(q);
    }
  }

  return { ordersToCancel, ordersToCreate };
}


GammaService / ClobService / MarketSelector / QuoteGenerator / RiskManager 可以再用单独文件让 Agent 填充实现细节（HTTP 调用 + 规则逻辑）。

四、前后端共享 TypeScript 类型定义

建议放在 backend/src/types 和项目根 /shared/ 目录中，以便前后端共用。

4.1 types/polymarket.ts（官方 API 响应模型）
// backend/src/types/polymarket.ts

// Gamma API: GET /markets
export interface GammaMarketsResponse {
  markets: GammaMarket[];
}

export interface GammaMarket {
  id: string;
  question: string;
  slug?: string;
  status: string;
  outcomes?: GammaOutcome[];
  startDate?: string;
  endDate?: string;
  // ...其他字段按需扩展
}

export interface GammaOutcome {
  id: string;
  name: string;
}

// Gamma API: GET /markets/{id}
export interface GammaMarketDetail extends GammaMarket {
  minIncentiveSize?: string;
  maxIncentiveSpread?: string;
  reward?: {
    epochStart: string;
    epochEnd: string;
    rewardPool: string;
  };
}

// CLOB API: GET /markets/{market-id}/orderbook
export interface ClobOrderBook {
  bids: ClobOrderLevel[];
  asks: ClobOrderLevel[];
}

export interface ClobOrderLevel {
  price: string;
  size: string;
}

// CLOB API: POST /orders
export interface ClobCreateOrderRequest {
  market: string;
  outcome: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  signature: string;
}

export interface ClobCreateOrderResponse {
  order_id: string;
  status: string;
}

// CLOB API: GET /orders?wallet={address}
export interface ClobOrdersResponse {
  orders: ClobOrder[];
}

export interface ClobOrder {
  order_id: string;
  status: string;
  price: string;
  size: string;
  market: string;
  outcome: string;
  // ...
}

4.2 types/api.ts（后端 REST API 数据）
// backend/src/types/api.ts

// GET /api/markets
export interface ApiMarketSummary {
  id: number;
  marketId: string;
  question: string | null;
  status: string | null;
  minIncentiveSize: string | null;
  maxIncentiveSpread: string | null;
  rewardPoolTotal: string | null;
}

// GET /api/dashboard
export interface ApiDashboardResponse {
  totalEquity: number;
  totalRewards: number;
  realizedPnl: number;
  unrealizedPnl: number;
  running: boolean;
  markets: ApiMarketKpi[];
}

export interface ApiMarketKpi {
  marketId: string;
  question: string | null;
  currentApr: number | null;
  myLiquidityShare: number | null;
}

// POST /api/orders/create
export interface ApiCreateOrderRequest {
  marketId: string;  // Polymarket marketId
  outcome: string;   // outcome id
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
}

export interface ApiCreateOrderResponse {
  orderId: number;       // local DB id
  clobOrderId: string;   // polymarket order id
}

// POST /api/strategy/start / stop
export interface ApiStrategyToggleResponse {
  success: boolean;
  message?: string;
}

// PATCH /api/strategy/config
export interface ApiStrategyConfigUpdateRequest {
  maxCapitalPerMarket?: number;
  minExpectedApr?: number;
  allowedTags?: string[];
  params?: Record<string, any>;
}

4.3 types/domain.ts（策略使用的中间模型）
// backend/src/types/domain.ts

import { Market, MarketIncentiveConfig, StrategyConfig } from '@prisma/client';
import { ClobOrderBook } from './polymarket';

export interface LpCandidateMarket extends Market {
  incentiveConfigs: MarketIncentiveConfig[];
}

export interface QuoteGeneratorInput {
  market: LpCandidateMarket;
  orderbook: ClobOrderBook;
  incentiveConfig?: MarketIncentiveConfig;
  strategy: StrategyConfig;
}

export interface GeneratedQuote {
  outcomeId: string;
  side: 'BUY' | 'SELL';
  price: number; // 0~1
  size: number;
}


这样 QuoteGenerator.generateQuotes() 就可以直接用 QuoteGeneratorInput 和 GeneratedQuote，RiskManager.filterQuotes() 也可以沿用这些类型。