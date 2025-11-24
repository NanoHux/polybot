import { Router } from 'express';
import {
  cancelOrder,
  createOrder,
  listOrders,
} from '../controllers/orderController';

export const router = Router();

router.get('/', listOrders);
router.post('/create', createOrder);
router.delete('/:id', cancelOrder);
