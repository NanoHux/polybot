import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';

export const router = Router();

router.get('/', getDashboard);
