import { Router, Request, Response, NextFunction } from 'express';
import { createPlanSchema, updatePlanSchema, prorationSchema } from './plans.schema';
import * as svc from './plans.service';
import { ok } from '../shared/response';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createPlanSchema.parse(req.body);
    const plan = await svc.createPlan(req.tenant.id, input);
    res.status(201).json(ok(plan, 'Plan created'));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await svc.listPlans(req.tenant.id);
    res.json(ok(plans));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await svc.getPlan(req.tenant.id, req.params.id);
    res.json(ok(plan));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = updatePlanSchema.parse(req.body);
    const plan = await svc.updatePlan(req.tenant.id, req.params.id, input);
    res.json(ok(plan, 'Plan updated'));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await svc.deletePlan(req.tenant.id, req.params.id);
    res.json(ok(plan, 'Plan deactivated'));
  } catch (err) {
    next(err);
  }
});

router.post('/proration/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldPlanId, newPlanId, daysRemainingInCycle, billingDays } = prorationSchema.parse(
      req.body
    );
    const result = await svc.previewProration(
      req.tenant.id,
      oldPlanId,
      newPlanId,
      daysRemainingInCycle,
      billingDays
    );
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
});

export default router;
