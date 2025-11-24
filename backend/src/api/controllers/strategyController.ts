import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import {
  getBotState,
  setBotState,
  startBot,
  stopBot,
} from '../../jobs/scheduler';

export function startStrategy(_req: Request, res: Response) {
  startBot();
  res.json({ success: true, message: 'Bot started' });
}

export function stopStrategy(_req: Request, res: Response) {
  stopBot();
  res.json({ success: true, message: 'Bot stopped' });
}

export async function setStrategyConfig(req: Request, res: Response) {
  const body = req.body as {
    name?: string;
    maxCapitalPerMarket?: number;
    minExpectedApr?: number;
    allowedTags?: string[];
    params?: Record<string, unknown>;
    isActive?: boolean;
  };

  const name = body.name ?? 'default';
  const config = await prisma.strategyConfig.upsert({
    where: { name },
    update: {
      maxCapitalPerMarket: body.maxCapitalPerMarket,
      minExpectedApr: body.minExpectedApr,
      allowedTags: body.allowedTags,
      params: body.params as unknown as object | undefined,
      isActive: body.isActive ?? true,
    },
    create: {
      name,
      maxCapitalPerMarket: body.maxCapitalPerMarket,
      minExpectedApr: body.minExpectedApr,
      allowedTags: body.allowedTags ?? [],
      params: body.params as unknown as object | undefined,
      isActive: body.isActive ?? true,
    },
  });

  res.json({ success: true, config });
}

export function getStrategyStatus(_req: Request, res: Response) {
  res.json(getBotState());
}

export function setSchedulerState(req: Request, res: Response) {
  const { running } = req.body as { running: boolean };
  if (running) startBot();
  else stopBot();
  res.json(getBotState());
}
