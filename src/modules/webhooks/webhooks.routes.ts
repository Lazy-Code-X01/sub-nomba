import { Router, Request, Response, NextFunction } from 'express';
import * as svc from './webhooks.service';
import { ok } from '../shared/response';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await svc.listWebhookEvents(req.tenant.id);
    res.json(ok(events));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await svc.getWebhookEvent(req.tenant.id, req.params.id);
    res.json(ok(event));
  } catch (err) {
    next(err);
  }
});

export default router;
