import { Router } from 'express';
import { router as dashboardRoutes } from './dashboardRoutes';
import { router as marketRoutes } from './marketRoutes';
import { router as orderRoutes } from './orderRoutes';
import { router as strategyRoutes } from './strategyRoutes';
import { router as debugRoutes } from './debugRoutes';

export const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/markets', marketRoutes);
router.use('/orders', orderRoutes);
router.use('/strategy', strategyRoutes);
router.use('/debug', debugRoutes);
