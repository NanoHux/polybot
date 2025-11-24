import cron from 'node-cron';
import { strategyTick } from '../strategy/strategyEngine';
import { runMarketSync } from './marketSyncJob';
import { runOrderSync } from './orderSyncJob';
import { runRewardsSync } from './rewardsSyncJob';
import { runPnlSnapshot } from './pnlSnapshotJob';

let schedulerStarted = false;
let botRunning = false;

export function initScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  cron.schedule('*/5 * * * *', () => runMarketSync());
  cron.schedule('*/30 * * * * *', () => runOrderSync());
  cron.schedule('*/30 * * * * *', () => {
    if (!botRunning) return;
    return strategyTick();
  });
  cron.schedule('0 * * * *', () => runRewardsSync());
  cron.schedule('0 * * * *', () => runPnlSnapshot());
}

export function startBot() {
  botRunning = true;
}

export function stopBot() {
  botRunning = false;
}

export function isBotRunning() {
  return botRunning;
}

export function getBotState() {
  return { running: botRunning, schedulerStarted };
}

export function setBotState(running: boolean) {
  if (running) startBot();
  else stopBot();
}
