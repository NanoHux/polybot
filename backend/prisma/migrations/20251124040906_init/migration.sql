-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "marketId" TEXT NOT NULL,
    "question" TEXT,
    "slug" TEXT,
    "outcomeYesId" TEXT,
    "outcomeNoId" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "status" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketIncentiveConfig" (
    "id" SERIAL NOT NULL,
    "marketId" INTEGER NOT NULL,
    "minIncentiveSize" DECIMAL(65,30),
    "maxIncentiveSpread" DECIMAL(65,30),
    "rewardPoolTotal" DECIMAL(65,30),
    "epochStart" TIMESTAMP(3),
    "epochEnd" TIMESTAMP(3),
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketIncentiveConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "clobOrderId" TEXT,
    "outcomeId" TEXT,
    "side" "OrderSide" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "size" DECIMAL(65,30) NOT NULL,
    "filledSize" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "isStrategyManaged" BOOLEAN NOT NULL DEFAULT true,
    "placedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "raw" JSONB,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderBookSnapshot" (
    "id" SERIAL NOT NULL,
    "marketId" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "bestBid" DECIMAL(65,30),
    "bestAsk" DECIMAL(65,30),
    "midPrice" DECIMAL(65,30),
    "depthJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderBookSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityReward" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "marketId" INTEGER NOT NULL,
    "epochStart" TIMESTAMP(3) NOT NULL,
    "epochEnd" TIMESTAMP(3) NOT NULL,
    "rewardAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rewardToken" TEXT NOT NULL DEFAULT 'USDC',
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PnlSnapshot" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "totalEquity" DECIMAL(65,30),
    "totalRewards" DECIMAL(65,30),
    "realizedPnl" DECIMAL(65,30),
    "unrealizedPnl" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PnlSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategyConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxCapitalPerMarket" DECIMAL(65,30),
    "minExpectedApr" DECIMAL(65,30),
    "allowedTags" TEXT[],
    "params" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunLog" (
    "id" SERIAL NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "RunLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Market_marketId_key" ON "Market"("marketId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_clobOrderId_key" ON "Order"("clobOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "StrategyConfig_name_key" ON "StrategyConfig"("name");

-- AddForeignKey
ALTER TABLE "MarketIncentiveConfig" ADD CONSTRAINT "MarketIncentiveConfig_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderBookSnapshot" ADD CONSTRAINT "OrderBookSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityReward" ADD CONSTRAINT "LiquidityReward_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityReward" ADD CONSTRAINT "LiquidityReward_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PnlSnapshot" ADD CONSTRAINT "PnlSnapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
