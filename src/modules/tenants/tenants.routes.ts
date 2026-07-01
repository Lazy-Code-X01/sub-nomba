import { Router, Request, Response, NextFunction } from 'express';
import { createTenantSchema } from './tenants.schema';
import * as svc from './tenants.service';
import { ok } from '../shared/response';

const router = Router();

// POST /tenants: public endpoint, no auth required
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createTenantSchema.parse(req.body);
    const tenant = await svc.createTenant(input);
    res.status(201).json(ok(tenant, 'Tenant created'));
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await svc.listTenants();
    res.json(ok(tenants));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await svc.getTenant(req.params.id);
    res.json(ok(tenant));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await svc.updateTenant(req.params.id, req.body);
    res.json(ok(tenant, 'Tenant updated'));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/rotate-key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await svc.rotateTenantApiKey(req.params.id);
    res.json(ok(tenant, 'API key rotated'));
  } catch (err) {
    next(err);
  }
});

export default router;
