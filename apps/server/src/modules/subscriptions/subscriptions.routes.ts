import { Router, Request, Response, NextFunction } from 'express';
import { SubscriptionStatus } from '@prisma/client';
import {
  createSubscriptionSchema,
  changeSubscriptionStatusSchema,
  changePlanSchema,
} from './subscriptions.schema';
import * as svc from './subscriptions.service';
import { createInvoice } from '../invoices/invoices.service';
import { prisma } from '../../db/client';
import { AppError } from '../../middleware/error-handler';
import { ok } from '../shared/response';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createSubscriptionSchema.parse(req.body);
    const sub = await svc.createSubscription(req.tenant.id, input);
    res.status(201).json(ok(sub, 'Subscription created'));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as SubscriptionStatus | undefined;
    const subs = await svc.listSubscriptions(req.tenant.id, status);
    res.json(ok(subs));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await svc.getSubscription(req.tenant.id, req.params.id);
    res.json(ok(sub));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event } = changeSubscriptionStatusSchema.parse(req.body);
    const sub = await svc.applyStatusEvent(req.tenant.id, req.params.id, event);
    res.json(ok(sub, `Subscription status updated to ${sub.status}`));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await svc.cancelSubscription(req.tenant.id, req.params.id);
    res.json(ok(sub, 'Subscription cancelled'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await svc.pauseSubscription(req.tenant.id, req.params.id);
    res.json(ok(sub, 'Subscription paused'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resume', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await svc.resumeSubscription(req.tenant.id, req.params.id);
    res.json(ok(sub, 'Subscription resumed'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/change-plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = changePlanSchema.parse(req.body);
    const result = await svc.changePlan(req.tenant.id, req.params.id, input);
    res.json(ok(result, 'Plan changed'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/bill-now', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: { plan: true },
    });
    if (!sub) throw new AppError(404, 'Subscription not found');
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new AppError(400, 'Cannot bill a cancelled subscription');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const invoice = await createInvoice(
      req.tenant.id,
      sub.id,
      sub.customerId,
      sub.plan.amount,
      sub.plan.currency,
      dueDate,
    );
    res.status(201).json(ok(invoice, 'Invoice created'));
  } catch (err) {
    next(err);
  }
});

export default router;
