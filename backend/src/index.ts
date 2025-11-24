import cors from 'cors';
import express from 'express';
import { router as apiRouter } from './api/routes';
import { initScheduler } from './jobs/scheduler';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api', apiRouter);

  return app;
}

// Start cron jobs on boot; individual jobs gate on bot state where needed.
initScheduler();
