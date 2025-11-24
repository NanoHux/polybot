import { Router } from 'express';
import { getMarketDetail, getMarkets } from '../controllers/marketController';

export const router = Router();

router.get('/', getMarkets);
router.get('/:id', getMarketDetail);
