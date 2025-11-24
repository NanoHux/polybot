import { Router } from 'express';
import {
  cancelOrder,
  createOrder,
  getLiveOrders,
} from '../controllers/orderController';

export const router = Router();

router.get('/', getLiveOrders);
router.post('/create', createOrder);
router.delete('/:id', cancelOrder);
