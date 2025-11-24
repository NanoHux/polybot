import { Router } from 'express';
import { ClobService } from '../../polymarket/clobService';

const clobService = new ClobService();
export const router = Router();

router.get('/orders', async (_req, res) => {
  try {
    const orders = await clobService.listActiveOrders();
    res.json({ ok: true, orders });
  } catch (err: any) {
    console.error('[debug] /api/debug/orders failed', err?.response?.data || err);
    res
      .status(500)
      .json({ ok: false, error: err?.response?.data || String(err) });
  }
});
