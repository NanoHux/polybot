import { Router } from 'express';
import {
  getStrategyStatus,
  setStrategyConfig,
  startStrategy,
  stopStrategy,
} from '../controllers/strategyController';

export const router = Router();

router.get('/status', getStrategyStatus);
router.post('/start', startStrategy);
router.post('/stop', stopStrategy);
router.patch('/config', setStrategyConfig);
