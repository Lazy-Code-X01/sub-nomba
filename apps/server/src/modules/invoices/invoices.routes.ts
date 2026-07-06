import { Router, Request, Response, NextFunction } from 'express';
import * as svc from './invoices.service';
import { ok } from '../shared/response';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptionId = req.query.subscriptionId as string | undefined;
    const invoices = await svc.listInvoices(req.tenant.id, subscriptionId);
    res.json(ok(invoices));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await svc.getInvoice(req.tenant.id, req.params.id);
    res.json(ok(invoice));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/void', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await svc.voidInvoice(req.tenant.id, req.params.id);
    res.json(ok(invoice, 'Invoice voided'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await svc.createCheckoutForInvoice(req.tenant.id, req.params.id);
    res.json(ok(result, 'Checkout created'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/mark-paid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await svc.markInvoicePaid(req.tenant.id, req.params.id);
    res.json(ok(invoice, 'Invoice marked as paid'));
  } catch (err) {
    next(err);
  }
});

export default router;
